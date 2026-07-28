<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\SessionController as AdminSessionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::middleware('auth')->group(function () {
        Route::post('/game-sessions', [AdminSessionController::class, 'store']);
        Route::get('/my-session', [AdminSessionController::class, 'mine']);
        Route::patch('/game-sessions/{code}/advance', [AdminSessionController::class, 'advance']);
        Route::get('/overview', [AdminSessionController::class, 'overview']);
    });
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Breeze's register/login/password-reset routes are intentionally not
// wired in - PIC/admin accounts are seeded by an organizer only, and all
// auth goes through Admin\AuthController's JSON endpoints above. Loading
// auth.php would reopen public self-registration.
