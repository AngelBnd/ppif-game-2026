<?php

use App\Http\Controllers\Api\AnswerController;
use App\Http\Controllers\Api\BossFightController;
use App\Http\Controllers\Api\GameSessionController;
use App\Http\Controllers\Api\StepController;
use Illuminate\Support\Facades\Route;

Route::get('/steps', [StepController::class, 'index']);

Route::get('/game-sessions/{code}', [GameSessionController::class, 'show']);
Route::post('/game-sessions/{code}/join', [GameSessionController::class, 'join']);
Route::post('/game-sessions/{code}/answers', [AnswerController::class, 'store']);
Route::post('/game-sessions/{code}/boss/taps', [BossFightController::class, 'tap']);
