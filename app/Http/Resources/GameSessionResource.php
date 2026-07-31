<?php

namespace App\Http\Resources;

use App\Models\GameSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'class_name' => $this->class_name,
            'status' => $this->status,
            'current_step' => $this->whenLoaded('currentStep'),
            'current_step_started_at' => $this->currentStepProgress()?->activated_at,
            'started_at' => $this->started_at,
            'finished_at' => $this->finished_at,
            'answered_count' => $this->when(
                $this->current_step_id !== null,
                fn () => $this->answers()->where('step_id', $this->current_step_id)->count(),
            ),
            'boss_phase' => $this->boss_phase,
            'boss_hp' => $this->boss_hp,
            'boss_hp_max' => $this->bossPhaseMaxHp(),
            'boss_finished_at' => $this->boss_finished_at,
            'max_players_per_team' => GameSession::MAX_PLAYERS_PER_TEAM,
            'teams' => $this->whenLoaded('teams', function () {
                return $this->teams->map(fn ($team) => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'number' => $team->number,
                    'score' => $team->score,
                    'hp' => $team->hp,
                    'players' => $team->relationLoaded('players')
                        ? $team->players->map(fn ($player) => [
                            'nickname' => $player->nickname,
                        ])
                        : [],
                ]);
            }),
        ];
    }
}
