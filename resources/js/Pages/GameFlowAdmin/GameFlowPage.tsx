import Button from '@/Components/global/Button';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import Holdup from '@/assets/svgs/Holdup.svg';
import PopupBox from '@/assets/svgs/PopupBox.svg';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useSteps } from '@/hooks/useSteps';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityPage from './ActivityPage';
import AdminLoginPage from './AdminLoginPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import StorylinePage from './StorylinePage';
import WaitingRoompage from './WaitingRoompage';

const GROUP_PAIR_PATTERN = /^\s*\d+\s*\/\s*\d+\s*$/;

export default function AdminFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const { steps, isLoading } = useSteps();
    const { user, isLoading: isAuthLoading, login, logout } = useAdminAuth();
    const {
        session,
        isRestoring,
        isLoading: isSessionLoading,
        createSession,
        advanceSession,
    } = useAdminSession(!!user && !user.is_admin);

    const [groupInput, setGroupInput] = useState('');
    const [showNextConfirm, setShowNextConfirm] = useState(false);

    // The monitoring-only admin account doesn't run a room - send it
    // straight to the overview dashboard instead of the group-number form.
    useEffect(() => {
        if (user?.is_admin) navigate('/monitor', { replace: true });
    }, [user?.is_admin, navigate]);

    const step = steps.find((item) => item.slug === stepId);

    if (isLoading || isAuthLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Loading...</p>
            </main>
        );
    }

    if (!user) {
        return <AdminLoginPage onLogin={login} />;
    }

    if (user.is_admin) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Loading...</p>
            </main>
        );
    }

    if (isRestoring) {
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
                    <p className="text-sm text-white/60">
                        Login sebagai {user.name}
                    </p>
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
                    <button
                        type="button"
                        onClick={logout}
                        className="text-xs text-white/40 underline"
                    >
                        Logout
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

    const confirmNext = () => {
        setShowNextConfirm(false);
        goNext();
    };

    return (
        <div className="h-screen w-screen overflow-hidden">
            {step.type !== 'waiting' && step.slug !== 'activity-4' && (
                <Button
                    Icon={NextButton}
                    className="absolute right-8 top-8 z-50"
                    iconClassName="w-48"
                    onClick={() => setShowNextConfirm(true)}
                />
            )}

            {showNextConfirm && (
                <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
                    <div className="animate-pop-in relative h-[25rem] w-[30rem]">
                        <img
                            className="absolute z-40 ml-4 block h-auto w-[20rem]"
                            src={Holdup}
                        />
                        <img className="relative mt-16" src={PopupBox} />

                        <div className="absolute left-1/2 top-44 flex -translate-x-1/2 flex-col gap-10">
                            <div className="z-50 w-[25rem] text-center font-arsenal text-3xl font-bold">
                                Apakah anda benar-benar yakin buat melanjutkan
                                sesi?
                            </div>

                            <div className="flex justify-center gap-20 font-noto font-bold">
                                <button
                                    type="button"
                                    onClick={() => setShowNextConfirm(false)}
                                    className="text-4xl transition-transform duration-150 hover:scale-110 active:scale-95"
                                >
                                    TIDAK
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmNext}
                                    className="text-4xl transition-transform duration-150 hover:scale-110 active:scale-95"
                                >
                                    IYA!!!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
