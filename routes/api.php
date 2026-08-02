<?php

use App\Http\Controllers\Api\AnswerController;
use App\Http\Controllers\Api\BossFightController;
use App\Http\Controllers\Api\GameSessionController;
use App\Http\Controllers\Api\StepController;
use Illuminate\Support\Facades\Route;

// Everything here is unauthenticated by design - players have no account,
// only a device_token issued at join time. Laravel 11+ does not put
// `throttle:api` on this group for you, so each route names its own limiter;
// see AppServiceProvider::configureRateLimiting for how they are sized and
// why the busy ones are keyed per device rather than per IP.

Route::middleware('throttle:session-read')->group(function () {
    Route::get('/steps', [StepController::class, 'index']);
    Route::get('/game-sessions/{code}', [GameSessionController::class, 'show']);
});

Route::post('/game-sessions/{code}/join', [GameSessionController::class, 'join'])
    ->middleware('throttle:join');

Route::middleware('throttle:player-action')->group(function () {
    Route::delete('/game-sessions/{code}/leave', [GameSessionController::class, 'leave']);
    Route::post('/game-sessions/{code}/answers', [AnswerController::class, 'store']);
});

Route::post('/game-sessions/{code}/boss/taps', [BossFightController::class, 'tap'])
    ->middleware('throttle:boss-taps');
