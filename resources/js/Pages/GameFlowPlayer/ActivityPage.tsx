// import StreakBG from '@/assets/phone/STREAKBG.svg?react';
// import { useEffect, useLayoutEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import type { PlayerFlowStep } from '../../data/playerGameFlow';

// import gsap from 'gsap';

// type Props = {
//     step: PlayerFlowStep;
// };

// export default function StorylinePage({ step }: Props) {
//     const containerRef = useRef<HTMLElement>(null);
//     const bgRef = useRef<HTMLDivElement>(null);
//     const storylineRef = useRef<HTMLDivElement>(null);

//     useLayoutEffect(() => {
//         const ctx = gsap.context(() => {
//             const tl = gsap.timeline();

//             tl.fromTo(
//                 bgRef.current,
//                 {
//                     clipPath: 'inset(0 100% 0 0)',
//                 },
//                 {
//                     clipPath: 'inset(0 0% 0 0)',
//                     duration: 0.45,
//                     ease: 'power3.inOut',
//                 },
//             )

//                 .fromTo(
//                     storylineRef.current,
//                     {
//                         x: -30,
//                         y: 30,
//                         autoAlpha: 0,
//                     },
//                     {
//                         x: 0,
//                         y: 0,
//                         autoAlpha: 1,
//                         duration: 0.65,
//                         ease: 'power3.out',
//                     },
//                     '-=0.3',
//                 );
//         }, containerRef);

//         return () => ctx.revert();
//     }, []);

//     const navigate = useNavigate();
//     const [isClicked, setIsClicked] = useState(false);
//     const [barStage, setBarStage] = useState(0);

//     const clickSound = useRef(new Audio('/sounds/boom.mp3'));
//     const whooshSound = useRef(new Audio('/sounds/Whoosh.mp3'));

//     useEffect(() => {
//         const t1 = setTimeout(() => {
//             whooshSound.current.currentTime = 0;
//             whooshSound.current.volume = 0.5;
//             whooshSound.current.play().catch(console.error);
//             setBarStage(1);
//         }, 100);

//         const t2 = setTimeout(() => setBarStage(2), 400);
//         const t3 = setTimeout(() => setBarStage(3), 520);

//         return () => {
//             clearTimeout(t1);
//             clearTimeout(t2);
//             clearTimeout(t3);
//         };
//     }, []);

//     return (
//         <div className="relative h-screen w-full select-none overflow-hidden bg-[#0b0d10]">
//             <div
//                 ref={bgRef}
//                 className="absolute inset-0 flex items-center justify-center"
//                 style={{
//                     clipPath: 'inset(0 100% 0 0)',
//                 }}
//             >
//                 <StreakBG className="w-full" />
//             </div>

//             <div className="absolute inset-0 z-[3] flex items-center justify-center p-0 md:p-0">
//                 <div
//                     className="relative aspect-[1920/1080]"
//                     style={{
//                         width: 'min(100%, 1920px, calc((100vh - 2rem) * 1920 / 1080))',
//                     }}
//                 >
//                     {/* ACTIVITY BAR */}
//                     <img
//                         src="/activity/bar.png"
//                         alt=""
//                         className={`absolute left-1/2 top-1/2 z-10 h-auto w-[88%] -translate-y-1/2 transition-all duration-150 ease-linear sm:w-[80%] md:w-[74.045%] ${
//                             barStage === 0
//                                 ? '-translate-x-[180%] -rotate-6 scale-90 opacity-0'
//                                 : barStage === 1
//                                   ? '-translate-x-[45%] rotate-1 scale-105 opacity-100'
//                                   : barStage === 2
//                                     ? '-translate-x-[53%] -rotate-1 scale-[0.98]'
//                                     : '-translate-x-1/2 rotate-0 scale-100 opacity-100'
//                         } `}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// }

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
                <ActivityPayAttention className="h-auto w-full" />
            </div>
        </main>
    );
}
