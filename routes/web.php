<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\SessionController as AdminSessionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->middleware('throttle:admin');
    Route::get('/me', [AdminAuthController::class, 'me'])->middleware('throttle:admin');

    Route::middleware(['auth', 'throttle:admin'])->group(function () {
        Route::post('/game-sessions', [AdminSessionController::class, 'store']);
        Route::get('/my-session', [AdminSessionController::class, 'mine']);
        Route::patch('/game-sessions/{code}/advance', [AdminSessionController::class, 'advance']);
        Route::patch('/game-sessions/{code}/boss/start', [AdminSessionController::class, 'startBossPhase']);
        Route::delete('/game-sessions/{code}/players/{player}', [AdminSessionController::class, 'removePlayer']);
        Route::delete('/game-sessions/{code}', [AdminSessionController::class, 'destroy']);
        Route::get('/overview', [AdminSessionController::class, 'overview']);
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Registered last on purpose. Laravel matches in registration order, so with
// this above the profile group its `.*` swallowed GET /profile and served the
// SPA shell instead - PATCH/DELETE still worked, leaving the group half-dead.
// Any new server-rendered route must go above this line too.
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

// Breeze's register/login/password-reset routes are intentionally not
// wired in - PIC/admin accounts are seeded by an organizer only, and all
// auth goes through Admin\AuthController's JSON endpoints above. Loading
// auth.php would reopen public self-registration.
