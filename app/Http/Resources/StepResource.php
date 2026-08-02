<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The shape of a step everywhere it is safe to publish it.
 *
 * `content` is deliberately not here: it holds each question and its
 * multiple-choice options, and /api/steps is unauthenticated and served
 * before a game starts, so shipping the whole set up front let anyone read -
 * and prepare answers for - every question in advance. The live question
 * travels with the session instead (GameSessionResource::current_step adds
 * `content` on top of this), for the one step that is actually active.
 *
 * `correct_answer` was already withheld by Step::$hidden and stays out here
 * too - see SessionController::withCorrectAnswer for the admin-only path
 * that adds it back.
 */
class StepResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order' => $this->order,
            'slug' => $this->slug,
            'type' => $this->type,
            'title' => $this->title,
            // Resolved rather than raw, so the countdown the client renders
            // is the same number AnswerController enforces against.
            'time_limit_seconds' => $this->effectiveTimeLimitSeconds(),
        ];
    }
}
