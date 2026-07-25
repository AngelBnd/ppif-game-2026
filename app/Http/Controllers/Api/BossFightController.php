<?php

namespace App\Http\Controllers\Api;

use App\Events\BossDamaged;
use App\Http\Controllers\Controller;
use App\Models\GameSession;
use App\Models\Player;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BossFightController extends Controller
{
    public function tap(Request $request, string $code)
    {
        $validated = $request->validate([
            'device_token' => ['required', 'string'],
            // Client batches taps locally and flushes every ~300ms instead
            // of one request per tap - 50 is a generous ceiling for that
            // window, just there to reject obviously-bogus payloads.
            'taps' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $session = GameSession::where('code', $code)->with('currentStep')->firstOrFail();

        abort_if(
            $session->currentStep?->type !== 'boss',
            422,
            'Current step is not the boss fight.',
        );

        $player = Player::where('device_token', $validated['device_token'])->firstOrFail();

        abort_if($session->boss_finished_at !== null, 409, 'Boss fight already over.');

        [$session, $phaseChanged, $cutscene] = DB::transaction(function () use ($session, $validated) {
            // Re-fetch under a row lock: phase transitions read-then-write
            // based on the current HP, so concurrent tap requests from many
            // devices must not race past each other here.
            $locked = GameSession::whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($locked->boss_finished_at !== null) {
                abort(409, 'Boss fight already over.');
            }

            $newHp = $locked->boss_hp - $validated['taps'];
            $phaseChanged = false;
            $cutscene = false;

            if ($locked->boss_phase < 3 && $newHp <= 0) {
                $locked->boss_phase++;
                $locked->boss_hp = GameSession::BOSS_PHASE_MAX_HP[$locked->boss_phase];
                $phaseChanged = true;
            } elseif ($locked->boss_phase === 3 && $newHp <= GameSession::BOSS_PHASE3_CUTSCENE_THRESHOLD) {
                // Scripted defeat: HP is deliberately left just above zero -
                // the story doesn't let them actually finish the boss off.
                $locked->boss_hp = max($newHp, 0);
                $locked->boss_finished_at = now();
                $cutscene = true;
            } else {
                $locked->boss_hp = max($newHp, 0);
            }

            $locked->save();

            return [$locked, $phaseChanged, $cutscene];
        });

        // Tap-contribution meter - atomic increment, no lock needed.
        $team = Team::findOrFail($player->team_id);
        $team->increment('hp', $validated['taps']);

        $throttleKey = "boss-broadcast-{$session->id}";
        $shouldBroadcast = $phaseChanged || $cutscene
            || Cache::add($throttleKey, true, now()->addMilliseconds(250));

        if ($shouldBroadcast) {
            event(new BossDamaged($session, $team, $phaseChanged, $cutscene));
        }

        return response()->json([
            'boss_phase' => $session->boss_phase,
            'boss_hp' => $session->boss_hp,
            'boss_hp_max' => $session->bossPhaseMaxHp(),
            'phase_changed' => $phaseChanged,
            'cutscene' => $cutscene,
            'team_id' => $team->id,
            'team_hp' => $team->hp,
        ]);
    }
}
