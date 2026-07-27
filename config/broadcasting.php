<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | This option controls the default broadcaster that will be used by the
    | framework when an event needs to be broadcast. This connection is
    | used when another isn't explicitly specified when broadcasting.
    |
    */

    'default' => env('BROADCAST_CONNECTION', 'null'),

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Only "reverb" is configured here. This app only broadcasts on public
    | channels (players are identified by device_token, not a Laravel auth
    | session), so there is no "pusher" fallback or channel-auth connection
    | to configure.
    |
    */

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'app_id' => env('REVERB_APP_ID'),
            'options' => [
                'host' => env('REVERB_HOST'),
                'port' => env('REVERB_PORT', 443),
                'scheme' => env('REVERB_SCHEME', 'https'),
                'useTLS' => env('REVERB_SCHEME', 'https') === 'https',
            ],
            'client_options' => [
                // Bounded so advance()/answers never hang long if the VPS
                // is unreachable - ShouldRescue on the events still needs
                // this request to fail fast, not just fail eventually.
                'connect_timeout' => 2,
                'timeout' => 3,
            ],
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
