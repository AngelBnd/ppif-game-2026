import type { Step } from './step';

export type TeamInfo = {
    id: number;
    name: string;
    score: number;
    hp: number;
    players: { id: number }[];
};

export type SessionInfo = {
    id: number;
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
