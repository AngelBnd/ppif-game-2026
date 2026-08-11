<?php

namespace App\Http\Controllers\Api;

use App\Events\AnswerSubmitted;
use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\GameSession;
use App\Models\LeaderboardEntry;
use App\Models\Player;
use App\Models\StepProgress;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    /**
     * Slack added to a step's time_limit_seconds before the server refuses a
     * submission. The countdown every phone renders is computed from the same
     * activated_at this checks against, but the tap still has to travel over
     * the venue WiFi - without a little headroom a player who answered on the
     * last visible second would be told they were too late.
     */
    private const TIME_LIMIT_GRACE_SECONDS = 3;

    public function store(Request $request, string $code)
    {
        $validated = $request->validate([
            'device_token' => ['required', 'string'],
            'answer_text' => ['required', 'string', 'max:255'],
        ]);

        $session = GameSession::whereCode($code)->with('currentStep')->firstOrFail();

        abort_if(
            $session->currentStep?->type !== 'answer',
            422,
            'Current step is not an answer step.',
        );

        $player = Player::where('device_token', $validated['device_token'])->firstOrFail();

        abort_unless(
            $player->team->game_session_id === $session->id,
            403,
            'This player does not belong to this session.',
        );

        $progress = StepProgress::where('game_session_id', $session->id)
            ->where('step_id', $session->current_step_id)
            ->whereNull('deactivated_at')
            ->firstOrFail();

        // The countdown was previously enforced by the client alone: the only
        // real deadline was the PIC eventually pressing Next, so a team that
        // let the visible timer run out could still submit and still score.
        $deadline = $session->currentStep->effectiveTimeLimitSeconds() + self::TIME_LIMIT_GRACE_SECONDS;

        abort_if(
            $progress->activated_at->diffInSeconds(now(), absolute: true) > $deadline,
            422,
            'Waktu untuk soal ini sudah habis.',
        );

        $alreadyAnswered = Answer::where('team_id', $player->team_id)
            ->where('step_id', $session->current_step_id)
            ->exists();

        abort_if($alreadyAnswered, 409, 'This team has already answered this question.');

        $isCorrect = trim(mb_strtolower($validated['answer_text']))
            === trim(mb_strtolower($session->currentStep->correct_answer ?? ''));

        $answer = Answer::create([
            'game_session_id' => $session->id,
            'team_id' => $player->team_id,
            'player_id' => $player->id,
            'step_id' => $session->current_step_id,
            'answer_text' => $validated['answer_text'],
            'is_correct' => $isCorrect,
            'response_time_ms' => (int) round(abs(now()->diffInMilliseconds($progress->activated_at))),
            'submitted_at' => now(),
        ]);

        if ($isCorrect) {
            $player->team->increment('score');
        }

        $leaderboard = LeaderboardEntry::firstOrCreate(
            ['team_id' => $player->team_id],
            [
                'game_session_id' => $session->id,
                'class_name' => $session->class_name,
                'team_name' => $player->team->name,
            ],
        );

        $leaderboard->total_answers++;
        $leaderboard->total_response_time_ms += $answer->response_time_ms;
        $leaderboard->last_answered_at = now();

        if ($isCorrect) {
            $leaderboard->correct_answers++;
            $leaderboard->score++;
        }

        $leaderboard->save();

        event(new AnswerSubmitted($session, $answer));

        return response()->json([
            'is_correct' => $isCorrect,
            'response_time_ms' => $answer->response_time_ms,
        ], 201);
    }
}
