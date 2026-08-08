import Button from '@/Components/global/Button';
import ConfirmPopup from '@/Components/global/ConfirmPopup';
import PlayerManagerPanel from '@/Components/global/PlayerManagerPanel';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import { useAdminAuth, type AdminUser } from '@/hooks/useAdminAuth';
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

// PIC accounts are seeded with both their name ("PIC Kelompok 9/10") and
// email (iniAkunBuatKel9.10@gmail.com) encoding which two groups they run -
// pull the pair from whichever's available instead of making them type it
// in by hand, which was just an opportunity to fat-finger the wrong groups.
function groupPairFromAccount(user: AdminUser): string | null {
    const emailMatch = user.email.match(/(\d+)\s*\.\s*(\d+)@/);
    if (emailMatch) return `${emailMatch[1]}/${emailMatch[2]}`;

    const nameMatch = user.name.match(/(\d+)\s*\/\s*(\d+)/);
    if (nameMatch) return `${nameMatch[1]}/${nameMatch[2]}`;

    return null;
}

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
        startBossPhase,
        removePlayer,
        clearSession,
    } = useAdminSession(!!user && !user.is_admin);

    const [showNextConfirm, setShowNextConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    // The monitoring-only admin account doesn't run a room - send it
    // straight to the overview dashboard instead of the group-number form.
    useEffect(() => {
        if (user?.is_admin) navigate('/monitor', { replace: true });
    }, [user?.is_admin, navigate]);

    const listedStep = steps.find((item) => item.slug === stepId);

    // /api/steps ships the flow without question content so it can't be read
    // ahead of time; the live question arrives with the session, for whatever
    // step the room is actually on. Prefer that copy when the two agree.
    const step =
        listedStep && session?.current_step?.slug === listedStep.slug
            ? session.current_step
            : listedStep;

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
        const groupPair = groupPairFromAccount(user);

        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <form
                    className="flex w-full max-w-xs flex-col gap-4 text-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (groupPair) createSession(groupPair);
                    }}
                >
                    <p className="text-2xl font-bold text-white">
                        Anda akan Login sebagai {user.name}
                    </p>

                    {groupPair ? (
                        <p> Apakah anda yakin untuk membuat sesinya?</p>
                    ) : (
                        <p className="text-sm text-red-400">
                            Akun ini tidak terhubung ke nomor kelompok manapun -
                            hubungi admin.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!groupPair || isSessionLoading}
                        className="rounded-xl bg-white px-6 py-3 text-black disabled:opacity-40"
                    >
                        {isSessionLoading ? 'Membuat sesi...' : 'Mulai Sesi'}
                    </button>
                    <button
                        type="button"
                        onClick={logout}
                        className="mb-12 text-sm text-white/40 underline"
                    >
                        Logout
                    </button>

                    <p className="-mb-4 text-xs text-white/20">
                        Semangat para modul!
                    </p>
                    <p className="text-xs text-white/20">- Interface</p>
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

    const confirmClearSession = async () => {
        setIsClearing(true);

        try {
            await clearSession();
            setShowClearConfirm(false);
            navigate('/admin/lobby', { replace: true });
        } catch {
            // Leave the popup open so the PIC can see something went wrong
            // and try again, instead of silently pretending it worked.
        } finally {
            setIsClearing(false);
        }
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
                <ConfirmPopup
                    message="Apakah anda benar-benar yakin buat melanjutkan sesi?"
                    onCancel={() => setShowNextConfirm(false)}
                    onConfirm={confirmNext}
                    boxClassName="h-[25rem] w-[30rem]"
                    holdupClassName="ml-4 w-[20rem]"
                    popupBoxClassName="mt-16"
                    contentClassName="top-44 gap-10"
                    messageClassName="w-[25rem] text-3xl"
                    buttonsClassName="gap-20"
                    buttonClassName="text-4xl"
                />
            )}

            <PlayerManagerPanel session={session} onRemove={removePlayer} />

            <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="fixed bottom-2 right-2 z-50 rounded-md bg-red-600/10 px-4 py-1 font-arsenal text-xs text-white/50 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                Clear Session
            </button>

            {showClearConfirm && (
                <ConfirmPopup
                    message="Apakah anda benar-benar yakin ingin menghapus sesi ini? Semua data kelompok (nama, pemain, jawaban, skor) akan hilang secara permanen."
                    onCancel={() => setShowClearConfirm(false)}
                    onConfirm={confirmClearSession}
                    confirmDisabled={isClearing}
                    cancelDisabled={isClearing}
                    boxClassName="h-[25rem] w-[30rem]"
                    holdupClassName="ml-4 w-[20rem]"
                    popupBoxClassName="mt-16"
                    contentClassName="top-44 gap-10"
                    messageClassName="w-[25rem] text-2xl"
                    buttonsClassName="gap-20"
                    buttonClassName="text-4xl"
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
                <BossFightPage
                    step={step}
                    session={session}
                    onStartPhase={startBossPhase}
                />
            )}
        </div>
    );
}
