import { useCallback, useEffect, useState } from 'react';
import type { SessionInfo } from '@/types/gameSession';

const STORAGE_KEY = 'ppif_admin_session_code';

export function useAdminSession() {
    const [session, setSession] = useState<SessionInfo | null>(null);
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
        const savedCode = localStorage.getItem(STORAGE_KEY);
        if (!savedCode) return;

        setIsLoading(true);
        fetchByCode(savedCode)
            .catch(() => localStorage.removeItem(STORAGE_KEY))
            .finally(() => setIsLoading(false));
    }, [fetchByCode]);

    const createSession = useCallback(async (className?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/game-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_name: className ?? null }),
            });

            if (!res.ok) throw new Error('Failed to create session');

            const body = await res.json();
            localStorage.setItem(STORAGE_KEY, body.data.code);
            setSession(body.data);

            return body.data as SessionInfo;
        } catch (err) {
            setError((err as Error).message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const advanceSession = useCallback(async () => {
        if (!session) throw new Error('No active session');

        const res = await fetch(`/api/game-sessions/${session.code}/advance`, {
            method: 'PATCH',
        });

        if (!res.ok) throw new Error('Failed to advance session');

        const body = await res.json();
        setSession(body.data);

        return body.data as SessionInfo;
    }, [session]);

    const refresh = useCallback(() => {
        if (!session) return Promise.resolve(null);
        return fetchByCode(session.code);
    }, [session, fetchByCode]);

    return { session, isLoading, error, createSession, advanceSession, refresh };
}
