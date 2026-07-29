<?php

namespace App\Events;

use App\Models\Answer;
use App\Models\GameSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Queue\SerializesModels;

/** @see StepAdvanced for why ShouldRescue is needed here too. */
class AnswerSubmitted implements ShouldBroadcastNow, ShouldRescue
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public GameSession $session,
        public Answer $answer,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('game-session.'.$this->session->code);
    }

    public function broadcastAs(): string
    {
        return 'answer.submitted';
    }

    /**
     * No answer_text/is_correct on purpose beyond what's already visible to
     * the submitting team via the HTTP response - this event is for the
     * other team/admin screen to know a submission happened, not to leak
     * the content of it.
     */
    public function broadcastWith(): array
    {
        return [
            'team_id' => $this->answer->team_id,
            'step_id' => $this->answer->step_id,
            'answered_count' => $this->session->answers()
                ->where('step_id', $this->answer->step_id)
                ->count(),
        ];
    }
}
