<?php

use App\Http\Controllers\Api\GameResultController;
use App\Http\Controllers\Api\GameSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Game Session Routes
Route::prefix('game-sessions')->group(function () {
    Route::post('/start', [GameSessionController::class, 'start']);
    Route::post('/{sessionId}/finish', [GameSessionController::class, 'finish']);
});

// Game Result Routes
Route::prefix('game-results')->group(function () {
    Route::get('/leaderboard', [GameResultController::class, 'leaderboard']);
});
