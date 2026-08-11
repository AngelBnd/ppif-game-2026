import ChatCodieBubble from '@/Components/global/ChatCodieBubble';
import { TeamHP } from '@/Components/monitor/TeamHP';
import Bosshealth from '@/assets/monitor/Bosshealth.svg?react';
import Codie from '@/assets/monitor/CODDDIE.svg?react';
import CrossHair from '@/assets/monitor/CROSSHAIR.svg?react';
import Fire from '@/assets/monitor/FIRE.svg?react';
import Bullets from '@/assets/monitor/bullets.svg?react';
import Taptap from '@/assets/monitor/taptap.svg?react';
import Thing from '@/assets/monitor/things.svg?react';
import Streak from '@/assets/phone/STREAKBG.svg?react';
import TungguPIC from '@/assets/phone/TungguPIC.svg?react';
import LightingStrike from '@/assets/svgs/LIGHTINGSTRIKE.svg?react';
import type { BossTapResult, SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';
import {
    type MouseEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import gsap from 'gsap';

// Total HP across all 3 boss phases - must match the sum of
// GameSession::BOSS_PHASE_MAX_HP on the backend. Used only to size the
// "contribution" meter so it fills up gradually over the whole fight
// instead of maxing out almost immediately.
const TEAM_CONTRIBUTION_MAX = 900;

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
    const fireAttackIdRef = useRef(0);
    const [cutscene, setCutscene] = useState(false);
    const [fireAttacks, setFireAttacks] = useState<
        { id: number; x: number; y: number }[]
    >([]);
    // Placeholder instructional overlay ("offer informative feedback" before
    // asking players to act) - frontend to restyle/animate this later.
    const [showIntro, setShowIntro] = useState(true);
    const phaseGateRef = useRef<HTMLDivElement>(null);

    // The fight is paused - on arrival and after every cleared phase - until
    // the PIC presses START on the monitor. Taps don't count while paused
    // (the server rejects them too, see BossFightController@tap).
    const phaseStarted = session?.boss_phase_started_at != null;

    const bossHp = session?.boss_hp ?? 0;
    const bossHpMax = session?.boss_hp_max ?? 1;
    const bossHpPercent = Math.min(
        Math.max((bossHp / bossHpMax) * 100, 0),
        100,
    );
    const myTeam = session?.teams.find((t) => t.id === team?.id);
    const isFinished = cutscene || session?.boss_finished_at != null;

    // Phase 2/3 swap in their own puppet cutscene clip; anything else
    // (including no session yet) falls back to the phase 1 clip.
    const bossVideoSrc =
        session?.boss_phase === 3
            ? '/videos/puppetcodie3.webm'
            : session?.boss_phase === 2
              ? '/videos/puppetcodie2.webm'
              : '/videos/puppetcodie.webm';

    useEffect(() => {
        if (session?.boss_finished_at) setCutscene(true);
    }, [session?.boss_finished_at]);

    // Whatever was still queued when the phase ended is dropped rather than
    // carried into the next one - those taps belong to a phase that's over.
    useEffect(() => {
        if (phaseStarted) return;
        pendingTapsRef.current = 0;
    }, [phaseStarted]);

    useEffect(() => {
        if (phaseStarted || isFinished || !phaseGateRef.current) return;

        gsap.fromTo(
            phaseGateRef.current,
            { scale: 0.5, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)' },
        );
    }, [phaseStarted, isFinished]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingTapsRef.current === 0 || isFinished || !phaseStarted) {
                return;
            }

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
    }, [onTap, isFinished, phaseStarted]);
    const codieRef = useRef<HTMLDivElement>(null);
    const streakRef = useRef<HTMLDivElement>(null);
    const thingRef = useRef<HTMLDivElement>(null);
    const bulletsRef = useRef<HTMLDivElement>(null);
    const tapTapRef = useRef<HTMLDivElement>(null);
    const crosshairRef = useRef<HTMLDivElement>(null);
    const fireRef = useRef<HTMLDivElement>(null);
    const bossHealthRef = useRef<HTMLDivElement>(null);
    const teamHPContainerRef = useRef<HTMLDivElement>(null);
    const introLightingRef = useRef<HTMLDivElement>(null);
    const introChatCodie1Ref = useRef<HTMLDivElement>(null);
    const introChatCodie2Ref = useRef<HTMLDivElement>(null);
    const tungguPICref = useRef<HTMLDivElement>(null);

    const phaseTexts: Record<number, { line1: string; line2: string }> = {
        1: {
            line1: 'TAP LAYAR SECEPAT MUNGKIN!',
            line2: 'Semua anggota tim dapat ikut untuk membantu!',
        },
        2: {
            line1: 'Puppet Codie masih belum terkalahkan!',
            line2: 'Ayo kita terus berjuang, teman-teman!',
        },
        3: {
            line1: 'Waduh, dia sudah mencapai final form!',
            line2: 'Mari kita terus berjuang, teman-teman!',
        },
    };
    const currentPhaseText =
        phaseTexts[session?.boss_phase ?? 1] ?? phaseTexts[1];

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

    // Guarded on phaseStarted too: the intro is only rendered once the
    // fight is live, so its refs are null while the gate is up.
    useLayoutEffect(() => {
        if (phaseStarted) return;

        const ctx = gsap.context(() => {
            gsap.set(introLightingRef.current, {
                clipPath: 'inset(0% 0 100% 0)',
            });
            gsap.set([introChatCodie1Ref.current, introChatCodie2Ref.current], {
                xPercent: -30,
                autoAlpha: 0,
            });
            gsap.set(tungguPICref.current, { autoAlpha: 0 });

            const tl = gsap.timeline();

            tl.to(introLightingRef.current, {
                clipPath: 'inset(0% 0 0% 0)',
                duration: 1.4,
                ease: 'power2.out',
            })
                .to(
                    [introChatCodie1Ref.current, introChatCodie2Ref.current],
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.5,
                        ease: 'back.out(1.2)',
                        stagger: 0.12,
                    },
                    '<0.1',
                )
                .to(tungguPICref.current, {
                    autoAlpha: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                })

                .to(tungguPICref.current, {
                    autoAlpha: 0.15,
                    duration: 0.6,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power1.inOut',
                });
        }, containerRef);

        return () => ctx.revert();
    }, [phaseStarted]);

    const handleFireTap = (event: MouseEvent<HTMLDivElement>) => {
        if (isFinished || !phaseStarted) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const fireAttack = {
            id: fireAttackIdRef.current++,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        };

        setFireAttacks((current) => [...current, fireAttack]);
        setTimeout(() => {
            setFireAttacks((current) =>
                current.filter((attack) => attack.id !== fireAttack.id),
            );
        }, 450);

        // First tap doubles as "dismiss the instructions" - still counts
        // toward the boss's HP, no wasted tap.
        if (showIntro) setShowIntro(false);

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
            // Same punch-in-punch-out pattern every tap, but the exact
            // scale/rotation it punches to varies a bit so a rapid burst
            // of taps doesn't look mechanically identical each time.
            const randomScale = gsap.utils.random(0.88, 0.95);
            const randomRotation = gsap.utils.random(-6, 6);

            gsap.fromTo(
                crosshairRef.current,
                {
                    scale: 1,
                    y: 0,
                    rotation: 0,
                },
                {
                    scale: randomScale,
                    y: 10,
                    rotation: randomRotation,
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
                {fireAttacks.map((attack) => (
                    <img
                        key={attack.id}
                        src="/activity/fire-attack.png"
                        alt=""
                        className="pointer-events-none absolute z-[75] w-24 -translate-x-1/2 -translate-y-1/2 animate-ping"
                        style={{ left: attack.x, top: attack.y }}
                    />
                ))}

                <div className="relative top-4 z-40 flex w-full flex-col">
                    <div className="relative w-full" ref={bossHealthRef}>
                        <Bosshealth className="block h-auto w-full" />

                        <div className="absolute left-[12%] top-2 z-20 h-[1rem] w-[76%] overflow-hidden">
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

                {/* PLACEHOLDER styling - frontend team to restyle. Shown
                    whenever the fight is waiting on the PIC's START press:
                    before phase 1, and again after each cleared phase. */}
                {/* {!phaseStarted && !isFinished && (
                    <div
                        ref={phaseGateRef}
                        className="pointer-events-none absolute inset-0 z-[70] flex justify-center"
                    >
                        <div className="absolute inset-0 z-20 h-full w-full bg-[#0A0C0F] opacity-80" />
                        <div className="absolute top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-3 px-8 text-center">
                            <p className="font-noto text-4xl font-bold text-red-400">
                                {session?.boss_phase === 3
                                    ? 'FINAL PHASE'
                                    : `PHASE ${session?.boss_phase ?? 1}`}
                            </p>
                            <p className="font-arsenal text-xl font-bold text-white">
                                Wait for your module instruction
                            </p>
                        </div>
                    </div>
                )} */}

                {!phaseStarted && !isFinished && (
                    // PLACEHOLDER - frontend team to redesign/restyle this.
                    // Tells players what to do before they need to do it
                    // (Shneiderman's "offer informative feedback").
                    <div className="absolute inset-0 z-[65] flex flex-col items-center justify-center gap-3 bg-black/80 px-8 text-center">
                        <div
                            ref={introLightingRef}
                            className="absolute w-[32rem]"
                        >
                            <LightingStrike className="block h-auto w-full" />
                        </div>
                        <ChatCodieBubble
                            ref={introChatCodie1Ref}
                            className="-ml-3"
                            textClassName="top-10 h-[4rem] text-2xl"
                            text={currentPhaseText.line1}
                        />

                        <ChatCodieBubble
                            ref={introChatCodie2Ref}
                            className="ml-4"
                            textClassName="top-12 h-[4rem] text-2xl"
                            text={currentPhaseText.line2}
                        />

                        <div ref={tungguPICref} className="relative mt-16">
                            <TungguPIC />
                        </div>
                    </div>
                )}

                {isFinished && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 px-8 text-center">
                        <p className="font-arsenal text-2xl font-bold text-white">
                            Puppet codie tidak bisa dikalahkan....
                        </p>
                    </div>
                )}

                <div className="left-32% absolute top-[40%] z-0 w-[24rem] -translate-y-1/2">
                    <video
                        key={bossVideoSrc}
                        autoPlay
                        loop
                        draggable={false}
                        muted
                        playsInline
                        tabIndex={-1}
                        className="block h-auto w-full outline-none [-webkit-tap-highlight-color:transparent]"
                    >
                        <source src={bossVideoSrc} type="video/webm" />
                    </video>

                    <div
                        ref={crosshairRef}
                        className="absolute -right-8 bottom-4 w-[9rem] -translate-x-1/2"
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
