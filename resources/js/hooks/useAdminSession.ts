import { useCallback, useEffect, useState } from 'react';
import { echo } from '@/echo';
import type { BossTapResult, SessionInfo } from '@/types/gameSession';

const STORAGE_KEY = 'ppif_admin_session_code';

export function useAdminSession() {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // True until the initial check of localStorage for a saved session PIN
    // has resolved one way or another. AdminFlowPage must wait for this
    // before deciding to auto-create a new session - otherwise it races
    // the restore fetch below and creates an orphan session on every
    // reload of an admin tab that already had one in progress.
    const [isRestoring, setIsRestoring] = useState(true);
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
        if (!savedCode) {
            setIsRestoring(false);
            return;
        }

        setIsLoading(true);
        fetchByCode(savedCode)
            .catch(() => localStorage.removeItem(STORAGE_KEY))
            .finally(() => {
                setIsLoading(false);
                setIsRestoring(false);
            });
    }, [fetchByCode]);

    // Keeps the admin screen live-synced: step changes, players joining
    // (join_count in WaitingRoomPage), and the "X/2 has answered" counter.
    useEffect(() => {
        if (!session) return;

        const channel = echo.channel(`game-session.${session.code}`);

        channel.listen('.step.advanced', (payload: SessionInfo) => {
            setSession(payload);
        });

        channel.listen('.player.joined', (payload: SessionInfo) => {
            setSession(payload);
        });

        channel.listen(
            '.answer.submitted',
            (payload: { step_id: number; answered_count: number }) => {
                setSession((current) =>
                    current && current.current_step?.id === payload.step_id
                        ? { ...current, answered_count: payload.answered_count }
                        : current,
                );
            },
        );

        channel.listen('.boss.damaged', (payload: BossTapResult) => {
            setSession((current) => {
                if (!current) return current;

                return {
                    ...current,
                    boss_phase: payload.boss_phase,
                    boss_hp: payload.boss_hp,
                    boss_hp_max: payload.boss_hp_max,
                    teams: current.teams.map((t) =>
                        t.id === payload.team_id
                            ? { ...t, hp: payload.team_hp }
                            : t,
                    ),
                };
            });
        });

        return () => {
            echo.leaveChannel(`game-session.${session.code}`);
        };
    }, [session?.code]);

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

    return {
        session,
        isLoading,
        isRestoring,
        error,
        createSession,
        advanceSession,
        refresh,
    };
}
