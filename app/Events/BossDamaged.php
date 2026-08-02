<?php

namespace App\Events;

use App\Models\GameSession;
use App\Models\Team;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Queue\SerializesModels;

/** @see StepAdvanced for why ShouldRescue is needed here too. */
class BossDamaged implements ShouldBroadcastNow, ShouldRescue
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public GameSession $session,
        public Team $team,
        public bool $phaseChanged = false,
        public bool $cutscene = false,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('game-session.'.$this->session->code);
    }

    public function broadcastAs(): string
    {
        return 'boss.damaged';
    }

    public function broadcastWith(): array
    {
        return [
            'boss_phase' => $this->session->boss_phase,
            'boss_hp' => $this->session->boss_hp,
            'boss_hp_max' => $this->session->bossPhaseMaxHp(),
            // Null once a phase is cleared: the fight pauses there until the
            // PIC presses START again, which is what re-arms every client.
            'boss_phase_started_at' => $this->session->boss_phase_started_at?->toISOString(),
            'phase_changed' => $this->phaseChanged,
            'cutscene' => $this->cutscene,
            'team_id' => $this->team->id,
            'team_hp' => $this->team->hp,
        ];
    }
}
