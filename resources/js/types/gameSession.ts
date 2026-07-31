import type { Step } from './step';

export type TeamInfo = {
    id: number;
    name: string;
    // PIC-assigned group number (1-16) - null when the session had no valid
    // group number and this team got a generic fallback name instead.
    number: number | null;
    score: number;
    hp: number;
    players: { nickname: string }[];
};

export type SessionInfo = {
    code: string;
    class_name: string | null;
    status: 'waiting' | 'active' | 'finished';
    current_step: Step | null;
    // Shared clock every client's countdown is computed from - always
    // present (safe to broadcast). See useCountdown.
    current_step_started_at: string | null;
    // Admin/PIC only - never present for players, see SessionController::withCorrectAnswer.
    current_step_correct_answer?: string | null;
    started_at: string | null;
    finished_at: string | null;
    teams: TeamInfo[];
    max_players_per_team: number;
    answered_count: number;
    boss_phase: number;
    boss_hp: number;
    boss_hp_max: number;
    boss_finished_at: string | null;
};

export type BossTapResult = {
    boss_phase: number;
    boss_hp: number;
    boss_hp_max: number;
    phase_changed: boolean;
    cutscene: boolean;
    team_id: number;
    team_hp: number;
};
