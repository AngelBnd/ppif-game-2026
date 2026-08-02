import BossHealthBar from '@/Components/monitor/BossHealth';
import { TeamHP } from '@/Components/monitor/TeamHP';
import BOSS from '@/assets/monitor/BOSS.svg?react';
import BOSSBG from '@/assets/monitor/BOSSBG.svg?react';
import Codie from '@/assets/monitor/CODDDIE.svg?react';
import CrossHair from '@/assets/monitor/CROSSHAIR.svg?react';
import FIGHT from '@/assets/monitor/FGHT.svg?react';
import Fire from '@/assets/monitor/FIRE.svg?react';
import QuestBox from '@/assets/monitor/QuestBox.svg?react';
import Bullets from '@/assets/monitor/bullets.svg?react';
import Taptap from '@/assets/monitor/taptap.svg?react';
import Thing from '@/assets/monitor/things.svg?react';
import type { SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';

import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Must match TEAM_CONTRIBUTION_MAX in the player BossFightPage (and the
// sum of GameSession::BOSS_PHASE_MAX_HP on the backend).
const TEAM_CONTRIBUTION_MAX = 900;

type Props = {
    step: Step;
    session: SessionInfo | null;
    onStartPhase: () => Promise<SessionInfo>;
};

export default function BossFightPage({ step, session, onStartPhase }: Props) {
    const containerRef = useRef<HTMLElement>(null);
    const isFinished = session?.boss_finished_at != null;

    // Every phase sits paused until the PIC presses START below - both on
    // arrival at the boss step (phase 1) and after each cleared phase.
    const phaseStarted = session?.boss_phase_started_at != null;
    const [isStarting, setIsStarting] = useState(false);
    const [startError, setStartError] = useState(false);
    const [pressState, setPressState] = useState<'idle' | 'press'>('idle');

    // The HP bar shown on screen lags behind the live session state across a
    // phase change - held at the old phase's numbers for as long as the
    // fight is paused, so it doesn't jump to the next phase's full bar the
    // instant the clearing tap lands server-side. It snaps to the new phase
    // when the PIC starts it. Regular in-phase HP ticks update immediately.
    const [displayedHp, setDisplayedHp] = useState(session?.boss_hp ?? 0);
    const [displayedHpMax, setDisplayedHpMax] = useState(
        session?.boss_hp_max ?? 1,
    );

    const phaseGateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hp = session?.boss_hp;
        const hpMax = session?.boss_hp_max;
        if (hp === undefined || hpMax === undefined) return;
        if (!phaseStarted) return;

        setDisplayedHp(hp);
        setDisplayedHpMax(hpMax);
    }, [session?.boss_hp, session?.boss_hp_max, phaseStarted]);

    useEffect(() => {
        if (phaseStarted || isFinished || !phaseGateRef.current) return;

        gsap.fromTo(
            phaseGateRef.current,
            { scale: 0.5, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)' },
        );
    }, [phaseStarted, isFinished]);

    const handleStartPhase = () => {
        if (isStarting) return;

        setIsStarting(true);
        setStartError(false);
        setPressState('press');
        setTimeout(() => setPressState('idle'), 160);

        onStartPhase()
            .catch(() => setStartError(true))
            .finally(() => setIsStarting(false));
    };

    const codieRef = useRef<HTMLDivElement>(null);
    const thingRef = useRef<HTMLDivElement>(null);
    const bulletsRef = useRef<HTMLDivElement>(null);
    const tapTapRef = useRef<HTMLDivElement>(null);
    const fireRef = useRef<HTMLDivElement>(null);
    const bossHealthRef = useRef<HTMLDivElement>(null);
    const questBoxRef = useRef<HTMLDivElement>(null);
    const teamHPContainerRef = useRef<HTMLDivElement>(null);
    const bossIntroContainerRef = useRef<HTMLDivElement>(null);
    const bossGroupRef = useRef<HTMLDivElement>(null);
    const fightRef = useRef<HTMLDivElement>(null);
    const bossOverlayRef = useRef<HTMLDivElement>(null);
    const crosshairPulseRef = useRef<HTMLDivElement>(null);

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

    useLayoutEffect(() => {
        const container = bossIntroContainerRef.current;
        const overlay = bossOverlayRef.current;
        const bossGroup = bossGroupRef.current;
        const fight = fightRef.current;

        if (!container || !overlay || !bossGroup || !fight) return;

        const ctx = gsap.context(() => {
            const timeline = gsap.timeline();

            timeline
                // Fade in the black overlay
                .fromTo(
                    overlay,
                    {
                        autoAlpha: 0,
                    },
                    {
                        autoAlpha: 0.85,
                        duration: 0.2,
                        ease: 'power2.out',
                    },
                )

                // BOSS + BOSSBG enter from top-left
                .fromTo(
                    bossGroup,
                    {
                        xPercent: -300,
                        yPercent: -120,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        yPercent: 0,
                        autoAlpha: 1,
                        duration: 0.35,
                        ease: 'power3.out',
                    },
                    '-=0.1',
                )

                // FIGHT enters from bottom-right at almost the same time
                .fromTo(
                    fight,
                    {
                        xPercent: 300,
                        yPercent: 120,
                        autoAlpha: 0,
                    },
                    {
                        xPercent: 0,
                        yPercent: 0,
                        autoAlpha: 1,
                        duration: 0.35,
                        ease: 'power3.out',
                    },
                    '-=0.3',
                )

                // Stay visible
                .to({}, { duration: 1 })

                // Both exit at the same time
                .to(
                    bossGroup,
                    {
                        xPercent: -300,
                        yPercent: -120,
                        autoAlpha: 0,
                        duration: 0.35,
                        ease: 'power3.in',
                    },
                    'exit',
                )
                .to(
                    fight,
                    {
                        xPercent: 300,
                        yPercent: 120,
                        autoAlpha: 0,
                        duration: 0.35,
                        ease: 'power3.in',
                    },
                    'exit',
                )

                .to(
                    overlay,
                    {
                        autoAlpha: 0,
                        duration: 0.25,
                        ease: 'power2.in',
                    },
                    'exit+=0.25',
                );
        }, container);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        if (!crosshairPulseRef.current) return;

        const tween = gsap.to(crosshairPulseRef.current, {
            scale: 1.35,
            duration: 0.6,
            rotate: 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });

        return () => {
            tween.kill();
        };
    }, []);

    return (
        <main
            ref={containerRef}
            className="relative flex min-h-screen items-center justify-center overflow-hidden text-white"
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
                className="absolute left-4 top-24 z-30 origin-center"
            >
                <BossHealthBar currentHP={displayedHp} maxHP={displayedHpMax} />
            </div>

            <div
                ref={teamHPContainerRef}
                className="absolute bottom-16 right-4 flex gap-4"
            >
                {session?.teams.map((team) => (
                    <div key={team.id} data-team-hp>
                        <TeamHP
                            teamName={team.name}
                            currentHP={team.hp}
                            maxHP={TEAM_CONTRIBUTION_MAX}
                        />
                    </div>
                ))}
            </div>

            {/* PLACEHOLDER styling - frontend team to restyle. The gate
                itself is functional: nothing in the fight moves until the
                PIC presses START, once per phase.

                z-46 sits above the fight visuals and the "defeated" overlay
                but below the Next / Clear Session buttons (z-50), so the PIC
                can still advance or bail out while a phase is paused. */}
            {!phaseStarted && !isFinished && (
                <div
                    ref={phaseGateRef}
                    className="absolute inset-0 z-[46] flex justify-center"
                >
                    <div className="absolute inset-0 z-20 h-screen w-screen bg-[#0A0C0F] opacity-80" />
                    <div className="absolute top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-4">
                        <p className="font-noto text-6xl font-bold text-red-400">
                            {session?.boss_phase === 3
                                ? 'FINAL PHASE'
                                : `PHASE ${session?.boss_phase ?? 1}`}
                        </p>
                        <p className="font-arsenal text-lg text-white/60">
                            Peserta sedang menunggu - tekan START untuk memulai
                            phase ini.
                        </p>

                        <button
                            type="button"
                            onClick={handleStartPhase}
                            disabled={isStarting || !session}
                            className={`mt-2 w-[18rem] rotate-[2deg] cursor-pointer transition-transform duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                                pressState === 'press'
                                    ? 'scale-90'
                                    : 'hover:scale-105 active:scale-90'
                            }`}
                        >
                            <img
                                src="/starting-page/START_TEXT.svg"
                                alt="Start"
                                className="pointer-events-none h-auto w-full"
                            />
                        </button>

                        {startError && (
                            <p className="font-arsenal text-sm text-red-400">
                                Gagal memulai phase - coba tekan START lagi.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {isFinished && (
                <div className="absolute inset-0 z-[45] flex items-center justify-center bg-black/85 px-8 text-center">
                    <p className="font-arsenal text-4xl font-bold text-white">
                        Puppet codie tidak bisa dikalahkan...
                    </p>
                </div>
            )}

            <div
                ref={questBoxRef}
                className="absolute right-4 top-20 z-20 origin-center"
            >
                <QuestBox className="block h-auto w-full" />
            </div>

            <div className="absolute left-[47%] top-[10%] z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="block h-auto w-[24rem]"
                >
                    <source src="/videos/puppetcodie.webm" type="video/webm" />
                </video>

                <div
                    ref={crosshairPulseRef}
                    className="absolute bottom-4 left-48 z-20 w-[12rem]"
                >
                    <CrossHair className="block h-auto w-full" />
                </div>
            </div>
            <div
                ref={bossOverlayRef}
                className="pointer-events-none absolute inset-0 z-40 bg-black opacity-50"
            />
            <div
                ref={bossIntroContainerRef}
                className="pointer-events-none absolute left-1/2 top-1/2 z-50 h-[24rem] w-[32rem] -translate-x-1/2 -translate-y-1/2"
            >
                <div ref={bossGroupRef} className="absolute inset-0">
                    <BOSSBG className="absolute -top-12 left-8 z-0 block h-auto w-[21.9rem]" />

                    <BOSS className="absolute left-12 top-[0rem] z-20 block h-auto w-[20rem]" />
                </div>

                <div ref={fightRef} className="absolute inset-0 z-10">
                    <FIGHT className="absolute right-2 top-[8rem] block h-auto w-[26rem]" />
                </div>
            </div>
        </main>
    );
}
