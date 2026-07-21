import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerSession } from '@/hooks/usePlayerSession';
import { useSteps } from '@/hooks/useSteps';
import { useEffect } from 'react';

import Button from '@/Components/global/Button';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import ActivityPage from './ActivityPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import JoinRoomPage from './JoiningPage';
import StorylinePage from './StorylinePage';

export default function PlayerFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const { steps, isLoading } = useSteps();
    const { session, joinSession, submitAnswer } = usePlayerSession();

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

    const goNext = () => {
        const next = steps.find((item) => item.order === step.order + 1);

        if (next) {
            navigate(`/player/${next.slug}`);
        }
    };

    return (
        <div className="h-dvh w-screen overflow-hidden bg-black">
            <div className="absolute right-4 top-4 z-50">
                <Button
                    Icon={NextButton}
                    iconClassName="w-32"
                    onClick={goNext}
                />

                <div className="mt-2 w-40 text-xs text-white">
                    player nanti ga ada button nextnya, nextnya itu dikendaliin
                    sama admin.
                    <br />
                    buat liat admin /admin
                    <br />
                    buat liat player /player
                </div>
            </div>

            {step.type === 'waiting' && (
                <JoinRoomPage step={step} onJoin={joinSession} />
            )}

            {step.type === 'story' && <StorylinePage step={step} />}

            {step.type === 'answer' && (
                <AnswerTheQuestionPage
                    step={step}
                    question={step.content?.question}
                    onSubmit={submitAnswer}
                />
            )}

            {step.type === 'activity' && <ActivityPage step={step} />}

            {step.type === 'boss' && <BossFightPage step={step} />}
        </div>
    );
}
