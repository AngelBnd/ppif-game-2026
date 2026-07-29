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
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
    const answeredCounterRef = useRef<HTMLDivElement>(null);
    const dingRef = useRef<HTMLAudioElement>(null);
    const tickingRef = useRef<HTMLAudioElement>(null);
    const [codieIntroDone, setCodieIntroDone] = useState(false);
    const [finish, setFinish] = useState(false);

    const remaining = useCountdown(
        session?.current_step_started_at,
        step.time_limit_seconds ?? 60,
    );
    const timeIsUp = remaining === 0;

    const currentQuestion = {
        question: step.content?.question ?? '',
        opts: step.content?.opts ?? [],
    };

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
        setFinish(false);

        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                defaults: {
                    ease: 'power3.out',
                },
            });

            timeline
                .set(dialogueRef.current, {
                    xPercent: -30,
                    rotation: -4,
                    scale: 1,
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
                    { x: startX, y: 80, opacity: 0, scale: 1 },
                    {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.45,
                        ease: 'power2.out',
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
        if (correctIdx === -1) return;

        if (timeIsUp) {
            setFinish(true);
            return;
        }

        if (answeredCount === 2) {
            // Give both teams a beat to see "2/2" land before dimming the
            // wrong options and revealing the correct one.
            const timeout = setTimeout(() => setFinish(true), 4000);
            return () => clearTimeout(timeout);
        }
    }, [timeIsUp, correctIdx, answeredCount]);

    // Ticking clock plays for the duration of each question, stopping the
    // moment it's resolved (time up, or both teams answered + the reveal
    // delay above has elapsed).
    useEffect(() => {
        const audio = tickingRef.current;
        if (!audio) return;

        if (finish) {
            audio.pause();
            audio.currentTime = 0;
            return;
        }

        audio.currentTime = 0;
        audio.play().catch(() => {
            // Autoplay can be blocked until the admin has interacted with
            // the page at least once - nothing to do about it here.
        });

        return () => {
            audio.pause();
        };
    }, [finish, step.slug]);

    // One-shot "ding" the instant the answer gets revealed.
    useEffect(() => {
        if (!finish) return;

        const audio = dingRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        audio.play().catch(() => {});
    }, [finish]);

    useEffect(() => {
        const waitingForReveal = answeredCount === 2 && !finish;
        if (!waitingForReveal || !hpRef.current) return;

        const ctx = gsap.context(() => {
            gsap.set(hpRef.current, {
                transformOrigin: '50% 100%',
            });

            gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } })
                .to(hpRef.current, {
                    y: -50,
                    scaleX: 0.9,
                    scaleY: 1.1,
                    duration: 0.5,
                    ease: 'power2.out',
                })
                .to(hpRef.current, {
                    y: 0,
                    scaleX: 1.15,
                    scaleY: 0.85,
                    duration: 0.22,
                    ease: 'power2.in',
                })
                .to(hpRef.current, {
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.35,
                    ease: 'elastic.out(1, 0.5)',
                })
                .to(hpRef.current, {}, '+=0.2');
        }, containerRef);

        return () => ctx.revert();
    }, [answeredCount, finish]);

    useEffect(() => {
        if (finish) {
            const correctEl = optionRefs.current[correctIdx];
            if (!correctEl) return;

            optionsWaveTlRef.current?.kill();
            const ctx = gsap.context(() => {
                gsap.to(optionRefs.current.filter(Boolean), {
                    scale: 1,

                    rotate: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.fromTo(
                            correctEl,
                            { scale: 1 },
                            {
                                scale: 1.04,
                                duration: 0.9,
                                repeat: -1,
                                yoyo: true,
                                ease: 'sine.inOut',
                            },
                        );
                    },
                });
            }, containerRef);

            return () => ctx.revert();
        }
    }, [finish]);

    return (
        <main className="pointer-events-none flex min-h-screen items-center justify-center overflow-hidden text-white">
            <audio ref={tickingRef} src="/sounds/Ticking.mp3" loop />
            <audio ref={dingRef} src="/sounds/DINGDING.wav" />

            <div className="absolute z-0 h-screen w-screen bg-[#7C131E] opacity-70" />
            <video
                autoPlay
                muted
                playsInline
                className="absolute -top-12 z-0 h-screen w-screen object-cover"
                onEnded={(e) => {
                    e.currentTarget.currentTime = 3;
                    e.currentTarget.play();
                }}
            >
                <source src="/videos/outputcodie.webm" type="video/webm" />
            </video>
            <div ref={containerRef} className="relative h-screen w-screen">
                <div
                    ref={hpRef}
                    className="absolute bottom-16 right-4 z-50 h-auto w-[13rem] origin-center"
                >
                    <HP className="relative h-auto w-full" />

                    <div
                        ref={answeredCounterRef}
                        className="absolute left-4 top-40 z-20 flex flex-col items-center justify-center leading-none"
                    >
                        <div className="flex items-center text-[56px] font-bold tracking-[-0.04em]">
                            <span className="text-[#73F9D9]">
                                {answeredCount}
                            </span>

                            <span className="mx-1 text-[#F0F2F5]">/</span>

                            <span className="text-[#F168DB]">2</span>
                        </div>

                        <p className="bg mt-2 text-center font-noto text-lg font-bold leading-none text-[#F0F2F5]">
                            teams has answered
                        </p>
                    </div>
                </div>

                <div
                    ref={secondsRef}
                    className="absolute left-6 top-6 z-50 block h-auto w-[13rem] origin-center"
                >
                    <Seconds className="block h-auto w-full" />

                    <span className="absolute left-[66px] top-20 z-50 font-arsenal text-5xl font-bold text-[#FFFE25]">
                        {remaining ?? step.time_limit_seconds ?? 60}
                    </span>
                </div>

                <div
                    ref={codieRef}
                    className="absolute bottom-12 left-0 z-0 h-auto"
                >
                    {!codieIntroDone ? (
                        <video
                            key="intro"
                            autoPlay
                            muted
                            playsInline
                            className="block h-auto w-full"
                            onEnded={() => setCodieIntroDone(true)}
                        >
                            <source
                                src="/videos/CODIEDYNAMIC.webm"
                                type="video/webm"
                            />
                        </video>
                    ) : (
                        <video
                            key="static"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="block h-auto w-full"
                        >
                            <source
                                src="/videos/CODIESTATIC1.webm"
                                type="video/webm"
                            />
                        </video>
                    )}
                </div>

                <div className="z-50 mt-24 flex flex-col items-center justify-center">
                    <div className="relative top-7 h-[12rem] w-[60rem]">
                        <div
                            ref={dialogueRef}
                            className="relative !left-72 bottom-0"
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
                                    finish && idx === correctIdx;
                                const isDimmedOut =
                                    finish && idx !== correctIdx;

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
                                                className={`max-w-[350px] font-arsenal text-[20px] font-bold leading-snug text-white drop-shadow-md transition-colors duration-200 group-hover:text-yellow-300 md:text-[22px] ${textPositionStyles[idx] || 'absolute inset-0 flex items-center justify-center'} `}
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
