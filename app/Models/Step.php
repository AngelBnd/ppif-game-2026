<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Step extends Model
{
    use HasFactory;

    /**
     * Countdown used when a step doesn't set its own time_limit_seconds.
     * Must stay in step with the `?? 60` fallback in both AnswerTheQuestion
     * pages, since that is what players actually see ticking down - the
     * server rejecting an answer the phone still showed as in-time would
     * read as the game eating a submission.
     */
    public const DEFAULT_TIME_LIMIT_SECONDS = 60;

    protected $fillable = [
        'order',
        'slug',
        'type',
        'title',
        'content',
        'correct_answer',
        'time_limit_seconds',
    ];

    protected $hidden = [
        'correct_answer',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    /**
     * The countdown this step is actually played with - its own limit, or the
     * shared default when it hasn't set one.
     */
    public function effectiveTimeLimitSeconds(): int
    {
        return $this->time_limit_seconds ?? self::DEFAULT_TIME_LIMIT_SECONDS;
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function stepProgress(): HasMany
    {
        return $this->hasMany(StepProgress::class);
    }
}
