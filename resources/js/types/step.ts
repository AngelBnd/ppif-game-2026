export type StepType = 'waiting' | 'story' | 'activity' | 'answer' | 'boss';

export type Step = {
    id: number;
    order: number;
    slug: string;
    type: StepType;
    title: string;
    // Only ever present on session.current_step. /api/steps serves the flow
    // without it, so the question set isn't readable before the game starts
    // (see StepResource) - GameFlowPage merges the two into the step it
    // hands to AnswerTheQuestionPage.
    content?: { question?: string; opts?: string[] } | null;
    time_limit_seconds: number | null;
};
