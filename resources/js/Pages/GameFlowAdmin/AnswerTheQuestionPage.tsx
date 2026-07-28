import AnswerCircle from '@/assets/coreLogic/svgs/AnswerCircle.svg';
import AnswerCircleHover from '@/assets/coreLogic/svgs/AnswerCircleHover.svg';
import AnswerCross from '@/assets/coreLogic/svgs/AnswerCross.svg';
import AnswerCrossHover from '@/assets/coreLogic/svgs/AnswerCrossHover.svg';
import AnswerSquare from '@/assets/coreLogic/svgs/AnswerSquare.svg';
import AnswerSquareHover from '@/assets/coreLogic/svgs/AnswerSquareHover.svg';
import AnswerTriangle from '@/assets/coreLogic/svgs/AnswerTriangle.svg';
import AnswerTriangleHover from '@/assets/coreLogic/svgs/AnswerTriangleHover.svg';
import Exclamation from '@/assets/monitor/exclamation.svg';
import HP from '@/assets/monitor/HP.svg?react';
import Seconds from '@/assets/monitor/SECONDS.svg?react';
import DialogueBox from '@/Components/monitor/dialogueBox';
import TriangleThing from '@/Components/monitor/TriangleThing';
import { useCountdown } from '@/hooks/useCountdown';
import type { SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';

import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef } from 'react';

type Props = {
    step: Step;
    session: SessionInfo | null;
};

