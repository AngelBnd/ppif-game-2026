import Button from '@/Components/global/Button';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useSteps } from '@/hooks/useSteps';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityPage from './ActivityPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import StorylinePage from './StorylinePage';
import WaitingRoompage from './WaitingRoomPage';

const GROUP_PAIR_PATTERN = /^\s*\d+\s*\/\s*\d+\s*$/;

export default function AdminFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const { steps, isLoading } = useSteps();
    const {
        session,
        isRestoring,
        isLoading: isSessionLoading,
        createSession,
        advanceSession,
    } = useAdminSession();

    const [groupInput, setGroupInput] = useState('');

    const step = steps.find((item) => item.slug === stepId);

    if (isLoading || isRestoring) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Loading...</p>
            </main>
        );
    }

    if (!session) {
        const isValid = GROUP_PAIR_PATTERN.test(groupInput);

        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <form
                    className="flex w-full max-w-xs flex-col gap-4 text-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isValid) createSession(groupInput.trim());
                    }}
                >
                    <label htmlFor="group-pair" className="text-lg font-bold">
                        Nomor Kelompok (contoh: 1/2)
                    </label>
                    <input
                        id="group-pair"
                        type="text"
                        value={groupInput}
                        onChange={(e) => setGroupInput(e.target.value)}
                        placeholder="1/2"
                        className="rounded-xl px-4 py-3 text-center text-black"
                        disabled={isSessionLoading}
                    />
                    <button
                        type="submit"
                        disabled={!isValid || isSessionLoading}
                        className="rounded-xl bg-white px-6 py-3 text-black disabled:opacity-40"
                    >
                        {isSessionLoading ? 'Membuat sesi...' : 'Mulai Sesi'}
                    </button>
                </form>
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
                const next = steps.find(
                    (item) => item.order === step.order + 1,
                );
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
                <WaitingRoompage
                    step={step}
                    session={session}
                    goNext={goNext}
                />
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
