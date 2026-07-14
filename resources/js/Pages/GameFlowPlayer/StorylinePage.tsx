import StorylinePayAttention from '@/assets/phone/Storyline.svg?react';
import StreakBG from '@/assets/phone/STREAKBG.svg?react';
import { PlayerFlowStep } from '@/data/playerGameFlow';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

type Props = {
    step: PlayerFlowStep;
};

export default function StorylinePage({ step }: Props) {
    const containerRef = useRef<HTMLElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const storylineRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo(
                bgRef.current,
                {
                    clipPath: 'inset(0 100% 0 0)',
                },
                {
                    clipPath: 'inset(0 0% 0 0)',
                    duration: 0.45,
                    ease: 'power3.inOut',
                },
            )

                .fromTo(
                    storylineRef.current,
                    {
                        x: -30,
                        y: 30,
                        autoAlpha: 0,
                    },
                    {
                        x: 0,
                        y: 0,
                        autoAlpha: 1,
                        duration: 0.65,
                        ease: 'power3.out',
                    },
                    '-=0.3',
                );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={containerRef}
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1a1a1a] text-white"
        >
            <div
                ref={bgRef}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    clipPath: 'inset(0 100% 0 0)',
                }}
            >
                <StreakBG className="w-full" />
            </div>

            <div ref={storylineRef} className="relative z-10">
                <StorylinePayAttention className="h-auto w-full" />
            </div>
        </main>
    );
}
