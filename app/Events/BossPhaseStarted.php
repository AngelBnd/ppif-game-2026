<?php

namespace App\Events;

use App\Models\GameSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Queue\SerializesModels;

/**
 * The PIC pressed START for a boss phase - this is what un-pauses every
 * player's screen and lets taps count again.
 *
 * @see StepAdvanced for why ShouldRescue is needed here too.
 */
class BossPhaseStarted implements ShouldBroadcastNow, ShouldRescue
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
        return 'boss.phase-started';
    }

    public function broadcastWith(): array
    {
        return [
            'boss_phase' => $this->session->boss_phase,
            'boss_hp' => $this->session->boss_hp,
            'boss_hp_max' => $this->session->bossPhaseMaxHp(),
            'boss_phase_started_at' => $this->session->boss_phase_started_at?->toISOString(),
        ];
    }
}
