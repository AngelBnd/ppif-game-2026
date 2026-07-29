import BlueX from '@/assets/coreLogic/svgs/BlueX.svg?react';
import GreenTriangle from '@/assets/coreLogic/svgs/GreenTriangle.svg?react';
import PinkSquare from '@/assets/coreLogic/svgs/PinkSquare.svg?react';
import RedCircle from '@/assets/coreLogic/svgs/RedCircle.svg?react';
import HP from '@/assets/monitor/HP.svg?react';
import Seconds from '@/assets/monitor/SECONDS.svg?react';
import { useCountdown } from '@/hooks/useCountdown';
import type { SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';
import gsap from 'gsap';
import { useLayoutEffect, useRef, useState } from 'react';

type Props = {
    step: Step;
    session: SessionInfo | null;
    onSubmit: (
        answerText: string,
    ) => Promise<{ is_correct: boolean; response_time_ms: number }>;
};

// Index -> shape, matches the same order used on the monitor's PILIHAN
// GANDA display so "Square" means the same option on both screens.
const OPTION_ICONS = [PinkSquare, RedCircle, GreenTriangle, BlueX];

export default function AnswerTheQuestionPage({
    step,
    session,
    onSubmit,
}: Props) {
    const answeredCount = session?.answered_count ?? 0;
    const opts = step.content?.opts ?? [];

    const remaining = useCountdown(
        session?.current_step_started_at,
        step.time_limit_seconds ?? 60,
    );
    const timeIsUp = remaining === 0;

    const [status, setStatus] = useState<
        'idle' | 'submitting' | 'submitted' | 'error'
    >('idle');
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const containerRef = useRef<HTMLElement>(null);
    const secondsRef = useRef<HTMLDivElement>(null);
    const hpRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo(
                [secondsRef.current, hpRef.current],
                { scale: 0.6, autoAlpha: 0 },
                {
                    scale: 1,
                    autoAlpha: 1,
                    duration: 0.45,
                    ease: 'back.out(2)',
                    stagger: 0.08,
                },
            );

            optionRefs.current.forEach((ref, idx) => {
                if (!ref) return;
                const isLeft = idx % 2 === 0;
                const startX = isLeft ? -200 : 200;

                tl.fromTo(
                    ref,
                    { x: startX, y: 80, opacity: 0, scale: 0.8 },
                    {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.45,
                        ease: 'back.out(1.5)',
                        clearProps: 'transform,opacity',
                    },
                    '-=0.35',
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const locked =
        status === 'submitting' || status === 'submitted' || timeIsUp;

    const handleSelect = async (idx: number) => {
        const option = opts[idx];
        if (!option || locked) return;

        setSelectedIdx(idx);
        setStatus('submitting');

        try {
            const result = await onSubmit(option);
            setFeedback(result.is_correct ? 'Correct!' : 'Incorrect.');
            setStatus('submitted');
        } catch (err) {
            const status = (err as Error & { status?: number }).status;

            if (status === 409) {
                // A teammate already submitted the team's answer for this
                // question - retrying will never succeed, so lock instead
                // of inviting another attempt.
                setFeedback('Your team has already answered!');
                setStatus('submitted');
                setSelectedIdx(null);
                return;
            }

            setFeedback('Failed to submit, try again.');
            setStatus('error');
            setSelectedIdx(null);
        }
    };

    return (
        <main
            ref={containerRef}
            className="relative flex h-dvh items-center justify-center overflow-hidden text-white"
        >
            <div className="absolute z-0 h-screen w-screen bg-[#7C131E] opacity-70" />

            <div className="relative z-10 flex h-full w-full max-w-[430px] flex-col items-center px-4 py-6">
                <div className="flex w-full items-center justify-between">
                    <div
                        ref={secondsRef}
                        className="relative z-30 h-auto w-[7rem] origin-center"
                    >
                        <Seconds className="block h-auto w-full" />

                        <span className="absolute left-[35px] top-[40px] font-arsenal text-2xl font-bold text-[#FFFE25]">
                            {remaining ?? step.time_limit_seconds ?? 60}
                        </span>
                    </div>

                    <div
                        ref={hpRef}
                        className="relative h-auto w-[6rem] origin-center"
                    >
                        <HP className="relative h-auto w-full" />

                        <div className="absolute left-5 top-[4.2rem] flex flex-col items-center leading-none">
                            <div className="flex items-center text-2xl font-bold tracking-[-0.04em]">
                                <span className="text-[#73F9D9]">
                                    {answeredCount}
                                </span>
                                <span className="mx-1 text-[#F0F2F5]">/</span>
                                <span className="text-[#F168DB]">2</span>
                            </div>

                            <p className="font-noto text-[10px] font-bold leading-none text-[#F0F2F5]">
                                has answered
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    ref={gridRef}
                    className="mt-32 grid grid-cols-2 place-items-center gap-8"
                >
                    {[0, 1, 2, 3].map((idx) => {
                        const Icon = OPTION_ICONS[idx];
                        const option = opts[idx];
                        if (!option) return <div key={idx} />;

                        const isSelected = selectedIdx === idx;

                        return (
                            <button
                                key={idx}
                                ref={(el) => {
                                    optionRefs.current[idx] = el;
                                }}
                                type="button"
                                style={{ opacity: 0 }}
                                disabled={locked}
                                onClick={() => handleSelect(idx)}
                                className={`h-36 w-36 transition-transform duration-150 active:scale-90 disabled:cursor-not-allowed ${
                                    isSelected ? 'scale-110' : ''
                                } ${locked && !isSelected ? 'opacity-40' : ''}`}
                            >
                                <Icon className="h-full w-full drop-shadow-lg" />
                            </button>
                        );
                    })}
                </div>

                {/* feedback dikasih di monitor aja(?) */}
                {/* {feedback && (
                    <p className="mt-8 text-center text-lg font-bold text-white">
                        {feedback}
                    </p>
                )} */}

                {timeIsUp && status === 'idle' && (
                    <p className="mt-8 text-center font-arsenal text-xl font-bold">
                        Time&apos;s up!
                    </p>
                )}
            </div>
        </main>
    );
}
