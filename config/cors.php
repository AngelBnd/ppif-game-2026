<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The SPA and the API are served from the same origin in production, so
    | browsers never send these requests as cross-origin in the first place.
    | This is only exercised by a separately-hosted frontend (e.g. the Vite
    | dev server during local development). Origins are explicit rather than
    | "*" so the admin/session APIs can't be read from an arbitrary site.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', env('APP_URL', 'http://localhost')))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // The SPA never makes credentialed cross-origin requests (session
    // cookies only travel same-origin here) - leave this off so a future
    // misconfiguration of allowed_origins can't also leak authenticated data.
    'supports_credentials' => false,

];
