<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\GameSession;
use App\Models\Player;
use App\Models\StepProgress;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    public function store(Request $request, string $code)
    {
        $validated = $request->validate([
            'device_token' => ['required', 'string'],
            'answer_text' => ['required', 'string', 'max:255'],
        ]);

        $session = GameSession::where('code', $code)->with('currentStep')->firstOrFail();

        abort_if(
            $session->currentStep?->type !== 'answer',
            422,
            'Current step is not an answer step.',
        );

        $player = Player::where('device_token', $validated['device_token'])->firstOrFail();

        $progress = StepProgress::where('game_session_id', $session->id)
            ->where('step_id', $session->current_step_id)
            ->whereNull('deactivated_at')
            ->firstOrFail();

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

        return response()->json([
            'is_correct' => $isCorrect,
            'response_time_ms' => $answer->response_time_ms,
        ], 201);
    }
}
