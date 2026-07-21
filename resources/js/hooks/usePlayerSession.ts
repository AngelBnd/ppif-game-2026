import { useCallback, useEffect, useState } from 'react';
import type { SessionInfo } from '@/types/gameSession';

const CODE_KEY = 'ppif_player_session_code';
const TOKEN_KEY = 'ppif_player_device_token';

export function usePlayerSession() {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [deviceToken, setDeviceToken] = useState<string | null>(() =>
        localStorage.getItem(TOKEN_KEY),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchByCode = useCallback(async (code: string) => {
        const res = await fetch(`/api/game-sessions/${code}`);
        if (!res.ok) throw new Error('Session not found');
        const body = await res.json();
        setSession(body.data);
        return body.data as SessionInfo;
    }, []);

    useEffect(() => {
        const savedCode = localStorage.getItem(CODE_KEY);
        if (!savedCode) return;

        setIsLoading(true);
        fetchByCode(savedCode)
            .catch(() => {
                localStorage.removeItem(CODE_KEY);
                localStorage.removeItem(TOKEN_KEY);
                setDeviceToken(null);
            })
            .finally(() => setIsLoading(false));
    }, [fetchByCode]);

    // Player has no Next button in production — it polls so it follows
    // whatever step the admin advances to.
    useEffect(() => {
        if (!session) return;

        const interval = setInterval(() => {
            fetchByCode(session.code).catch(() => {});
        }, 3000);

        return () => clearInterval(interval);
    }, [session?.code, fetchByCode]);

    const joinSession = useCallback(async (code: string, nickname: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/game-sessions/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname }),
            });

            if (!res.ok) throw new Error('Failed to join session');

            const body = await res.json();
            localStorage.setItem(CODE_KEY, code);
            localStorage.setItem(TOKEN_KEY, body.device_token);
            setDeviceToken(body.device_token);
            setSession(body.game_session);

            return body;
        } catch (err) {
            setError((err as Error).message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitAnswer = useCallback(
        async (answerText: string) => {
            if (!session || !deviceToken) throw new Error('Not joined to a session');

            const res = await fetch(`/api/game-sessions/${session.code}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_token: deviceToken,
                    answer_text: answerText,
                }),
            });

            const body = await res.json();

            if (!res.ok) throw new Error(body.message ?? 'Failed to submit answer');

            return body as { is_correct: boolean; response_time_ms: number };
        },
        [session, deviceToken],
    );

    return { session, deviceToken, isLoading, error, joinSession, submitAnswer };
}
