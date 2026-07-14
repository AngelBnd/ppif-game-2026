import ActivityPayAttention from '@/assets/phone/ActivityPlayer.svg?react';
import StreakBG from '@/assets/phone/STREAKBG.svg?react';
import { PlayerFlowStep } from '@/data/playerGameFlow';

import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef } from 'react';

type Props = {
    step: PlayerFlowStep;
};

export default function StorylinePage({ step }: Props) {
    const containerRef = useRef<HTMLElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const storylineRef = useRef<HTMLDivElement>(null);

    const whooshSound = useRef(new Audio('/sounds/Whoosh.mp3'));

    useEffect(() => {
        const t1 = setTimeout(() => {
            whooshSound.current.currentTime = 0;
            whooshSound.current.volume = 0.5;
            whooshSound.current.play().catch(console.error);
        }, 100);

        return () => {
            clearTimeout(t1);
        };
    }, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.set(storylineRef.current, {
                xPercent: -90,
                rotation: -4,
                scale: 0.95,
                autoAlpha: 0,
            });

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
            );

            tl.to(storylineRef.current, {
                xPercent: 8,
                rotation: 2,
                scale: 1.03,
                autoAlpha: 1,
                duration: 0.55,
                ease: 'power3.out',
            })
                .to(storylineRef.current, {
                    xPercent: -2,
                    rotation: -1,
                    scale: 0.99,
                    duration: 0.15,
                    ease: 'power2.inOut',
                })
                .to(storylineRef.current, {
                    xPercent: 0,
                    rotation: 0,
                    scale: 1,
                    duration: 0.12,
                    ease: 'power2.out',
                });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={containerRef}
            className="relative flex min-h-screen items-center justify-center overflow-hidden text-white"
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
                <ActivityPayAttention className="h-auto w-full" />
            </div>
        </main>
    );
}
