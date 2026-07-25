<?php

namespace App\Events;

use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Queue\SerializesModels;

/** @see StepAdvanced for why ShouldRescue is needed here too. */
class PlayerJoined implements ShouldBroadcastNow, ShouldRescue
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public GameSession $session)
    {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('game-session.'.$this->session->code);
    }

    public function broadcastAs(): string
    {
        return 'player.joined';
    }

    /**
     * Same full-state shape as StepAdvanced, so the admin's WaitingRoomPage
     * can just replace its session state on either event.
     */
    public function broadcastWith(): array
    {
        return (new GameSessionResource($this->session))->resolve();
    }
}
