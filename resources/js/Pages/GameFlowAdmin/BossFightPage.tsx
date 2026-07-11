import BossHealthBar from '@/Components/monitor/BossHealth';
import { TeamHP } from '@/Components/monitor/TeamHP';
import Codie from '@/assets/monitor/CODDDIE.svg?react';
import CrossHair from '@/assets/monitor/CROSSHAIR.svg?react';
import Fire from '@/assets/monitor/FIRE.svg?react';
import QuestBox from '@/assets/monitor/QuestBox.svg?react';
import Bullets from '@/assets/monitor/bullets.svg?react';
import PlaceholderBoss from '@/assets/monitor/placeholderboss.png';
import Taptap from '@/assets/monitor/taptap.svg?react';
import Thing from '@/assets/monitor/things.svg?react';
import type { AdminFlowStep } from '../../data/adminGameFlow';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

type Props = {
    step: AdminFlowStep;
};

const teams = [
    {
        id: 1,
        name: 'NAMATIM',
        currentHP: 75,
        maxHP: 100,
    },
    {
        id: 2,
        name: 'NAMATIM2',
        currentHP: 45,
        maxHP: 100,
    },
];

export default function BossFightPage({ step }: Props) {
    const containerRef = useRef<HTMLElement>(null);

    const codieRef = useRef<HTMLDivElement>(null);
    const thingRef = useRef<HTMLDivElement>(null);
    const bulletsRef = useRef<HTMLDivElement>(null);
    const tapTapRef = useRef<HTMLDivElement>(null);
    const fireRef = useRef<HTMLDivElement>(null);
    const bossHealthRef = useRef<HTMLDivElement>(null);
    const questBoxRef = useRef<HTMLDivElement>(null);
    const teamHPContainerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const ctx = gsap.context(() => {
            const codie = codieRef.current;
            const thing = thingRef.current;
            const bullets = bulletsRef.current;
            const tapTap = tapTapRef.current;
            const fire = fireRef.current;
            const bossHealth = bossHealthRef.current;
            const questBox = questBoxRef.current;
            const teamItems =
                teamHPContainerRef.current?.querySelectorAll('[data-team-hp]');

            if (
                !codie ||
                !thing ||
                !bullets ||
                !tapTap ||
                !fire ||
                !bossHealth ||
                !questBox
            ) {
                return;
            }

            const characterTimeline = gsap.timeline();

            characterTimeline
                .fromTo(
                    codie,
                    { xPercent: -20 },
                    {
                        xPercent: 0,
                        duration: 0.45,
                        ease: 'power3.out',
                    },
                )
                .fromTo(
                    thing,
                    {
                        scale: 0,
                        autoAlpha: 0,
                        transformOrigin: '50% 50%',
                    },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        duration: 0.35,
                        ease: 'back.out(2)',
                    },
                    '-=0.3',
                )
                .fromTo(
                    [bullets, fire, tapTap],
                    {
                        xPercent: -25,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.4,
                        stagger: 0.06,
                        ease: 'power3.out',
                    },
                    '-=0.28',
                );

            const uiTimeline = gsap.timeline({
                delay: 0.15,
            });

            uiTimeline
                .fromTo(
                    bossHealth,
                    {
                        scale: 0,
                        autoAlpha: 0,
                        rotate: -4,
                        transformOrigin: '50% 50%',
                    },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        rotate: 0,
                        duration: 0.4,
                        ease: 'back.out(2)',
                    },
                )
                .fromTo(
                    questBox,
                    {
                        scale: 0,
                        autoAlpha: 0,
                        rotate: 4,
                        transformOrigin: '50% 50%',
                    },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        rotate: 0,
                        duration: 0.4,
                        ease: 'back.out(2)',
                    },
                    '-=0.3',
                );

            if (teamItems && teamItems.length > 0) {
                gsap.fromTo(
                    teamItems,
                    {
                        xPercent: 30,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.45,
                        stagger: 0.1,
                        ease: 'power3.out',
                        delay: 0.2,
                    },
                );
            }
        }, container);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={containerRef}
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white"
        >
            <div className="absolute bottom-12 left-4 z-0">
                <div ref={thingRef} className="absolute -left-8 top-2 z-10">
                    <Thing className="block h-auto w-[36rem]" />
                </div>

                <div ref={codieRef} className="relative z-40">
                    <Codie className="block h-auto w-[23rem]" />
                </div>

                <div
                    ref={bulletsRef}
                    className="absolute -bottom-32 -left-20 z-40"
                >
                    <Bullets className="block h-auto w-[20rem]" />
                </div>

                <div
                    ref={tapTapRef}
                    className="absolute -right-36 bottom-20 z-40"
                >
                    <Taptap className="block h-auto w-[18rem]" />
                </div>

                <div
                    ref={fireRef}
                    className="absolute -right-[13.5rem] bottom-28 z-40"
                >
                    <Fire className="block h-auto w-[18rem]" />
                </div>
            </div>

            <div
                ref={bossHealthRef}
                className="absolute left-4 top-24 origin-center"
            >
                <BossHealthBar currentHP={750} maxHP={1000} />
            </div>

            <div
                ref={teamHPContainerRef}
                className="absolute bottom-16 right-4 flex gap-4"
            >
                {teams.map((team) => (
                    <div key={team.id} data-team-hp>
                        <TeamHP
                            teamName={team.name}
                            currentHP={team.currentHP}
                            maxHP={team.maxHP}
                        />
                    </div>
                ))}
            </div>

            <div
                ref={questBoxRef}
                className="absolute right-4 top-20 z-20 origin-center"
            >
                <QuestBox className="block h-auto w-full" />
            </div>

            <div className="absolute left-[55%] top-[16%] z-0">
                <img
                    src={PlaceholderBoss}
                    alt="Boss"
                    className="block h-auto w-[20rem]"
                />

                <CrossHair className="absolute bottom-0 left-24 z-20 w-[12rem]" />
            </div>
        </main>
    );
}
