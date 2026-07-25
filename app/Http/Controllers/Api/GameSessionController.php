<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\PlayerJoined;
use App\Events\StepAdvanced;
use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use App\Models\Step;
use App\Models\StepProgress;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GameSessionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_name' => ['nullable', 'string', 'max:255'],
        ]);

        $firstStep = Step::orderBy('order')->firstOrFail();

        $session = DB::transaction(function () use ($validated, $firstStep) {
            $session = GameSession::create([
                'code' => $this->generateUniqueCode(),
                'class_name' => $validated['class_name'] ?? null,
                'status' => 'waiting',
                'current_step_id' => $firstStep->id,
            ]);

            $session->teams()->createMany([
                ['name' => 'Kelompok A'],
                ['name' => 'Kelompok B'],
            ]);

            StepProgress::create([
                'game_session_id' => $session->id,
                'step_id' => $firstStep->id,
                'activated_at' => now(),
            ]);

            return $session;
        });

        return new GameSessionResource($session->load('teams.players', 'currentStep'));
    }

    public function show(string $code)
    {
        $session = GameSession::where('code', $code)
            ->with(['teams.players', 'currentStep'])
            ->firstOrFail();

        return new GameSessionResource($session);
    }

    public function join(Request $request, string $code)
    {
        $validated = $request->validate([
            'nickname' => ['required', 'string', 'max:255'],
        ]);

        $session = GameSession::where('code', $code)->with('teams.players')->firstOrFail();

        // Auto-balance: new player goes to whichever team currently has fewer players.
        $team = $session->teams->sortBy(fn ($t) => $t->players->count())->first();

        $player = $team->players()->create([
            'nickname' => $validated['nickname'],
            'device_token' => (string) Str::uuid(),
            'joined_at' => now(),
        ]);

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new PlayerJoined($session));

        return response()->json([
            'device_token' => $player->device_token,
            'player' => ['id' => $player->id, 'nickname' => $player->nickname],
            'team' => ['id' => $team->id, 'name' => $team->name],
            'game_session' => new GameSessionResource($session),
        ], 201);
    }

    public function advance(string $code)
    {
        $session = GameSession::where('code', $code)->with('currentStep')->firstOrFail();

        $nextStep = Step::where('order', $session->currentStep->order + 1)->first();

        if (! $nextStep) {
            $session->update(['status' => 'finished', 'finished_at' => now()]);

            $session = $session->fresh(['teams.players', 'currentStep']);
            event(new StepAdvanced($session));

            return new GameSessionResource($session);
        }

        DB::transaction(function () use ($session, $nextStep) {
            StepProgress::where('game_session_id', $session->id)
                ->whereNull('deactivated_at')
                ->update(['deactivated_at' => now()]);

            StepProgress::create([
                'game_session_id' => $session->id,
                'step_id' => $nextStep->id,
                'activated_at' => now(),
            ]);

            $session->update([
                'current_step_id' => $nextStep->id,
                'status' => 'active',
            ]);

            // Boss fight state (phase/HP) and each team's tap-contribution
            // meter only ever mean something during the boss step - reset
            // them fresh every time a session enters it.
            if ($nextStep->type === 'boss') {
                $session->update([
                    'boss_phase' => 1,
                    'boss_hp' => GameSession::BOSS_PHASE_MAX_HP[1],
                    'boss_finished_at' => null,
                ]);

                Team::where('game_session_id', $session->id)->update(['hp' => 0]);
            }
        });

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new StepAdvanced($session));

        return new GameSessionResource($session);
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = (string) random_int(100000, 999999);
        } while (GameSession::where('code', $code)->exists());

        return $code;
    }
}
