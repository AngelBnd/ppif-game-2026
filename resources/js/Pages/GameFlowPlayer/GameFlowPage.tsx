import { usePlayerSession } from '@/hooks/usePlayerSession';
import { useSteps } from '@/hooks/useSteps';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ActivityPage from './ActivityPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import JoinRoomPage from './JoiningPage';
import StorylinePage from './StorylinePage';

const isDev = import.meta.env.DEV;

export default function PlayerFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const { steps, isLoading } = useSteps();
    const {
        session,
        team,
        peekSession,
        joinSession,
        submitAnswer,
        submitBossTap,
    } = usePlayerSession();

    // Set right before a dev-nav click so the sync effect below doesn't
    // immediately snap back to the live session's step on the next render.
    const devNavRef = useRef(false);

    // Follows whatever step the admin advances to on the server.
    useEffect(() => {
        if (devNavRef.current) {
            devNavRef.current = false;
            return;
        }

        if (session?.current_step && session.current_step.slug !== stepId) {
            navigate(`/player/${session.current_step.slug}`, { replace: true });
        }
    }, [session?.current_step?.slug, stepId, navigate]);

    const step = steps.find((item) => item.slug === stepId);

    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSteps.findIndex((item) => item.slug === stepId);
    const prevStep = currentIndex > 0 ? sortedSteps[currentIndex - 1] : null;
    const nextStep =
        currentIndex >= 0 && currentIndex < sortedSteps.length - 1
            ? sortedSteps[currentIndex + 1]
            : null;

    const goToDevStep = (slug: string) => {
        devNavRef.current = true;
        navigate(`/player/${slug}`);
    };

    const devNav = isDev && (
        <div className="fixed bottom-12 left-1/2 z-[999] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/80 px-3 py-2 font-mono text-xs text-white shadow-lg">
            <button
                type="button"
                disabled={!prevStep}
                onClick={() => prevStep && goToDevStep(prevStep.slug)}
                className="rounded-full bg-white/10 px-3 py-1 disabled:opacity-30"
            >
                ← Prev
            </button>

            <span className="px-2 py-1">{stepId ?? '?'}</span>

            {nextStep && (
                <button
                    type="button"
                    onClick={() => goToDevStep(nextStep.slug)}
                    className="rounded-full bg-white/10 px-3 py-1"
                >
                    Next →
                </button>
            )}
        </div>
    );

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

                {devNav}
            </main>
        );
    }

    return (
        <div className="h-dvh w-screen overflow-hidden">
            <div className="relative z-20 mx-auto h-dvh w-full max-w-[480px] translate-x-0 overflow-hidden">
                {devNav}

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
        </div>
    );
}
