import { useCallback, useEffect, useState } from 'react';
import { echo } from '@/echo';
import type { BossTapResult, SessionInfo } from '@/types/gameSession';

const CODE_KEY = 'ppif_player_session_code';
const TOKEN_KEY = 'ppif_player_device_token';
const TEAM_KEY = 'ppif_player_team';

type OwnTeam = { id: number; name: string };

export function usePlayerSession() {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [deviceToken, setDeviceToken] = useState<string | null>(() =>
        localStorage.getItem(TOKEN_KEY),
    );
    const [team, setTeam] = useState<OwnTeam | null>(() => {
        const raw = localStorage.getItem(TEAM_KEY);
        return raw ? (JSON.parse(raw) as OwnTeam) : null;
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
            localStorage.setItem(TEAM_KEY, JSON.stringify(body.team));
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
        joinSession,
        submitAnswer,
        submitBossTap,
    };
}
