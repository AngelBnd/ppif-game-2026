import { TeamHP } from '@/Components/monitor/TeamHP';
import Bosshealth from '@/assets/monitor/Bosshealth.svg?react';
import Codie from '@/assets/monitor/CODDDIE.svg?react';
import CrossHair from '@/assets/monitor/CROSSHAIR.svg?react';
import Fire from '@/assets/monitor/FIRE.svg?react';
import Bullets from '@/assets/monitor/bullets.svg?react';
import PlaceholderBoss from '@/assets/monitor/placeholderboss.png';
import Taptap from '@/assets/monitor/taptap.svg?react';
import Thing from '@/assets/monitor/things.svg?react';
import Streak from '@/assets/phone/STREAKBG.svg?react';
import type { BossTapResult, SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import gsap from 'gsap';

// Total HP across all 3 boss phases - must match the sum of
// GameSession::BOSS_PHASE_MAX_HP on the backend. Used only to size the
// "contribution" meter so it fills up gradually over the whole fight
// instead of maxing out almost immediately.
const TEAM_CONTRIBUTION_MAX = 450;

// Batches taps client-side and flushes on an interval instead of firing an
// HTTP request per tap - see BossFightController@tap for the server side.
const TAP_FLUSH_INTERVAL_MS = 300;

type Props = {
    step: Step;
    session: SessionInfo | null;
    team: { id: number; name: string } | null;
    onTap: (taps: number) => Promise<BossTapResult>;
};

export default function BossFightPage({ step, session, team, onTap }: Props) {
    const containerRef = useRef<HTMLElement>(null);
    const pendingTapsRef = useRef(0);
    const [cutscene, setCutscene] = useState(false);
    const [phaseBanner, setPhaseBanner] = useState<number | null>(null);
    const prevPhaseRef = useRef<number | undefined>(undefined);
    const phaseBannerRef = useRef<HTMLDivElement>(null);

    const bossHp = session?.boss_hp ?? 0;
    const bossHpMax = session?.boss_hp_max ?? 1;
    const bossHpPercent = Math.min(
        Math.max((bossHp / bossHpMax) * 100, 0),
        100,
    );
    const myTeam = session?.teams.find((t) => t.id === team?.id);
    const isFinished = cutscene || session?.boss_finished_at != null;

    useEffect(() => {
        if (session?.boss_finished_at) setCutscene(true);
    }, [session?.boss_finished_at]);

    // Flash "PHASE N" whenever the boss's phase changes - either from this
    // device's own tap batch or from another player's/team's, via the
    // shared session state (Echo-synced in usePlayerSession).
    useEffect(() => {
        const phase = session?.boss_phase;
        if (phase === undefined) return;

        if (prevPhaseRef.current !== undefined && phase !== prevPhaseRef.current) {
            setPhaseBanner(phase);
            const timeout = setTimeout(() => setPhaseBanner(null), 1500);
            prevPhaseRef.current = phase;
            return () => clearTimeout(timeout);
        }

        prevPhaseRef.current = phase;
    }, [session?.boss_phase]);

    useEffect(() => {
        if (phaseBanner === null || !phaseBannerRef.current) return;

        gsap.fromTo(
            phaseBannerRef.current,
            { scale: 0.5, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)' },
        );
    }, [phaseBanner]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingTapsRef.current === 0 || isFinished) return;

            const taps = Math.min(pendingTapsRef.current, 50);
            // Only drop what's actually being sent - a burst over 50
            // carries the remainder into the next flush instead of
            // silently losing taps during fast tapping.
            pendingTapsRef.current -= taps;

            onTap(taps)
                .then((result) => {
                    if (result.cutscene) setCutscene(true);
                })
                .catch(() => {});
        }, TAP_FLUSH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [onTap, isFinished]);
    const codieRef = useRef<HTMLDivElement>(null);
    const streakRef = useRef<HTMLDivElement>(null);
    const thingRef = useRef<HTMLDivElement>(null);
    const bulletsRef = useRef<HTMLDivElement>(null);
    const tapTapRef = useRef<HTMLDivElement>(null);
    const crosshairRef = useRef<HTMLDivElement>(null);
    const fireRef = useRef<HTMLDivElement>(null);
    const bossHealthRef = useRef<HTMLDivElement>(null);
    const teamHPContainerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        gsap.set(streakRef.current, {
            clipPath: 'inset(0 100% 0 0)',
        });

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo(
                bossHealthRef.current,
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
                    teamHPContainerRef.current,
                    {
                        x: 40,
                        autoAlpha: 0,
                    },
                    {
                        x: 0,
                        autoAlpha: 1,
                        duration: 0.45,
                        ease: 'power3.out',
                    },
                    '<0.1',
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
                        xPercent: -20,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.45,
                        ease: 'power3.out',
                    },
                    '<0.05',
                )

                .fromTo(
                    thingRef.current,
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
                    '<0.05',
                )

                .fromTo(
                    bulletsRef.current,
                    {
                        xPercent: -25,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    '<0.05',
                )

                .fromTo(
                    tapTapRef.current,
                    {
                        xPercent: -25,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    '<0.05',
                )

                .fromTo(
                    fireRef.current,
                    {
                        xPercent: -25,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    '<0.05',
                );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleFireTap = () => {
        if (isFinished) return;

        pendingTapsRef.current += 1;

        gsap.killTweensOf(fireRef.current);
        gsap.killTweensOf(fireRef.current);

        if (fireRef.current) {
            gsap.timeline()
                .to(fireRef.current, {
                    x: -18,
                    scale: 0.92,
                    rotate: -4,
                    duration: 0.05,
                    ease: 'power2.out',
                })
                .to(fireRef.current, {
                    x: 0,
                    scale: 1,
                    rotate: 0,
                    duration: 0.08,
                    ease: 'back.out(2.5)',
                });
        }

        if (crosshairRef.current) {
            gsap.fromTo(
                crosshairRef.current,
                {
                    scale: 1,
                    y: 0,
                    rotation: 0,
                },
                {
                    scale: 0.92,
                    y: 10,
                    rotation: -2,
                    duration: 0.06,
                    repeat: 1,
                    yoyo: true,
                    ease: 'power2.out',
                    overwrite: 'auto',
                },
            );
        }
    };

    return (
        <main
            ref={containerRef}
            className="flex h-dvh items-center justify-center"
        >
            <div
                className="relative h-full w-full max-w-[430px] overflow-hidden"
                onClick={handleFireTap}
            >
                <div className="relative top-4 z-40 flex w-full flex-col">
                    <div className="relative w-full" ref={bossHealthRef}>
                        <Bosshealth className="block h-auto w-full" />

                        <div className="absolute left-[12%] top-2 z-20 h-[1rem] w-[76%] overflow-hidden bg-[#2a3032]">
                            <div
                                className="h-full bg-[#BF1E2E] transition-[width] duration-500 ease-out"
                                style={{
                                    width: `${bossHpPercent}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div
                        className="-mt-4 scale-75 self-end"
                        ref={teamHPContainerRef}
                    >
                        <TeamHP
                            teamName={team?.name ?? ''}
                            currentHP={myTeam?.hp ?? 0}
                            maxHP={TEAM_CONTRIBUTION_MAX}
                        />
                    </div>
                </div>

                {phaseBanner !== null && !isFinished && (
                    <div
                        ref={phaseBannerRef}
                        className="pointer-events-none absolute inset-x-0 top-[30%] z-[55] flex justify-center"
                    >
                        <p className="rounded bg-black/70 px-6 py-2 font-arsenal text-3xl font-bold text-[#FFFE25]">
                            PHASE {phaseBanner}
                        </p>
                    </div>
                )}

                {isFinished && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 px-8 text-center">
                        <p className="font-arsenal text-2xl font-bold text-white">
                            The boss was too strong...
                        </p>
                    </div>
                )}

                <div className="absolute left-1/2 top-[40%] z-0 w-[13rem] -translate-x-1/2 -translate-y-1/2">
                    <img
                        src={PlaceholderBoss}
                        alt="Boss"
                        className="block h-auto w-full"
                    />

                    <div
                        ref={crosshairRef}
                        className="absolute -bottom-20 left-1/2 w-[9rem] -translate-x-1/2"
                    >
                        <CrossHair className="block w-full" />
                    </div>
                </div>

                <div
                    ref={streakRef}
                    className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-[115rem] -translate-x-1/2"
                >
                    <Streak className="block w-full" />
                </div>

                <div className="absolute -bottom-16 -left-28 z-30 scale-75">
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
            </div>
        </main>
    );
}
