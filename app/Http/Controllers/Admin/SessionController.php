<?php

namespace App\Http\Controllers\Admin;

use App\Events\StepAdvanced;
use App\Http\Controllers\Controller;
use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use App\Models\LeaderboardEntry;
use App\Models\Step;
use App\Models\StepProgress;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
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

        $userId = $request->user()->id;

        $session = DB::transaction(function () use ($validated, $firstStep, $groupNumbers, $userId) {
            $session = GameSession::create([
                'user_id' => $userId,
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

    /**
     * The authenticated PIC's current (non-finished) session, if any - used
     * to resume after a page reload without depending on localStorage.
     */
    public function mine(Request $request)
    {
        $session = GameSession::where('user_id', $request->user()->id)
            ->where('status', '!=', 'finished')
            ->latest('id')
            ->with(['teams.players', 'currentStep'])
            ->first();

        return response()->json([
            'data' => $session ? new GameSessionResource($session) : null,
        ]);
    }

    /**
     * Advance the session's current step. Restricted to the PIC who owns
     * this session (or the monitoring admin) - previously this was a public
     * endpoint, letting anyone who knew a room's code hijack its pacing.
     */
    public function advance(Request $request, string $code)
    {
        $session = GameSession::where('code', $code)->with('currentStep')->firstOrFail();

        abort_unless(
            $session->user_id === $request->user()->id || $request->user()->is_admin,
            403,
            'This is not your session.',
        );

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

    /**
     * Admin-only: every session across every room, plus the leaderboard.
     */
    public function overview(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);

        $sessions = GameSession::with(['user:id,name', 'currentStep:id,title,slug', 'teams'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (GameSession $session) => [
                'id' => $session->id,
                'code' => $session->code,
                'class_name' => $session->class_name,
                'status' => $session->status,
                'pic' => $session->user?->name,
                'current_step' => $session->currentStep?->title,
                'teams' => $session->teams->map(fn ($team) => [
                    'name' => $team->name,
                    'score' => $team->score,
                    'hp' => $team->hp,
                ]),
                'updated_at' => $session->updated_at,
            ]);

        $leaderboard = LeaderboardEntry::orderByDesc('score')
            ->orderBy('total_response_time_ms')
            ->get(['class_name', 'team_name', 'score', 'correct_answers', 'total_answers', 'total_response_time_ms']);

        return response()->json([
            'sessions' => $sessions,
            'leaderboard' => $leaderboard,
        ]);
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = (string) random_int(100000, 999999);
        } while (GameSession::where('code', $code)->exists());

        return $code;
    }
}
