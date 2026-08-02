<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->configureRateLimiting();
    }

    /**
     * Named limiters for routes/api.php and the admin routes in web.php.
     *
     * Sizing these by IP is the obvious move and the wrong one here: every
     * phone in the room is behind the venue's WiFi, so a whole class shares
     * a single public address. A limit tight enough to be worth having would
     * lock out the event the first time a boss fight got going. The two
     * high-volume routes are keyed by device_token instead - already required
     * by those endpoints, and one per phone - which leaves the per-IP limits
     * for the low-volume routes where the whole room still fits comfortably.
     */
    private function configureRateLimiting(): void
    {
        // The client batches taps locally and flushes every ~300ms, so a
        // device tapping flat out sends roughly 200 requests a minute. This
        // only stops a request flood; the actual damage ceiling is enforced
        // in BossFightController against elapsed phase time.
        RateLimiter::for('boss-taps', fn (Request $request) => Limit::perMinute(300)
            ->by($this->deviceKey($request)));

        // Answering and quitting are one-shot actions - the headroom is for
        // retries after a dropped connection, not for repeated use.
        RateLimiter::for('player-action', fn (Request $request) => Limit::perMinute(20)
            ->by($this->deviceKey($request)));

        // No device_token exists yet at join time, so this has to key by IP.
        // Sized to let a full class join at once while refusing a script that
        // walks sessions filling every team slot it can reach.
        RateLimiter::for('join', fn (Request $request) => Limit::perMinute(20)
            ->by($request->ip()));

        // Read on page load and when the join screen previews a code. See
        // GameSessionController::show for the much tighter, separate budget
        // on lookups that come back empty, which is where code-scanning shows
        // up and where legitimate traffic almost never does.
        RateLimiter::for('session-read', fn (Request $request) => Limit::perMinute(120)
            ->by($request->ip()));

        // PIC/admin endpoints are button presses on one operator's screen and
        // sit behind `auth`, so these key per account rather than per IP.
        RateLimiter::for('admin', fn (Request $request) => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));

        // Keyed by the email being tried as well as the IP: all eight PICs
        // log in from the same venue WiFi, and a flat per-IP limit would let
        // one of them fumbling their password lock out the other seven. The
        // second limit is the per-IP backstop against spraying many accounts.
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(30)->by($request->ip()),
        ]);
    }

    /**
     * Per-phone bucket for the endpoints that already carry a device_token.
     * Hashed so the token never lands in a cache key (or a cache-table dump)
     * in the clear, and falls back to the IP for a malformed request - those
     * fail validation anyway, this just stops them sharing one bucket.
     */
    private function deviceKey(Request $request): string
    {
        $token = $request->input('device_token');

        return is_string($token) && $token !== ''
            ? 'device:'.hash('sha256', $token)
            : 'ip:'.$request->ip();
    }
}
