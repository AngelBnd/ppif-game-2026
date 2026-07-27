import InputBorderBottom from '@/assets/phone/InputBorderBottomSVG.svg?react';
import InputYourCode from '@/assets/phone/inputurcode.svg?react';
import StreakBG from '@/assets/phone/STREAKBG.svg?react';
import gsap from 'gsap';
import { useRef, useState } from 'react';
import type { Step } from '@/types/step';
import type { SessionInfo } from '@/types/gameSession';

type Props = {
    step: Step;
    onPeek: (code: string) => Promise<SessionInfo>;
    onJoin: (code: string, teamId: number) => Promise<unknown>;
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
        const inputValue = e.target.value;
        const char = inputValue.slice(-1).toUpperCase();

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
            .slice(0, length)
            .toUpperCase()
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

    const formRef = useRef<HTMLDivElement | null>(null);
    const inputBgRefs = useRef<Array<HTMLDivElement | null>>([]);

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
            setError('Invalid unique code.');
            shakeForm();
        } finally {
            setIsChecking(false);
        }
    };

    const handleChooseTeam = async (teamId: number) => {
        setIsJoining(true);

        try {
            setError('');
            await onJoin(uniqueCode, teamId);

            const inputBgs = inputBgRefs.current.filter(Boolean);

            gsap.fromTo(
                inputBgs,
                {
                    backgroundColor: '#12C898',
                    opacity: 0,
                },
                {
                    backgroundColor: '#12C898',
                    opacity: 1,
                    duration: 0.18,
                    repeat: 2,
                    yoyo: true,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setJoined(true);
                    },
                },
            );
        } catch (err) {
            setError((err as Error).message || 'Failed to join.');
            shakeForm();
        } finally {
            setIsJoining(false);
        }
    };

    if (joined) {
        return (
            <main className="flex min-h-screen items-center justify-center text-white">
                <p className="text-xl font-semibold">
                    You're in! Waiting for the admin to start...
                </p>
            </main>
        );
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden text-white">
            <div
                ref={formRef}
                className="relative z-10 flex h-screen w-full flex-col items-center"
            >
                <div className="mt-[14vh]">
                    <InputYourCode className="w-[20em] rotate-[-8deg]" />
                </div>

                <div className="relative mt-10 h-[2rem] w-[29rem]">
                    <StreakBG className="absolute left-1/2 top-1/2 w-[40rem] -translate-x-1/2 -translate-y-1/2 object-cover" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 -rotate-12">
                        <CodeInput
                            length={6}
                            inputBgRefs={inputBgRefs}
                            onComplete={handleCodeComplete}
                        />
                    </div>
                </div>

                {error && (
                    <p className="mt-4 text-sm font-semibold text-red-400">
                        {error}
                    </p>
                )}

                {isChecking && (
                    <p className="mt-6 text-sm text-white/60">Mengecek kode...</p>
                )}

                {teams && (
                    <div className="mt-10 flex w-64 flex-col gap-3">
                        {teams.map((team) => {
                            const isFull = team.players.length >= maxPlayersPerTeam;

                            return (
                                <button
                                    key={team.id}
                                    onClick={() => handleChooseTeam(team.id)}
                                    disabled={isFull || isJoining}
                                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-black transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className="font-semibold">{team.name}</span>
                                    <span className="text-sm text-black/60">
                                        {isFull
                                            ? 'Penuh'
                                            : `${team.players.length}/${maxPlayersPerTeam}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
