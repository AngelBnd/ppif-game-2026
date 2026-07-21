<?php

use App\Http\Controllers\Api\AnswerController;
use App\Http\Controllers\Api\GameSessionController;
use App\Http\Controllers\Api\StepController;
use Illuminate\Support\Facades\Route;

Route::get('/steps', [StepController::class, 'index']);

Route::post('/game-sessions', [GameSessionController::class, 'store']);
Route::get('/game-sessions/{code}', [GameSessionController::class, 'show']);
Route::post('/game-sessions/{code}/join', [GameSessionController::class, 'join']);
Route::patch('/game-sessions/{code}/advance', [GameSessionController::class, 'advance']);
Route::post('/game-sessions/{code}/answers', [AnswerController::class, 'store']);
