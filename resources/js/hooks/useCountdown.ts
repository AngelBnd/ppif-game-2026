import { useEffect, useState } from 'react';

/**
 * Seconds remaining until `startedAt + durationSeconds`, ticking every
 * 250ms. Recomputed from the wall-clock difference each tick (not
 * decremented locally) so it self-corrects after a backgrounded tab,
 * a slow render, or a player reloading mid-question - it always reflects
 * the real time left rather than drifting from when the timer "started"
 * on this particular device.
 */
export function useCountdown(
    startedAt: string | null | undefined,
    durationSeconds: number | null | undefined,
): number | null {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!startedAt || !durationSeconds) {
            setRemaining(null);
            return;
        }

        const startMs = new Date(startedAt).getTime();

        const tick = () => {
            const elapsedSeconds = (Date.now() - startMs) / 1000;
            setRemaining(Math.max(0, Math.ceil(durationSeconds - elapsedSeconds)));
        };

        tick();
        const id = setInterval(tick, 250);

        return () => clearInterval(id);
    }, [startedAt, durationSeconds]);

    return remaining;
}
