export type StepType = 'waiting' | 'story' | 'activity' | 'answer' | 'boss';

export type Step = {
    id: number;
    order: number;
    slug: string;
    type: StepType;
    title: string;
    content: { question?: string; opts?: string[] } | null;
    time_limit_seconds: number | null;
};
