<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Step extends Model
{
    use HasFactory;

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

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function stepProgress(): HasMany
    {
        return $this->hasMany(StepProgress::class);
    }
}
