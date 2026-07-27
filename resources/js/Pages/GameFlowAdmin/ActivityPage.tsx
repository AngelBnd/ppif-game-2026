import ActivityBox from '@/assets/monitor/ActivityPleaseFollowModulesInstruction.svg?react';
import BGCheck from '@/assets/monitor/BGCheck.svg?react';
import type { Step } from '@/types/step';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

type Props = {
    step: Step;
};

export default function ActivityPage({ step }: Props) {
    const containerRef = useRef<HTMLElement>(null);
    const bgCheckRef = useRef<HTMLDivElement>(null);
    const activityBoxRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline();

            timeline
                .fromTo(
                    bgCheckRef.current,
                    {
                        clipPath: 'inset(0 100% 0 0)',
                    },
                    {
                        clipPath: 'inset(0 0% 0 0)',
                        duration: 0.4,
                        ease: 'power3.inOut',
                    },
                )
                .fromTo(
                    activityBoxRef.current,
                    {
                        x: -100,
                        y: 100,
                        autoAlpha: 0,
                    },
                    {
                        x: 0,
                        y: 0,
                        autoAlpha: 1,
                        duration: 0.6,
                        ease: 'power3.out',
                    },
                    '-=0.45',
                );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={containerRef}
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090909] text-white"
        >
            <div
                ref={bgCheckRef}
                className="absolute"
                style={{
                    clipPath: 'inset(0 100% 0 0)',
                }}
            >
                <BGCheck className="block w-[102rem] opacity-85" />
            </div>

            <div ref={activityBoxRef} className="absolute">
                <ActivityBox className="block w-[60rem]" />
            </div>
        </main>
    );
}
