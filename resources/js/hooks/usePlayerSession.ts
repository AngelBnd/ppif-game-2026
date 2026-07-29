import { useCallback, useEffect, useState } from 'react';
import { echo } from '@/echo';
import type { BossTapResult, SessionInfo } from '@/types/gameSession';

const CODE_KEY = 'ppif_player_session_code';
const TOKEN_KEY = 'ppif_player_device_token';
const TEAM_KEY = 'ppif_player_team';

type OwnTeam = { id: number; name: string };

// localStorage can throw instead of just being unavailable - Safari private
// browsing on older versions, and some in-app browsers (Instagram/TikTok/
// WhatsApp's embedded WebKit views) restrict or block it outright. Since two
// of these run inside a useState initializer during the very first render,
// an uncaught throw there blanks the whole page with no error boundary to
// catch it. These wrappers degrade to "session won't survive a reload"
// instead of crashing.
function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeSetItem(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Nothing else depends on this succeeding.
    }
}

function safeRemoveItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // Nothing else depends on this succeeding.
    }
}

export function usePlayerSession() {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [deviceToken, setDeviceToken] = useState<string | null>(() =>
        safeGetItem(TOKEN_KEY),
    );
    const [team, setTeam] = useState<OwnTeam | null>(() => {
        const raw = safeGetItem(TEAM_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as OwnTeam;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyBossTapResult = useCallback((payload: BossTapResult) => {
        setSession((current) => {
            if (!current) return current;

            return {
                ...current,
                boss_phase: payload.boss_phase,
                boss_hp: payload.boss_hp,
                boss_hp_max: payload.boss_hp_max,
                teams: current.teams.map((t) =>
                    t.id === payload.team_id ? { ...t, hp: payload.team_hp } : t,
                ),
            };
        });
    }, []);

    const fetchByCode = useCallback(async (code: string) => {
        const res = await fetch(`/api/game-sessions/${code}`);
        if (!res.ok) throw new Error('Session not found');
        const body = await res.json();
        setSession(body.data);
        return body.data as SessionInfo;
    }, []);

    // Looks up a session by code without committing to it - used by the
    // join screen to show the two teams (and their current headcount)
    // before the player has actually picked one and joined.
    const peekSession = useCallback(async (code: string) => {
        const res = await fetch(`/api/game-sessions/${code}`);
        if (!res.ok) throw new Error('Invalid unique code.');
        const body = await res.json();
        return body.data as SessionInfo;
    }, []);

    useEffect(() => {
        const savedCode = safeGetItem(CODE_KEY);
        if (!savedCode) return;

        setIsLoading(true);
        fetchByCode(savedCode)
            .catch(() => {
                safeRemoveItem(CODE_KEY);
                safeRemoveItem(TOKEN_KEY);
                setDeviceToken(null);
            })
            .finally(() => setIsLoading(false));
    }, [fetchByCode]);

    // Player has no Next button in production — it follows whatever step
    // the admin advances to via a Reverb broadcast on the session's public
    // channel, instead of polling.
    useEffect(() => {
        if (!session) return;

        const channel = echo.channel(`game-session.${session.code}`);
        channel.listen('.step.advanced', (payload: SessionInfo) => {
            setSession(payload);
        });

        // "X/2 has answered" on the phone HUD - live count of the other
        // team's submissions for the currently active question.
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

        // Boss fight: HP/phase from any player's taps (either team), plus
        // whichever team's contribution meter just moved.
        channel.listen('.boss.damaged', applyBossTapResult);

        return () => {
            echo.leaveChannel(`game-session.${session.code}`);
        };
    }, [session?.code, applyBossTapResult]);

    const joinSession = useCallback(async (code: string, teamId: number, nickname: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/game-sessions/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_id: teamId, nickname }),
            });

            const body = await res.json();

            if (!res.ok) throw new Error(body.message ?? 'Failed to join session');

            safeSetItem(CODE_KEY, code);
            safeSetItem(TOKEN_KEY, body.device_token);
            safeSetItem(TEAM_KEY, JSON.stringify(body.team));
            setDeviceToken(body.device_token);
            setTeam(body.team);
            setSession(body.game_session);

            return body;
        } catch (err) {
            setError((err as Error).message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Quitting of the player's own accord - best-effort removes their
    // Player row server-side (freeing their slot), then always clears local
    // state regardless of whether that request succeeded, so they can get
    // back to the join screen even if the network call fails.
    const leaveSession = useCallback(async () => {
        const code = session?.code;
        const token = deviceToken;

        safeRemoveItem(CODE_KEY);
        safeRemoveItem(TOKEN_KEY);
        safeRemoveItem(TEAM_KEY);
        setDeviceToken(null);
        setTeam(null);
        setSession(null);

        if (!code || !token) return;

        try {
            await fetch(`/api/game-sessions/${code}/leave`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_token: token }),
            });
        } catch {
            // Client-side state is already cleared regardless.
        }
    }, [session?.code, deviceToken]);

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

            if (!res.ok) {
                const err = new Error(body.message ?? 'Failed to submit answer');
                (err as Error & { status?: number }).status = res.status;
                throw err;
            }

            return body as { is_correct: boolean; response_time_ms: number };
        },
        [session, deviceToken],
    );

    const submitBossTap = useCallback(
        async (taps: number) => {
            if (!session || !deviceToken) throw new Error('Not joined to a session');

            const res = await fetch(`/api/game-sessions/${session.code}/boss/taps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_token: deviceToken, taps }),
            });

            const body = await res.json();

            if (!res.ok) throw new Error(body.message ?? 'Failed to register taps');

            // Applied directly (not just via the Echo broadcast) so the
            // tapping device's own screen stays responsive even when the
            // broadcast for this particular batch got throttled.
            applyBossTapResult(body);

            return body as BossTapResult;
        },
        [session, deviceToken, applyBossTapResult],
    );

    return {
        session,
        deviceToken,
        team,
        isLoading,
        error,
        peekSession,
        joinSession,
        leaveSession,
        submitAnswer,
        submitBossTap,
    };
}
