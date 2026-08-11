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
    /**
     * Ceiling on one player's cumulative taps for the current phase:
     * TAP_BURST_ALLOWANCE, plus MAX_TAPS_PER_SECOND for every second since
     * the PIC pressed START.
     *
     * The per-request `max:50` below bounds a single payload but says nothing
     * about how many payloads arrive, so a loop posting {"taps": 50} used to
     * drain every phase and fire the scripted phase-3 cutscene the moment the
     * boss step opened - unrecoverable, since boss_finished_at is then set.
     * Both numbers sit well above what a hand can physically do (an elite
     * tapper manages maybe 12/second), so real players never meet this; it
     * only bites automation. Taps over the ceiling are rejected rather than
     * queued, and the allowance keeps growing, so a player who briefly runs
     * ahead of it is back in budget a second later.
     */
    private const MAX_TAPS_PER_SECOND = 20;

    private const TAP_BURST_ALLOWANCE = 50;

    public function tap(Request $request, string $code)
    {
        $validated = $request->validate([
            'device_token' => ['required', 'string'],
            // Client batches taps locally and flushes every ~300ms instead
            // of one request per tap - 50 is a generous ceiling for that
            // window, just there to reject obviously-bogus payloads.
            'taps' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $session = GameSession::whereCode($code)->with('currentStep')->firstOrFail();

        abort_if(
            $session->currentStep?->type !== 'boss',
            422,
            'Current step is not the boss fight.',
        );

        $player = Player::where('device_token', $validated['device_token'])->firstOrFail();

        abort_unless(
            $player->team->game_session_id === $session->id,
            403,
            'This player does not belong to this session.',
        );

        abort_if($session->boss_finished_at !== null, 409, 'Boss fight already over.');

        // Every phase (including the first) sits paused until the PIC presses
        // START - taps that land in that window are rejected outright rather
        // than being banked against the next phase.
        abort_if($session->boss_phase_started_at === null, 409, 'Boss phase has not started yet.');

        $this->chargeAgainstTapAllowance($session, $player, $validated['taps']);

        [$session, $phaseChanged, $cutscene] = DB::transaction(function () use ($session, $validated) {
            // Re-fetch under a row lock: phase transitions read-then-write
            // based on the current HP, so concurrent tap requests from many
            // devices must not race past each other here.
            $locked = GameSession::whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($locked->boss_finished_at !== null) {
                abort(409, 'Boss fight already over.');
            }

            // Re-checked under the lock: the tap batch that cleared the phase
            // pauses it mid-flight, and other devices' batches are usually
            // already in the air by then.
            if ($locked->boss_phase_started_at === null) {
                abort(409, 'Boss phase has not started yet.');
            }

            $newHp = $locked->boss_hp - $validated['taps'];
            $phaseChanged = false;
            $cutscene = false;

            if ($locked->boss_phase < 3 && $newHp <= 0) {
                $locked->boss_phase++;
                $locked->boss_hp = GameSession::BOSS_PHASE_MAX_HP[$locked->boss_phase];
                // Pause again: the next phase only runs once the PIC says so.
                $locked->boss_phase_started_at = null;
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
            'boss_phase_started_at' => $session->boss_phase_started_at?->toISOString(),
            'phase_changed' => $phaseChanged,
            'cutscene' => $cutscene,
            'team_id' => $team->id,
            'team_hp' => $team->hp,
        ]);
    }

    /**
     * Bills $taps to this player's allowance for the running phase, aborting
     * with 429 if that puts them over it. Rejected taps stay on the tally on
     * purpose - otherwise a script could sit at the ceiling retrying for free.
     */
    private function chargeAgainstTapAllowance(GameSession $session, Player $player, int $taps): void
    {
        $elapsedSeconds = (int) $session->boss_phase_started_at->diffInSeconds(now(), absolute: true);
        $allowance = self::TAP_BURST_ALLOWANCE + (self::MAX_TAPS_PER_SECOND * $elapsedSeconds);

        // The START timestamp is part of the key so a PIC who re-runs the
        // boss step gets a clean tally instead of inheriting the old one and
        // locking players out of a phase that has only just restarted.
        $key = sprintf(
            'boss-taps:%d:%d:%d:%d',
            $session->id,
            $session->boss_phase,
            $session->boss_phase_started_at->getTimestamp(),
            $player->id,
        );

        Cache::add($key, 0, now()->addHour());

        abort_if(
            Cache::increment($key, $taps) > $allowance,
            429,
            'Terlalu cepat - tunggu sebentar.',
        );
    }
}
