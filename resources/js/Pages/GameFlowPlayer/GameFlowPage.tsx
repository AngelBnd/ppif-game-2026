import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerSession } from '@/hooks/usePlayerSession';
import { useSteps } from '@/hooks/useSteps';
import { useEffect } from 'react';

import ActivityPage from './ActivityPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import JoinRoomPage from './JoiningPage';
import StorylinePage from './StorylinePage';

export default function PlayerFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const { steps, isLoading } = useSteps();
    const { session, team, peekSession, joinSession, submitAnswer, submitBossTap } =
        usePlayerSession();

    // Follows whatever step the admin advances to on the server.
    useEffect(() => {
        if (session?.current_step && session.current_step.slug !== stepId) {
            navigate(`/player/${session.current_step.slug}`, { replace: true });
        }
    }, [session?.current_step?.slug, stepId, navigate]);

    const step = steps.find((item) => item.slug === stepId);

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Loading...</p>
            </main>
        );
    }

    if (!step) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">
                        Player Page Not Found
                    </h1>

                    <button
                        onClick={() => navigate('/player/lobby')}
                        className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-black"
                    >
                        Back to Join Room
                    </button>
                </div>
            </main>
        );
    }

    return (
        <div className="h-dvh w-screen overflow-hidden bg-black">
            {step.type === 'waiting' && (
                <JoinRoomPage
                    step={step}
                    onPeek={peekSession}
                    onJoin={joinSession}
                />
            )}

            {step.type === 'story' && <StorylinePage step={step} />}

            {step.type === 'answer' && (
                <AnswerTheQuestionPage
                    step={step}
                    question={step.content?.question}
                    session={session}
                    onSubmit={submitAnswer}
                />
            )}

            {step.type === 'activity' && <ActivityPage step={step} />}

            {step.type === 'boss' && (
                <BossFightPage
                    step={step}
                    session={session}
                    team={team}
                    onTap={submitBossTap}
                />
            )}
        </div>
    );
}
