<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Same nonce is used for both the CSP header and any inline <script>
     * tags Blade renders during this request (Vite's own tags pick it up
     * automatically once set; Ziggy's @routes needs it passed explicitly).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();

        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Browsers dropped the built-in XSS auditor after it turned out to
        // introduce its own vulnerabilities - OWASP now recommends turning
        // it off explicitly and relying on CSP instead.
        $response->headers->set('X-XSS-Protection', '0');

        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // php.ini's expose_php and nginx's server_tokens add their own
        // version-disclosure headers outside of Laravel's response object -
        // PHP queues X-Powered-By via the SAPI directly, so removing it from
        // $response->headers alone has no effect; header_remove() is what
        // actually drops it before send. This repo can't change php.ini or
        // nginx.conf, so this is a backstop, not the real fix.
        header_remove('X-Powered-By');

        // Skip CSP while the Vite dev server is serving assets: its tags
        // point at a different origin (http://localhost:5173) and inject
        // extra inline scripts (React Refresh) that a locked-down policy
        // would legitimately block. Built assets (staging/production) are
        // same-origin and nonce-covered, so the full policy applies there.
        if (! Vite::isRunningHot()) {
            $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($nonce));
        }

        return $response;
    }

    private function contentSecurityPolicy(string $nonce): string
    {
        $reverb = config('broadcasting.connections.reverb.options', []);
        $wsHost = $reverb['host'] ?? null;
        $wsPort = $reverb['port'] ?? null;
        $wsConnect = $wsHost ? "ws://{$wsHost}:{$wsPort} wss://{$wsHost}:{$wsPort}" : '';

        $directives = [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            // React sets inline style properties via the CSSOM, which CSP
            // doesn't gate - 'unsafe-inline' here only covers actual style
            // attributes/<style> tags, not script execution.
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
            "font-src 'self' https://fonts.bunny.net",
            "img-src 'self' data: blob:",
            // blob: is needed here (not just img-src) because GLTFLoader's
            // embedded textures get fetch()'d from a blob: URL it creates
            // itself - img-src only covers <img>/CSS url(), not fetch/XHR.
            "connect-src 'self' https://fonts.bunny.net blob: {$wsConnect}",
            "media-src 'self'",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ];

        return implode('; ', $directives);
    }
}
