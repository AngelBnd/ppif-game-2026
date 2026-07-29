<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    use HasFactory;

    /**
     * HP per boss phase (1-indexed) and the HP floor in phase 3 that
     * triggers the scripted "impossible to win" cutscene instead of a
     * normal phase transition. Placeholder numbers - tune freely.
     */
    public const BOSS_PHASE_MAX_HP = [1 => 120, 2 => 180, 3 => 300];

    public const BOSS_PHASE3_CUTSCENE_THRESHOLD = 15;

    public const MAX_PLAYERS_PER_TEAM = 3;

    protected $fillable = [
        'user_id',
        'code',
        'class_name',
        'status',
        'current_step_id',
        'started_at',
        'finished_at',
        'boss_phase',
        'boss_hp',
        'boss_finished_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'boss_finished_at' => 'datetime',
        ];
    }

    public function bossPhaseMaxHp(): int
    {
        return self::BOSS_PHASE_MAX_HP[$this->boss_phase] ?? 0;
    }

    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(Step::class, 'current_step_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function stepProgress(): HasMany
    {
        return $this->hasMany(StepProgress::class);
    }

    /**
     * The still-active step_progress row for whatever step is current -
     * its activated_at is the shared clock every client's countdown is
     * computed from, instead of each device timing its own local 60s.
     */
    public function currentStepProgress(): ?StepProgress
    {
        if (! $this->current_step_id) {
            return null;
        }

        return $this->stepProgress()
            ->where('step_id', $this->current_step_id)
            ->whereNull('deactivated_at')
            ->latest('activated_at')
            ->first();
    }
}
