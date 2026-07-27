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

        // PIC inputs the two group numbers as "1/2" - use them as the team
        // names so the leaderboard can tell groups apart. Falls back to
        // generic names if the format doesn't match (e.g. left blank).
        $groupNumbers = null;
        if (! empty($validated['class_name']) && preg_match('/^\s*(\d+)\s*\/\s*(\d+)\s*$/', $validated['class_name'], $matches)) {
            $groupNumbers = [$matches[1], $matches[2]];
        }

        $session = DB::transaction(function () use ($validated, $firstStep, $groupNumbers) {
            $session = GameSession::create([
                'code' => $this->generateUniqueCode(),
                'class_name' => $validated['class_name'] ?? null,
                'status' => 'waiting',
                'current_step_id' => $firstStep->id,
            ]);

            $session->teams()->createMany([
                ['name' => $groupNumbers ? "Kelompok {$groupNumbers[0]}" : 'Kelompok A'],
                ['name' => $groupNumbers ? "Kelompok {$groupNumbers[1]}" : 'Kelompok B'],
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
            'team_id' => ['required', 'integer'],
        ]);

        $session = GameSession::where('code', $code)->firstOrFail();

        [$player, $team] = DB::transaction(function () use ($session, $validated) {
            // Lock the team row so two devices tapping the same team at the
            // same time can't both slip into the last slot.
            $team = Team::where('id', $validated['team_id'])
                ->where('game_session_id', $session->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_if(
                $team->players()->count() >= GameSession::MAX_PLAYERS_PER_TEAM,
                409,
                'Kelompok ini sudah penuh.',
            );

            $player = $team->players()->create([
                'device_token' => (string) Str::uuid(),
                'joined_at' => now(),
            ]);

            return [$player, $team];
        });

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new PlayerJoined($session));

        return response()->json([
            'device_token' => $player->device_token,
            'player' => ['id' => $player->id],
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
