<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'name',
        'score',
        'hp',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
