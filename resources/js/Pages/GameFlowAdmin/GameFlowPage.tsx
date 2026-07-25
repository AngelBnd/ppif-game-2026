import Button from '@/Components/global/Button';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useSteps } from '@/hooks/useSteps';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityPage from './ActivityPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import StorylinePage from './StorylinePage';
import WaitingRoompage from './WaitingRoomPage';

export default function AdminFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const { steps, isLoading } = useSteps();
    const { session, isRestoring, createSession, advanceSession } = useAdminSession();

    const hasRequestedSession = useRef(false);

    useEffect(() => {
        // Wait for the saved-PIN restore check to finish first - otherwise
        // this races it and creates an orphan session on every reload of
        // an admin tab that already had one going.
        if (session || isRestoring || hasRequestedSession.current) return;
        hasRequestedSession.current = true;
        createSession().catch(() => {
            hasRequestedSession.current = false;
        });
    }, [session, isRestoring, createSession]);

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
                    <h1 className="text-3xl font-bold">Page Not Found</h1>
                    <button
                        onClick={() => navigate('/admin/prologue')}
                        className="mt-6 rounded-xl bg-white px-6 py-3 text-black"
                    >
                        Back to Start
                    </button>
                </div>
            </main>
        );
    }

    const goNext = () => {
        advanceSession()
            .then((updated) => {
                if (updated.current_step) {
                    navigate(`/admin/${updated.current_step.slug}`);
                }
            })
            .catch(() => {
                // Fall back to local step order if the API call fails.
                const next = steps.find((item) => item.order === step.order + 1);
                if (next) navigate(`/admin/${next.slug}`);
            });
    };

    return (
        <div className="h-screen w-screen overflow-hidden">
            {step.type !== 'waiting' && (
                <Button
                    Icon={NextButton}
                    className="absolute right-8 top-8 z-50"
                    iconClassName="w-48"
                    onClick={goNext}
                />
            )}

            {step.type === 'waiting' && (
                <WaitingRoompage step={step} session={session} goNext={goNext} />
            )}

            {step.type === 'story' && <StorylinePage step={step} />}

            {step.type === 'answer' && (
                <AnswerTheQuestionPage step={step} session={session} />
            )}

            {step.type === 'activity' && <ActivityPage step={step} />}

            {step.type === 'boss' && (
                <BossFightPage step={step} session={session} />
            )}
        </div>
    );
}
