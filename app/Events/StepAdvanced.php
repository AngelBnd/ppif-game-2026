<?php

namespace App\Events;

use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Queue\SerializesModels;

/**
 * ShouldRescue: if the Reverb server (VPS) is unreachable, the broadcast
 * fails silently (logged) instead of turning into a 500 on advance() - the
 * game must keep working over plain HTTP even if the "loudspeaker" is down.
 */
class StepAdvanced implements ShouldBroadcastNow, ShouldRescue
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public GameSession $session)
    {
    }

    /**
     * Public channel: players are identified by device_token, not a Laravel
     * auth session, so there's no user to authorize a private channel with.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('game-session.'.$this->session->code);
    }

    public function broadcastAs(): string
    {
        return 'step.advanced';
    }

    /**
     * Same shape usePlayerSession/useAdminSession already get from the
     * GET /api/game-sessions/{code} polling response.
     */
    public function broadcastWith(): array
    {
        return (new GameSessionResource($this->session))->resolve();
    }
}
