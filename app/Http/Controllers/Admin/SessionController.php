<?php

namespace App\Http\Controllers\Admin;

use App\Events\BossPhaseStarted;
use App\Events\PlayerLeft;
use App\Events\StepAdvanced;
use App\Http\Controllers\Controller;
use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use App\Models\LeaderboardEntry;
use App\Models\Player;
use App\Models\Step;
use App\Models\StepProgress;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    /**
     * Group number -> its actual name, used when naming a session's teams.
     */
    private const GROUP_NAMES = [
        1 => 'Stella', 2 => 'Nexus', 3 => 'Cosmo', 4 => 'Nebula',
        5 => 'Petra', 6 => 'Sirius', 7 => 'Astreon', 8 => 'Draco',
        9 => 'Lunar', 10 => 'Linus', 11 => 'Helios', 12 => 'Orion',
        13 => 'Terra', 14 => 'Aster', 15 => 'Starla', 16 => 'Gamma',
    ];

    /**
     * @return array{0: ?string, 1: string} [group number, group name] - number
     *                                      is null when no group number was given, in which case name is $fallback.
     */
    private function teamName(?string $groupNumber, string $fallback): array
    {
        if ($groupNumber === null) {
            return [null, $fallback];
        }

        return [$groupNumber, self::GROUP_NAMES[(int) $groupNumber] ?? $fallback];
    }

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
                'code' => GameSession::generateUniqueCode(),
                'class_name' => $validated['class_name'] ?? null,
                'status' => 'waiting',
                'current_step_id' => $firstStep->id,
            ]);

            [$number1, $name1] = $this->teamName($groupNumbers[0] ?? null, 'Kelompok A');
            [$number2, $name2] = $this->teamName($groupNumbers[1] ?? null, 'Kelompok B');

            $session->teams()->createMany([
                ['name' => $name1, 'number' => $number1 !== null ? (int) $number1 : null],
                ['name' => $name2, 'number' => $number2 !== null ? (int) $number2 : null],
            ]);

            StepProgress::create([
                'game_session_id' => $session->id,
                'step_id' => $firstStep->id,
                'activated_at' => now(),
            ]);

            return $session;
        });

        return response()->json([
            'data' => $this->withCorrectAnswer($session->load('teams.players', 'currentStep'), $request),
        ]);
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
            'data' => $session ? $this->withCorrectAnswer($session, $request) : null,
        ]);
    }

    /**
     * Advance the session's current step. Restricted to the PIC who owns
     * this session (or the monitoring admin) - previously this was a public
     * endpoint, letting anyone who knew a room's code hijack its pacing.
     */
    public function advance(Request $request, string $code)
    {
        $session = GameSession::whereCode($code)->with('currentStep')->firstOrFail();

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

            return response()->json([
                'data' => $this->withCorrectAnswer($session, $request),
            ]);
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
                    // Paused on arrival: even phase 1 waits for the PIC's
                    // START press, so the fight never begins on its own.
                    'boss_phase_started_at' => null,
                    'boss_finished_at' => null,
                ]);

                Team::where('game_session_id', $session->id)->update(['hp' => 0]);
            }
        });

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new StepAdvanced($session));

        return response()->json([
            'data' => $this->withCorrectAnswer($session, $request),
        ]);
    }

    /**
     * Un-pause the boss fight's current phase. The fight is deliberately
     * inert until the PIC presses START - once for phase 1, and again after
     * each phase is cleared - so the module leads the pacing instead of the
     * players rolling straight from one phase into the next.
     */
    public function startBossPhase(Request $request, string $code)
    {
        $session = GameSession::whereCode($code)->with('currentStep')->firstOrFail();

        abort_unless(
            $session->user_id === $request->user()->id || $request->user()->is_admin,
            403,
            'This is not your session.',
        );

        abort_if(
            $session->currentStep?->type !== 'boss',
            422,
            'Current step is not the boss fight.',
        );

        abort_if($session->boss_finished_at !== null, 409, 'Boss fight already over.');

        // Idempotent: a double-press (or a second PIC device) just gets the
        // current state back instead of restarting the phase's clock.
        if ($session->boss_phase_started_at === null) {
            $session->update(['boss_phase_started_at' => now()]);

            event(new BossPhaseStarted($session));
        }

        $session = $session->fresh(['teams.players', 'currentStep']);

        return response()->json([
            'data' => $this->withCorrectAnswer($session, $request),
        ]);
    }

    /**
     * Remove one player from a team, freeing their slot under
     * MAX_PLAYERS_PER_TEAM.
     *
     * Joining needs nothing but a session code and a nickname, and there are
     * only six slots in a room, so a script can take all of them in under a
     * second. Leaving requires the squatter's own device_token, which they
     * simply won't send - before this the only remedy was destroy(), which
     * takes the session's teams, players, answers and leaderboard rows with
     * it and forces a new code out to the room mid-event.
     */
    public function removePlayer(Request $request, string $code, int $player)
    {
        $session = GameSession::whereCode($code)->firstOrFail();

        abort_unless(
            $session->user_id === $request->user()->id || $request->user()->is_admin,
            403,
            'This is not your session.',
        );

        $player = Player::whereKey($player)
            ->whereHas('team', fn ($query) => $query->where('game_session_id', $session->id))
            ->firstOrFail();

        $player->delete();

        $session = $session->fresh(['teams.players', 'currentStep']);
        event(new PlayerLeft($session));

        return response()->json([
            'data' => $this->withCorrectAnswer($session, $request),
        ]);
    }

    /**
     * GameSessionResource is shared with the public player route and with
     * broadcasts sent over a channel players also listen on, so it can
     * never carry the answer. This bolts it onto the plain array only for
     * these admin-authenticated, request-scoped controller responses.
     */
    private function withCorrectAnswer(GameSession $session, Request $request): array
    {
        $data = (new GameSessionResource($session))->resolve($request);
        $data['current_step_correct_answer'] = $session->currentStep?->correct_answer;

        return $data;
    }

    /**
     * Delete a session (and, via cascade, its teams/players/answers/
     * leaderboard rows) - restricted to the PIC who owns it (or the
     * monitoring admin), lets a PIC wipe a session and start fresh instead
     * of leftover test rooms piling up forever.
     */
    public function destroy(Request $request, string $code)
    {
        $session = GameSession::whereCode($code)->firstOrFail();

        abort_unless(
            $session->user_id === $request->user()->id || $request->user()->is_admin,
            403,
            'This is not your session.',
        );

        $session->delete();

        return response()->noContent();
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
}
