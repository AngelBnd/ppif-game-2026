import Button from '@/Components/global/Button';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useSteps } from '@/hooks/useSteps';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityPage from './ActivityPage';
import AdminLoginPage from './AdminLoginPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import StorylinePage from './StorylinePage';
import WaitingRoompage from './WaitingRoomPage';

const GROUP_PAIR_PATTERN = /^\s*\d+\s*\/\s*\d+\s*$/;
// PIC account names look like "PIC Kelompok 1/2" - pull the pair straight
// from the account instead of making the PIC retype what their own login
// already encodes.
const GROUP_PAIR_IN_NAME = /(\d+\s*\/\s*\d+)/;

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
    const [autoCreateError, setAutoCreateError] = useState('');
    const autoCreateAttempted = useRef(false);

    const groupPairFromName =
        user && !user.is_admin ? (user.name.match(GROUP_PAIR_IN_NAME)?.[1] ?? null) : null;

    // The monitoring-only admin account doesn't run a room - send it
    // straight to the overview dashboard instead of the group-number form.
    useEffect(() => {
        if (user?.is_admin) navigate('/monitor', { replace: true });
    }, [user?.is_admin, navigate]);

    // Skip the "type your group number" form entirely when the account
    // already says which group it's for - only testing/generic accounts
    // (whose name has no "X/Y" pair) fall back to asking manually.
    useEffect(() => {
        if (!user || user.is_admin) return;
        if (isRestoring || session || isSessionLoading) return;
        if (!groupPairFromName || autoCreateAttempted.current) return;

        autoCreateAttempted.current = true;
        createSession(groupPairFromName).catch(() => {
            setAutoCreateError('Gagal membuat sesi otomatis, silakan coba lagi di bawah.');
        });
    }, [user, isRestoring, session, isSessionLoading, groupPairFromName, createSession]);

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
        // Account maps to a group pair and auto-create hasn't failed - it's
        // in flight, so there's nothing for the PIC to fill in or confirm.
        if (groupPairFromName && !autoCreateError) {
            return (
                <main className="flex min-h-screen items-center justify-center bg-black text-white">
                    <p>Menyiapkan sesi untuk Kelompok {groupPairFromName}...</p>
                </main>
            );
        }

        const effectiveGroupInput = groupInput || groupPairFromName || '';
        const isValid = GROUP_PAIR_PATTERN.test(effectiveGroupInput);

        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <form
                    className="flex w-full max-w-xs flex-col gap-4 text-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isValid) createSession(effectiveGroupInput.trim());
                    }}
                >
                    <p className="text-sm text-white/60">Login sebagai {user.name}</p>
                    <label htmlFor="group-pair" className="text-lg font-bold">
                        Nomor Kelompok (contoh: 1/2)
                    </label>
                    <input
                        id="group-pair"
                        type="text"
                        value={effectiveGroupInput}
                        onChange={(e) => setGroupInput(e.target.value)}
                        placeholder="1/2"
                        className="rounded-xl px-4 py-3 text-center text-black"
                        disabled={isSessionLoading}
                    />
                    {autoCreateError && (
                        <p className="text-xs text-red-400">{autoCreateError}</p>
                    )}
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
