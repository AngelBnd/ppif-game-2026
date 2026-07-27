import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);

export const echo = new Echo({
    broadcaster: 'reverb',
    Pusher,
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
});
