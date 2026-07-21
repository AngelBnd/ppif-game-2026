<?php

namespace App\Http\Resources;

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
            'id' => $this->id,
            'code' => $this->code,
            'class_name' => $this->class_name,
            'status' => $this->status,
            'current_step' => $this->whenLoaded('currentStep'),
            'started_at' => $this->started_at,
            'finished_at' => $this->finished_at,
            'teams' => $this->whenLoaded('teams', function () {
                return $this->teams->map(fn ($team) => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'score' => $team->score,
                    'hp' => $team->hp,
                    'players' => $team->relationLoaded('players')
                        ? $team->players->map(fn ($player) => [
                            'id' => $player->id,
                            'nickname' => $player->nickname,
                        ])
                        : [],
                ]);
            }),
        ];
    }
}
