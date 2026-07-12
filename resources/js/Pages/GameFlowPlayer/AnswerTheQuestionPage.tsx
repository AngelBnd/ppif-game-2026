import Codie from '@/assets/monitor/CODDDIE.svg?react';
import HP from '@/assets/monitor/HP.svg?react';
import Seconds from '@/assets/monitor/SECONDS.svg?react';
import Chatbox from '@/assets/phone/ChatBox.svg?react';
import InputJawaban from '@/assets/phone/InputJawaban.svg?react';
import OKbutton from '@/assets/phone/OK.svg?react';
import Streak from '@/assets/phone/STREAKBG.svg?react';
import Soalbrp from '@/assets/phone/SoalBerapa.svg?react';
import { PlayerFlowStep } from '@/data/playerGameFlow';
import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
type Props = {
    step: PlayerFlowStep;
    question?: string;
};

export default function AnswerTheQuestionPage({ step, question }: Props) {
    const containerRef = useRef<HTMLElement>(null);

    const secondsRef = useRef<HTMLDivElement>(null);
    const hpRef = useRef<HTMLDivElement>(null);

    const codieGroupRef = useRef<HTMLDivElement>(null);
    const codieRef = useRef<HTMLDivElement>(null);
    const chatGroupRef = useRef<HTMLDivElement>(null);
    const streakRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo(
                secondsRef.current,
                {
                    scale: 0.6,
                    autoAlpha: 0,
                },
                {
                    scale: 1,
                    autoAlpha: 1,
                    duration: 0.45,
                    ease: 'back.out(2)',
                },
            )

                .fromTo(
                    hpRef.current,
                    {
                        scale: 0.6,
                        autoAlpha: 0,
                    },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        duration: 0.45,
                        ease: 'back.out(2)',
                    },
                    '<0.08',
                )

                .fromTo(
                    streakRef.current,
                    {
                        clipPath: 'inset(0 100% 0 0)',
                    },
                    {
                        clipPath: 'inset(0 0% 0 0)',
                        duration: 0.5,
                        ease: 'power3.inOut',
                    },
                    '<0.05',
                )

                .fromTo(
                    codieRef.current,
                    {
                        x: -120,
                        autoAlpha: 0,
                    },
                    {
                        x: 0,
                        autoAlpha: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    '<0.1',
                )

                .fromTo(
                    chatGroupRef.current,
                    {
                        x: -80,
                        autoAlpha: 0,
                    },
                    {
                        x: 0,
                        autoAlpha: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    '<0.08',
                );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={containerRef}
            className="flex h-dvh items-center justify-center"
        >
            <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-slate-700">
                <div className="relative z-10 flex h-full flex-col items-center justify-start gap-6">
                    <div className="relative mb-12 flex h-[10rem] w-full justify-between px-2 py-2">
                        <div
                            ref={secondsRef}
                            className="relative block h-auto w-[10rem] origin-center"
                        >
                            <Seconds className="block h-auto w-full" />

                            <span className="absolute left-[50px] top-[4rem] font-arsenal text-4xl text-[#FFFE25]">
                                60
                            </span>
                        </div>

                        <div
                            ref={hpRef}
                            className="relative h-auto w-[8rem] origin-center"
                        >
                            <HP className="relative h-auto w-full" />

                            <div className="absolute left-7 top-24 z-20 flex flex-col items-center leading-none">
                                <div className="flex items-center text-[36px] font-bold tracking-[-0.04em]">
                                    <span className="text-[#73F9D9]">0</span>

                                    <span className="mx-1 text-[#F0F2F5]">
                                        /
                                    </span>

                                    <span className="text-[#F168DB]">2</span>
                                </div>

                                <p className="font-noto text-xs font-bold leading-none text-[#F0F2F5]">
                                    has answered
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={codieGroupRef}
                        className="relative mt-6 h-[12rem] w-full"
                    >
                        <div
                            ref={codieRef}
                            className="absolute -left-24 -top-12 h-auto w-[13rem]"
                        >
                            <Codie className="h-auto w-full" />
                        </div>

                        <div
                            ref={chatGroupRef}
                            className="absolute -right-2 top-20 z-30 w-[23rem]"
                        >
                            <div className="relative w-full">
                                <Chatbox className="h-auto w-full" />

                                <div className="absolute inset-0 left-[5rem] top-2 z-10 flex w-[75%] items-center justify-center p-6 text-left font-arsenal font-bold text-[#F0F2F5]">
                                    {question}
                                </div>
                            </div>

                            <div className="absolute -top-10 left-2 h-auto w-[7rem]">
                                <Soalbrp className="h-auto w-full" />

                                <div className="absolute inset-0 -top-2 z-10 flex -rotate-6 items-center justify-center font-noto text-sm font-bold text-[#0A0C0F]">
                                    Soal 1
                                </div>
                            </div>
                        </div>

                        <div
                            ref={streakRef}
                            className="pointer-events-none absolute left-1/2 top-[75%] z-0 h-auto w-full -translate-x-1/2 -scale-x-100"
                            style={{
                                clipPath: 'inset(0 100% 0 0)',
                            }}
                        >
                            <Streak className="h-auto w-full" />
                        </div>
                    </div>

                    <div className="relative z-40 mt-16 flex h-fit flex-col items-center gap-5">
                        <div className="relative">
                            <input
                                type="text"
                                className="absolute left-1/2 top-[1rem] z-30 h-[2.5rem] w-72 -translate-x-1/2 border-0 bg-[#0A0C0F] text-center text-2xl text-white outline-none ring-0 placeholder:text-[#5A5B5C] focus:border-0 focus:outline-none focus:ring-0"
                                placeholder="Input Jawaban"
                            />

                            <InputJawaban className="relative block h-auto w-[23rem]" />
                        </div>

                        <OKbutton className="absolute mt-10 w-36 cursor-pointer" />
                    </div>
                </div>
            </div>
        </main>
    );
}
