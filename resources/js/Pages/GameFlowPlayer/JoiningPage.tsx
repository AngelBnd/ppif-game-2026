import InputBorderBottom from '@/assets/phone/InputBorderBottomSVG.svg?react';
import InputYourCode from '@/assets/phone/inputurcode.svg?react';
import StreakBG from '@/assets/phone/STREAKBG.svg?react';
import JoinSVG from '@/assets/svgs/JoinSVG.svg?react';
import LightingStrike from '@/assets/svgs/LIGHTINGSTRIKE.svg?react';
import SelectionGroupBG from '@/assets/svgs/SelectionGroupBG.svg';
import Button from '@/Components/global/Button';
import ChatCodieBubble from '@/Components/global/ChatCodieBubble';
import ConfirmPopup from '@/Components/global/ConfirmPopup';
import Input from '@/Components/global/Input';
import type { SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const isDev = import.meta.env.DEV;

// Dev-only stand-in for a real onPeek response, so the name+team screen can
// be previewed without an actual admin session/room code.
const MOCK_TEAMS: SessionInfo['teams'] = [
    { id: -1, number: 1, name: 'Stella', score: 0, hp: 0, players: [] },
    { id: -2, number: 2, name: 'Nexus', score: 0, hp: 0, players: [] },
];

type Props = {
    step: Step;
    onPeek: (code: string) => Promise<SessionInfo>;
    onJoin: (
        code: string,
        teamId: number,
        nickname: string,
    ) => Promise<unknown>;
};

type CodeInputProps = {
    length?: number;
    onComplete?: (value: string) => void;
    inputBgRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
};

function CodeInput({ length = 6, onComplete, inputBgRefs }: CodeInputProps) {
    const [values, setValues] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number,
    ) => {
        const char = e.target.value.slice(-1);

        if (char && !/[0-9]/.test(char)) return;

        const newValues = [...values];
        newValues[index] = char;
        setValues(newValues);

        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        const finalValue = newValues.join('');

        if (finalValue.length === length && !newValues.includes('')) {
            onComplete?.(finalValue);
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number,
    ) => {
        if (e.key === 'Backspace' && values[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pasted = e.clipboardData
            .getData('text')
            .replace(/[^0-9]/g, '')
            .slice(0, length)
            .split('');

        const newValues = Array(length).fill('');

        pasted.forEach((char, index) => {
            newValues[index] = char;
        });

        setValues(newValues);

        const nextIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[nextIndex]?.focus();

        if (pasted.length === length) {
            onComplete?.(newValues.join(''));
        }
    };
    return (
        <div className="flex gap-2">
            {values.map((value, index) => (
                <div key={index} className="group relative h-20 w-12">
                    {/* Black focus background */}
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[#0A0C0F] opacity-0 [clip-path:polygon(15%_0%,100%_0%,90%_100%,0%_100%)] group-focus-within:opacity-100" />

                    {/* Green success flash background */}
                    <div
                        ref={(el) => {
                            inputBgRefs.current[index] = el;
                        }}
                        className="pointer-events-none absolute inset-0 z-[1] bg-green-500 opacity-0 [clip-path:polygon(15%_0%,100%_0%,90%_100%,0%_100%)]"
                    />

                    <input
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        value={value}
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        className="relative z-10 h-full w-full appearance-none border-0 bg-transparent text-center font-arsenal text-3xl font-bold text-white outline-none"
                    />

                    <InputBorderBottom className="pointer-events-none absolute bottom-1 left-1.5 z-20 w-[70%]" />
                </div>
            ))}
        </div>
    );
}

export default function JoinRoomPage({ onPeek, onJoin }: Props) {
    const [uniqueCode, setUniqueCode] = useState('');
    const [teams, setTeams] = useState<SessionInfo['teams'] | null>(null);
    const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(3);
    const [isChecking, setIsChecking] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [joined, setJoined] = useState(false);
    const [nickname, setNickname] = useState('');
    const [nicknameError, setNicknameError] = useState('');
    const [pendingTeam, setPendingTeam] = useState<
        SessionInfo['teams'][number] | null
    >(null);
    const [selectedTeam, setSelectedTeam] = useState<
        SessionInfo['teams'][number] | null
    >(null);

    const formRef = useRef<HTMLDivElement | null>(null);
    const inputBgRefs = useRef<Array<HTMLDivElement | null>>([]);
    const streakRef = useRef<HTMLDivElement | null>(null);
    const titleRef = useRef<HTMLDivElement | null>(null);
    const codeInputWrapRef = useRef<HTMLDivElement | null>(null);
    const introLightingRef = useRef<HTMLDivElement | null>(null);
    const introChatCodie1Ref = useRef<HTMLDivElement>(null);
    const introChatCodie2Ref = useRef<HTMLDivElement>(null);
    const teamChatRef = useRef<HTMLDivElement>(null);
    const teamOptionsRef = useRef<HTMLDivElement | null>(null);
    const nicknameChatRef = useRef<HTMLDivElement>(null);
    const nicknameGroupRef = useRef<HTMLDivElement | null>(null);
    // Guards the nickname section's slide-in so it only plays once, the
    // first time a team gets picked - not every time selection changes.
    const nicknameRevealedRef = useRef(false);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            if (
                !streakRef.current ||
                !titleRef.current ||
                !introLightingRef.current ||
                !codeInputWrapRef.current ||
                !introChatCodie1Ref.current
            )
                return;
            // Clips left-to-right, matching the codebase's usual streak
            // reveal (e.g. StorylinePage's bgRef). titleRef gets the same
            // fly-in/overshoot/settle pop used for storylineRef elsewhere,
            // overlapping the streak reveal instead of waitiMegeckeng for it.
            gsap.set(streakRef.current, { clipPath: 'inset(0 100% 0 0)' });
            gsap.set(titleRef.current, {
                xPercent: -90,
                rotation: -4,
                scale: 0.95,
                autoAlpha: 0,
            });
            gsap.set(introLightingRef.current, {
                clipPath: 'inset(0% 0 100% 0)',
            });
            gsap.set(codeInputWrapRef.current, { autoAlpha: 0, y: 20 });
            gsap.set([introChatCodie1Ref.current], {
                xPercent: -30,
                autoAlpha: 0,
            });

            const tl = gsap.timeline();

            tl.to(introLightingRef.current, {
                clipPath: 'inset(0% 0% 0% 0)',
                duration: 1,
            })
                .to(
                    [introChatCodie1Ref.current],
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.5,
                        ease: 'back.out(1.2)',
                        stagger: 0.12,
                    },
                    '<0.3',
                )
                .to(
                    streakRef.current,
                    {
                        clipPath: 'inset(0 0% 0 0)',
                        duration: 0.7,
                        ease: 'power3.inOut',
                    },
                    '=<0.8',
                )
                .to(
                    titleRef.current,
                    {
                        xPercent: 8,
                        rotation: 2,
                        scale: 1.03,
                        autoAlpha: 1,
                        duration: 0.55,
                        ease: 'power3.out',
                    },
                    '<0.8',
                )
                .to(titleRef.current, {
                    xPercent: -2,
                    rotation: -1,
                    scale: 0.99,
                    duration: 0.15,
                    ease: 'power2.inOut',
                })
                .to(titleRef.current, {
                    xPercent: 0,
                    rotation: 0,
                    scale: 1,
                    duration: 0.12,
                    ease: 'power2.out',
                })
                .to(codeInputWrapRef.current, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'power3.out',
                });
        }, formRef);

        return () => ctx.revert();
    }, []);

    useLayoutEffect(() => {
        if (!teams) return;

        // Reset every run - this screen only ever mounts once per join
        // attempt, but StrictMode double-invokes effects in dev.
        nicknameRevealedRef.current = false;

        const ctx = gsap.context(() => {
            if (
                !introLightingRef.current ||
                !teamChatRef.current ||
                !teamOptionsRef.current ||
                !nicknameChatRef.current ||
                !nicknameGroupRef.current
            )
                return;

            gsap.set(introLightingRef.current, {
                clipPath: 'inset(0% 0 100% 0)',
            });
            gsap.set([teamChatRef.current, nicknameChatRef.current], {
                xPercent: -30,
                autoAlpha: 0,
            });
            gsap.set(teamOptionsRef.current, { xPercent: -20, autoAlpha: 0 });
            // Nickname section starts hidden and slides in later, once a
            // team has actually been picked - see the effect below.
            gsap.set(nicknameGroupRef.current, { xPercent: -30, autoAlpha: 0 });

            const tl = gsap.timeline();

            tl.to(introLightingRef.current, {
                clipPath: 'inset(0% 0% 0% 0)',
                duration: 1,
            })
                .to(
                    teamChatRef.current,
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.5,
                        ease: 'back.out(1.2)',
                    },
                    '<0.3',
                )
                .to(
                    teamOptionsRef.current,
                    {
                        xPercent: 0,
                        autoAlpha: 1,
                        duration: 0.5,
                        ease: 'power3.out',
                    },
                    '<0.25',
                );
        });

        return () => ctx.revert();
    }, [teams]);

    // Nickname prompt + input slide in from the left the first time a team
    // gets picked, staying hidden (and non-interactive, via autoAlpha) until
    // then.
    useEffect(() => {
        if (!selectedTeam || nicknameRevealedRef.current) return;
        if (!nicknameChatRef.current || !nicknameGroupRef.current) return;

        nicknameRevealedRef.current = true;

        gsap.timeline()
            .to(nicknameChatRef.current, {
                xPercent: 0,
                autoAlpha: 1,
                duration: 0.5,
                ease: 'back.out(1.2)',
            })
            .to(
                nicknameGroupRef.current,
                {
                    xPercent: 0,
                    autoAlpha: 1,
                    duration: 0.5,
                    ease: 'power3.out',
                },
                '<0.2',
            );
    }, [selectedTeam]);

    const shakeForm = () => {
        if (!formRef.current) return;

        gsap.fromTo(
            formRef.current,
            { x: 0 },
            {
                x: 14,
                duration: 0.06,
                repeat: 5,
                yoyo: true,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set(formRef.current, { x: 0 });
                },
            },
        );
    };

    const handleCodeComplete = async (value: string) => {
        setUniqueCode(value);
        setError('');
        setIsChecking(true);

        try {
            const info = await onPeek(value);
            setTeams(info.teams);
            setMaxPlayersPerTeam(info.max_players_per_team);
        } catch {
            setError('Kode tidak ditemukan.');
            shakeForm();
        } finally {
            setIsChecking(false);
        }
    };

    const handleSelectTeam = (team: SessionInfo['teams'][number]) => {
        setSelectedTeam(team);
    };

    const handleJoinClick = () => {
        if (!selectedTeam) return;

        if (!nickname.trim()) {
            setNicknameError('Masukkan nama panggilanmu dulu ya.');
            return;
        }

        setNicknameError('');
        setPendingTeam(selectedTeam);
    };

    const confirmJoin = async () => {
        if (!pendingTeam) return;

        setIsJoining(true);

        try {
            setError('');
            await onJoin(uniqueCode, pendingTeam.id, nickname.trim());
            setPendingTeam(null);
            setJoined(true);
        } catch (err) {
            setPendingTeam(null);
            setError((err as Error).message || 'Failed to join.');
        } finally {
            setIsJoining(false);
        }
    };

    if (joined) {
        return (
            <main className="flex min-h-screen items-center justify-center text-white">
                <div className="absolute z-0 h-screen w-screen bg-[#0A0C0F] opacity-70" />
                <p className="z-50 font-arsenal text-xl font-semibold">
                    Kamu sudah masuk! Tunggu variants yang lain ya!
                </p>
            </main>
        );
    }

    if (teams) {
        return (
            <main className="relative flex min-h-screen items-center justify-start overflow-hidden text-white">
                <div className="absolute h-screen w-screen bg-[#0A0C0F] opacity-40" />

                <div ref={introLightingRef} className="absolute w-[29rem]">
                    <LightingStrike className="block h-auto w-full" />
                </div>
                <div className="relative z-10 mt-12 flex h-screen w-full animate-fade-in flex-col items-center px-6">
                    <ChatCodieBubble
                        ref={teamChatRef}
                        className="ml-4"
                        textClassName="top-12  h-[4rem] text-lg"
                        text={
                            selectedTeam
                                ? `Pilih kelompokmu! Pilihanmu : ${selectedTeam.name.toUpperCase()}`
                                : 'Pilih kelompokmu!'
                        }
                    />
                    <div
                        ref={teamOptionsRef}
                        className="mb-3 mt-2 flex w-full max-w-md flex-col gap-2"
                    >
                        {teams.map((team) => {
                            const isFull =
                                team.players.length >= maxPlayersPerTeam;
                            const isSelected = selectedTeam?.id === team.id;
                            const isDimmed =
                                selectedTeam !== null && !isSelected;

                            return (
                                <button
                                    key={team.id}
                                    onClick={() => handleSelectTeam(team)}
                                    disabled={isFull || isJoining}
                                    className={`relative flex w-full items-center text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                                        isSelected
                                            ? 'scale-102 rotate-3 opacity-100'
                                            : isDimmed
                                              ? 'scale-95 opacity-40'
                                              : 'scale-100 opacity-100'
                                    }`}
                                >
                                    <img
                                        src={SelectionGroupBG}
                                        alt=""
                                        className={`relative block h-auto w-full ${team.id % 2 === 0 ? '-scale-x-100' : ''}`}
                                    />

                                    <div className="absolute inset-0 flex items-center justify-between px-10">
                                        <div className="mt-2 flex flex-col items-start justify-center">
                                            {team.number !== null && (
                                                <span className="text-md font-arsenal font-bold leading-tight">
                                                    Kelompok {team.number}
                                                </span>
                                            )}
                                            <span className="font-arsenal text-4xl font-bold uppercase leading-tight">
                                                {team.name}
                                            </span>
                                        </div>

                                        <span className="font-noto text-6xl font-bold text-[#5B5B5B]">
                                            {isFull
                                                ? 'Penuh'
                                                : `${team.players.length}/${maxPlayersPerTeam}`}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <ChatCodieBubble
                        ref={nicknameChatRef}
                        className="-ml-5"
                        textClassName="top-12 h-[4rem] text-lg"
                        text="Input namamu! Pastikan yang beradab ya :)"
                    />

                    <div
                        ref={nicknameGroupRef}
                        className="flex flex-col items-center"
                    >
                        <Input
                            type="text"
                            value={nickname}
                            onChange={(e) => {
                                setNickname(e.target.value);
                                setNicknameError('');
                            }}
                            maxLength={30}
                            placeholder="Input Nickname Anda"
                            wrapperClassName="mt-3"
                        />
                        <Button Icon={JoinSVG} onClick={handleJoinClick} />
                    </div>
                    {nicknameError && (
                        <p className="mt-2 font-arsenal text-sm font-semibold text-red-400">
                            {nicknameError}
                        </p>
                    )}

                    {error && (
                        <p className="relative mt-6 font-arsenal text-sm font-semibold text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                {pendingTeam && (
                    <ConfirmPopup
                        message={
                            <>
                                Apakah anda yakin untuk ikut {pendingTeam.name}{' '}
                                sebagai {nickname.trim()}?
                            </>
                        }
                        onCancel={() => setPendingTeam(null)}
                        onConfirm={confirmJoin}
                        confirmDisabled={isJoining}
                        cancelDisabled={isJoining}
                        boxClassName="w-[21rem] max-w-[90vw]"
                        holdupClassName="left-4 top-0 w-[65%]"
                        popupBoxClassName="mt-12 block h-auto w-full"
                        contentClassName="top-28 w-full items-center gap-6 px-6"
                        messageClassName="text-xl"
                        buttonsClassName="gap-10"
                        buttonClassName="text-2xl"
                    />
                )}
            </main>
        );
    }

    return (
        <main className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden text-white">
            <div className="absolute z-0 h-screen w-screen bg-[#0A0C0F] opacity-40" />

            <div ref={introLightingRef} className="absolute w-[29rem]">
                <LightingStrike className="block h-auto w-full" />
            </div>
            <div
                ref={formRef}
                className="relative z-10 flex h-screen w-full flex-col items-center justify-start"
            >
                <ChatCodieBubble
                    ref={introChatCodie1Ref}
                    className="mt-12"
                    textClassName="top-12 h-[4rem] text-md"
                    text="Halo variants! Ayo kita selamatkan puppet universe!"
                />

                <div ref={titleRef} className="mt-[2vh]">
                    <InputYourCode className="w-[20em] rotate-[-8deg]" />
                </div>

                <div className="relative mt-10 flex h-[3rem] w-full flex-col items-center justify-start">
                    <div
                        ref={streakRef}
                        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2"
                    >
                        <StreakBG className="block h-auto w-full object-cover" />
                    </div>
                    <div ref={codeInputWrapRef} className="relative -rotate-6">
                        <CodeInput
                            length={6}
                            inputBgRefs={inputBgRefs}
                            onComplete={handleCodeComplete}
                        />
                    </div>

                    {error && (
                        <p className="relative mt-8 font-arsenal text-sm font-semibold text-red-400">
                            {error}
                        </p>
                    )}
                    {isChecking && (
                        <p className="relative mt-8 font-arsenal text-sm text-[#F0F2F5]">
                            Mengecek kode...
                        </p>
                    )}
                </div>
            </div>

            {isDev && (
                <button
                    type="button"
                    onClick={() => {
                        setUniqueCode('000000');
                        setTeams(MOCK_TEAMS);
                        setMaxPlayersPerTeam(3);
                    }}
                    className="fixed bottom-32 left-1/2 z-[999] -translate-x-1/2 rounded-full bg-black/80 px-3 py-2 font-mono text-xs text-white shadow-lg"
                >
                    Dev: skip to team select
                </button>
            )}
        </main>
    );
}
