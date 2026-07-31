import { useCallback, useEffect, useState } from 'react';
import { echo } from '@/echo';
import { getXsrfToken } from '@/utils/csrf';
import type { BossTapResult, SessionInfo } from '@/types/gameSession';

export function useAdminSession(enabled: boolean) {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // True until the initial "does this PIC account already have an active
    // session" lookup has resolved. AdminFlowPage must wait for this before
    // deciding to show the create-session form - otherwise it races the
    // restore fetch below and creates an orphan session on every reload.
    const [isRestoring, setIsRestoring] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchByCode = useCallback(async (code: string) => {
        const res = await fetch(`/api/game-sessions/${code}`);
        if (!res.ok) throw new Error('Session not found');
        const body = await res.json();
        setSession(body.data);
        return body.data as SessionInfo;
    }, []);

    // Resumes the PIC's current session by account, not by localStorage -
    // survives cleared browser storage, incognito, or switching devices.
    useEffect(() => {
        if (!enabled) {
            setIsRestoring(false);
            return;
        }

        setIsRestoring(true);
        fetch('/api/admin/my-session', { headers: { Accept: 'application/json' } })
            .then((res) => res.json())
            .then((body) => {
                if (body.data) setSession(body.data);
            })
            .finally(() => setIsRestoring(false));
    }, [enabled]);

    // Keeps the admin screen live-synced: step changes, players joining
    // (join_count in WaitingRoomPage), and the "X/2 has answered" counter.
    useEffect(() => {
        if (!session) return;

        const channel = echo.channel(`game-session.${session.code}`);

        channel.listen('.step.advanced', (payload: SessionInfo) => {
            setSession((current) => {
                // This admin's own advance() call already applied the new
                // step (with current_step_correct_answer, which this public
                // broadcast can never carry - players share this channel).
                // Re-applying the broadcast copy here would wipe that field.
                if (current?.current_step?.id === payload.current_step?.id) {
                    return current;
                }
                return payload;
            });
        });

        channel.listen('.player.joined', (payload: SessionInfo) => {
            setSession(payload);
        });

        channel.listen('.player.left', (payload: SessionInfo) => {
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
                    // The admin never taps, so this broadcast is the only
                    // way it can learn the fight is over - without this,
                    // boss_finished_at stayed null forever and the "boss
                    // defeated" screen never showed, even though the fight
                    // had actually ended server-side.
                    boss_finished_at: payload.cutscene
                        ? new Date().toISOString()
                        : current.boss_finished_at,
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
            const res = await fetch('/api/admin/game-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ class_name: className ?? null }),
            });

            if (!res.ok) throw new Error('Failed to create session');

            const body = await res.json();
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

        const res = await fetch(`/api/admin/game-sessions/${session.code}/advance`, {
            method: 'PATCH',
            headers: { 'X-XSRF-TOKEN': getXsrfToken() },
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

    // Wipes the current session (and, via cascade, its teams/players/
    // answers/leaderboard rows) so the PIC can start a fresh room.
    const clearSession = useCallback(async () => {
        if (!session) return;

        const res = await fetch(`/api/admin/game-sessions/${session.code}`, {
            method: 'DELETE',
            headers: { 'X-XSRF-TOKEN': getXsrfToken() },
        });

        if (!res.ok) throw new Error('Failed to clear session');

        setSession(null);
    }, [session]);

    return {
        session,
        isLoading,
        isRestoring,
        error,
        createSession,
        advanceSession,
        clearSession,
        refresh,
    };
}