export default function AnswerTheQuestionPage({ step, session }: Props) {
    const answeredCount = session?.answered_count ?? 0;
    const containerRef = useRef<HTMLDivElement>(null);
    const codieRef = useRef<HTMLDivElement>(null);
    const dialogueRef = useRef<HTMLDivElement>(null);
    const hpRef = useRef<HTMLDivElement>(null);
    const secondsRef = useRef<HTMLDivElement>(null);
    const exclShapeRef = useRef<HTMLImageElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const optionsWaveTlRef = useRef<gsap.core.Timeline | null>(null);

    const remaining = useCountdown(
        session?.current_step_started_at,
        step.time_limit_seconds ?? 60,
    );
    const timeIsUp = remaining === 0;

    const currentQuestion = {
        question: step.content?.question ?? '',
        opts: step.content?.opts ?? [],
    };

    // -1 while the answer hasn't loaded yet (or on a step with no options) -
    // current_step_correct_answer only ever arrives for the admin/PIC who
    // owns this session, see SessionController::withCorrectAnswer.
    const correctIdx = currentQuestion.opts.findIndex(
        (opt) => opt === session?.current_step_correct_answer,
    );

    const getOptionAssets = (idx: number) => {
        switch (idx) {
            case 0:
                return {
                    default: AnswerSquare,
                    hover: AnswerSquareHover,
                    alt: 'Square Option Banner',
                };
            case 1:
                return {
                    default: AnswerCircle,
                    hover: AnswerCircleHover,
                    alt: 'Circle Option Banner',
                };
            case 2:
                return {
                    default: AnswerCross,
                    hover: AnswerCrossHover,
                    alt: 'Cross Option Banner',
                };
            case 3:
            default:
                return {
                    default: AnswerTriangle,
                    hover: AnswerTriangleHover,
                    alt: 'Triangle Option Banner',
                };
        }
    };

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                defaults: {
                    ease: 'power3.out',
                },
            });

            if (codieRef.current) {
                timeline.fromTo(
                    codieRef.current,
                    {
                        x: '-70%',
                    },
                    {
                        x: 0,
                        ease: 'power2.out',
                        duration: 0.8,
                    },
                );
            }

            timeline
                .set(dialogueRef.current, {
                    xPercent: -30,
                    rotation: -4,
                    scale: 0.95,
                    autoAlpha: 0,
                })
                .to(dialogueRef.current, {
                    xPercent: 8,
                    rotation: 2,
                    scale: 1.03,
                    autoAlpha: 1,
                    duration: 0.55,
                    ease: 'power3.out',
                })
                .to(dialogueRef.current, {
                    xPercent: -2,
                    rotation: -1,
                    scale: 0.99,
                    duration: 0.15,
                    ease: 'power2.inOut',
                })
                .to(dialogueRef.current, {
                    xPercent: 0,
                    rotation: 0,
                    scale: 1,
                    duration: 0.12,
                    ease: 'power2.out',
                })
                .fromTo(
                    secondsRef.current,
                    {
                        scale: 0,
                        autoAlpha: 0,
                        rotate: -8,
                    },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        rotate: 0,
                        duration: 0.55,
                        ease: 'back.out(2)',
                    },
                    '-=0.5',
                )
                .fromTo(
                    hpRef.current,
                    {
                        scale: 0,
                        autoAlpha: 0,
                        rotate: 8,
                    },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        rotate: 0,
                        duration: 0.55,
                        ease: 'back.out(2)',
                    },
                    '-=0.5',
                );

            optionRefs.current.forEach((ref, idx) => {
                if (!ref) return;
                const isLeft = idx % 2 === 0;
                const startX = isLeft ? -200 : 200;

                timeline.fromTo(
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

            // exclamation shape
            gsap.to(exclShapeRef.current, {
                scale: 1.25,
                rotation: 3,
                duration: 2.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            const optionsWaveTl = gsap.timeline({ repeat: -1 });
            optionsWaveTlRef.current = optionsWaveTl;

            optionRefs.current.filter(Boolean).forEach((el, index) => {
                optionsWaveTl.to(el, {
                    scale: 1.03,
                    rotate: index % 2 === 0 ? 2 : -2,
                    duration: 0.4,
                    ease: 'linear',
                    yoyo: true,
                    repeat: 1,
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        if (!timeIsUp || correctIdx === -1) return;

        const correctEl = optionRefs.current[correctIdx];
        if (!correctEl) return;

        optionsWaveTlRef.current?.kill();
        gsap.set(optionRefs.current.filter(Boolean), {
            clearProps: 'scale,rotate',
        });

        const ctx = gsap.context(() => {
            gsap.to(correctEl, {
                scale: 1.04,
                duration: 0.9,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, containerRef);

        return () => ctx.revert();
    }, [timeIsUp, correctIdx]);

    return (
        <main className="pointer-events-none flex min-h-screen items-center justify-center overflow-hidden text-white">
            <div className="absolute z-0 h-screen w-screen bg-[#7C131E] opacity-70" />
            <div ref={containerRef} className="relative h-screen w-screen">
                <div
                    ref={hpRef}
                    className="absolute bottom-16 right-4 z-50 h-auto w-[13rem] origin-center"
                >
                    <HP className="relative h-auto w-full" />

                    <div className="absolute left-12 top-40 z-20 flex flex-col items-center leading-none">
                        <div className="flex items-center text-[56px] font-bold tracking-[-0.04em]">
                            <span className="text-[#73F9D9]">
                                {answeredCount}
                            </span>

                            <span className="mx-1 text-[#F0F2F5]">/</span>

                            <span className="text-[#F168DB]">2</span>
                        </div>

                        <p className="mt-2 font-noto text-lg font-bold leading-none text-[#F0F2F5]">
                            has answered
                        </p>
                    </div>
                </div>

                <div
                    ref={secondsRef}
                    className="absolute left-6 top-6 z-50 block h-auto w-[13rem] origin-center"
                >
                    <Seconds className="block h-auto w-full" />

                    <span className="absolute left-[60px] top-20 z-50 font-arsenal text-5xl font-bold text-[#FFFE25]">
                        {remaining ?? step.time_limit_seconds ?? 60}
                    </span>
                </div>
                {/* 
                <div
                    ref={codieRef}
                    className="absolute bottom-12 left-0 h-auto w-[25rem]"
                >
                    <Codie className="block h-auto w-full" />
                </div> */}

                <div className="mt-20 flex flex-col items-center justify-center">
                    <div className="relative h-[12rem] w-[60rem]">
                        <div
                            ref={dialogueRef}
                            className="relative !left-96 bottom-0"
                        >
                            <img
                                ref={exclShapeRef}
                                src={Exclamation}
                                alt="Exclamation"
                                className="absolute right-36 top-8 z-20 h-auto w-[10rem]"
                            />

                            <TriangleThing
                                size="7rem"
                                className="absolute bottom-12 left-40 z-20"
                            />

                            <DialogueBox
                                msg={currentQuestion.question}
                                classNameSizeBox="!w-full !h-auto "
                                classNameIdentitySize="!w-[4rem]"
                                className="relative origin-top-left scale-75"
                            />
                        </div>
                    </div>

                    {/* PILIHAN GANDA */}
                    <section className="relative z-40 mx-auto mt-8 w-full max-w-7xl px-4">
                        <div className="grid grid-cols-1 place-items-center gap-x-6 gap-y-4 md:grid-cols-2">
                            {[0, 1, 2, 3].map((idx) => {
                                const option = currentQuestion.opts[idx];
                                if (!option) return null;

                                const optionAsset = getOptionAssets(idx);

                                const textPositionStyles: Record<
                                    number,
                                    string
                                > = {
                                    0: 'absolute bottom-[30px] right-[175px] text-right',
                                    1: 'absolute bottom-[30px] left-[175px] text-left',
                                    2: 'absolute top-[30px] right-[175px] text-right',
                                    3: 'absolute top-[30px] left-[175px] text-left',
                                };

                                const isCorrectReveal =
                                    timeIsUp && idx === correctIdx;
                                const isDimmedOut =
                                    timeIsUp && idx !== correctIdx;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        ref={(el) => {
                                            optionRefs.current[idx] = el;
                                        }}
                                        style={{ opacity: 0 }}
                                        tabIndex={-1}
                                        className={`group relative h-[195px] w-full max-w-[600px] select-none bg-transparent outline-none transition-opacity duration-300 ${isDimmedOut ? 'opacity-50' : ''} ${isCorrectReveal ? 'z-10' : ''} `}
                                    >
                                        <img
                                            src={optionAsset.default}
                                            alt={optionAsset.alt}
                                            className="object-stretch pointer-events-none absolute inset-0 h-full w-full opacity-100 transition-opacity duration-200 group-hover:opacity-0"
                                        />

                                        <img
                                            src={optionAsset.hover}
                                            alt={`${optionAsset.alt} Hover`}
                                            className="object-stretch pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                        />

                                        <div className="absolute inset-0 z-10 px-8">
                                            <span
                                                className={`-2 -blue-500 max-w-[350px] text-[20px] font-bold leading-snug text-white drop-shadow-md transition-colors duration-200 group-hover:text-yellow-300 md:text-[22px] ${textPositionStyles[idx] || 'absolute inset-0 flex items-center justify-center'} `}
                                            >
                                                {option}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
