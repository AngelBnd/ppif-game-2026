<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'team_id',
        'class_name',
        'team_name',
        'score',
        'correct_answers',
        'total_answers',
        'total_response_time_ms',
        'last_answered_at',
    ];

    protected function casts(): array
    {
        return [
            'last_answered_at' => 'datetime',
        ];
    }

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}
