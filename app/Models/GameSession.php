<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GameSession extends Model
{
    use HasFactory;

    /**
     * Alphabet for session codes: uppercase letters and digits, minus the
     * pairs that get misread off a projector and mistyped on a phone
     * (0/O, 1/I/L).
     *
     * Codes used to be six digits - 900,000 possibilities - while
     * GET /api/game-sessions/{code} is unauthenticated and hands back a
     * room's full state, so walking the space was a realistic way to find a
     * live session to squat or grief. Rate limiting alone is a poor answer
     * here because every phone in the room shares the venue's public IP, so
     * any limit tight enough to stop a scan also locks out the class. At 31
     * characters a six-character code is ~887 million combinations, which
     * puts scanning out of reach without costing anyone a keystroke.
     */
    public const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    public const CODE_LENGTH = 6;

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
        'boss_phase_started_at',
        'boss_finished_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'boss_phase_started_at' => 'datetime',
            'boss_finished_at' => 'datetime',
        ];
    }

    public function bossPhaseMaxHp(): int
    {
        return self::BOSS_PHASE_MAX_HP[$this->boss_phase] ?? 0;
    }

    /**
     * Every lookup by code goes through here. Codes are generated uppercase
     * but arrive off a phone keyboard or out of a URL, and the two databases
     * this runs on disagree about case: MySQL's default collation would let
     * a lowercase code match, SQLite's would not. Normalising in one place
     * keeps that from being something the event day discovers.
     */
    public function scopeWhereCode(Builder $query, string $code): Builder
    {
        return $query->where('code', Str::upper(trim($code)));
    }

    /**
     * A code that is unused right now. The uniqueness check races against a
     * concurrent create, which the unique index on `code` then catches - at
     * ~887 million combinations and a handful of live rooms, a collision is
     * not a case worth writing retry logic around.
     */
    public static function generateUniqueCode(): string
    {
        $lastIndex = strlen(self::CODE_ALPHABET) - 1;

        do {
            $code = '';

            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, $lastIndex)];
            }
        } while (self::whereCode($code)->exists());

        return $code;
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
