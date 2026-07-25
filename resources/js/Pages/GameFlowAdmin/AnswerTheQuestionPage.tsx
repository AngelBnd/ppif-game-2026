import Codie from '@/assets/monitor/CODDDIE.svg?react';
import Exclamation from '@/assets/monitor/exclamation.svg?react';
import HP from '@/assets/monitor/HP.svg?react';
import Seconds from '@/assets/monitor/SECONDS.svg?react';
import TriangleThing from '@/assets/monitor/trianglething.svg?react';
import DialogueBox from '@/Components/monitor/dialogueBox';
import type { SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

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

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                defaults: {
                    ease: 'power3.out',
                },
            });

            timeline
                .fromTo(
                    codieRef.current,
                    {
                        x: '-70%',
                    },
                    {
                        x: 0,
                        ease: 'power2.out',
                        duration: 0.8,
                    },
                )
                .fromTo(
                    dialogueRef.current,
                    {
                        x: '-10%',
                        autoAlpha: 0,
                    },
                    {
                        x: 0,
                        autoAlpha: 1,
                        duration: 0.6,
                        ease: 'power2.out',
                    },
                    '-=0.55',
                )
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
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <main className="pointer-events-none flex min-h-screen items-center justify-center overflow-hidden bg-gray-700 text-white">
            <div ref={containerRef} className="relative h-screen w-screen">
                <div
                    ref={hpRef}
                    className="absolute bottom-16 right-4 h-auto w-[13rem] origin-center"
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
                    className="absolute left-6 top-6 block h-auto w-[13rem] origin-center"
                >
                    <Seconds className="block h-auto w-full" />

                    <span className="absolute left-[60px] top-20 font-arsenal text-5xl text-[#FFFE25]">
                        60
                    </span>
                </div>

                <div
                    ref={codieRef}
                    className="absolute bottom-12 left-0 h-auto w-[25rem]"
                >
                    <Codie className="block h-auto w-full" />
                </div>

                <div ref={dialogueRef} className="absolute bottom-0 left-40">
                    <Exclamation className="absolute right-20 top-8 z-20 h-auto w-[14rem]" />

                    <TriangleThing className="absolute bottom-12 left-56 z-20" />

                    <DialogueBox
                        msg={`Please answer the question
on your phone!`}
                        classNameSizeBox="!w-[60rem]"
                        classNameIdentitySize="!w-[4rem]"
                        className="relative"
                    />
                </div>
            </div>
        </main>
    );
}
