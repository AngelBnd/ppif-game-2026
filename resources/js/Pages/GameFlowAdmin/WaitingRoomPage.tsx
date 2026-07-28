import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { SessionInfo } from '@/types/gameSession';
import type { Step } from '@/types/step';
import { useEffect, useState } from 'react';

type Props = {
    step: Step;
    session: SessionInfo | null;
    goNext: () => void;
};

export default function WaitingRoompage({ session, goNext }: Props) {
    const pin = session?.code ?? '';
    const { user, isLoading: isAuthLoading, login, logout } = useAdminAuth();
    const maxPlayers = session?.max_players_per_team ?? 3;
    const leftTeam = session?.teams[0];
    const rightTeam = session?.teams[1];
    const leftCount = leftTeam?.players.length ?? 0;
    const rightCount = rightTeam?.players.length ?? 0;
    // Flag art only has 3 states (0/1/2) - reuse it as "how many sides have
    // at least one player in" rather than a literal head count.
    const flagIndex = Math.min(
        (leftCount >= 1 ? 1 : 0) + (rightCount >= 1 ? 1 : 0),
        2,
    );
    const [pressState, setPressState] = useState<'idle' | 'hover' | 'press'>(
        'idle',
    );
    const [isPortrait, setIsPortrait] = useState(() => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(orientation: portrait)').matches ||
            window.innerHeight >= window.innerWidth
        );
    });

    function triggerStart() {
        if (!session) return;

        setPressState('hover');
        setTimeout(() => setPressState('press'), 120);
        setTimeout(() => {
            goNext();
            setPressState('idle');
        }, 260);
    }

    const pinSlots = Array.from({ length: 6 }, (_, i) => pin[i] ?? 'X');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(orientation: portrait)');
        const updateOrientation = () => {
            setIsPortrait(
                mediaQuery.matches || window.innerHeight >= window.innerWidth,
            );
        };

        updateOrientation();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', updateOrientation);
        } else {
            // Jaga2 untuk browser lama yang tidak mendukung addEventListener pada MediaQueryList
            mediaQuery.addListener(updateOrientation);
        }

        window.addEventListener('resize', updateOrientation);

        return () => {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', updateOrientation);
            } else {
                // jaga2 untuk browser lama yang tidak mendukung removeEventListener pada MediaQueryList
                mediaQuery.removeListener(updateOrientation);
            }
            window.removeEventListener('resize', updateOrientation);
        };
    }, []);

    if (isPortrait) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-fill"
                >
                    <source
                        src="/starting-page/rotate-device.mp4"
                        type="video/mp4"
                    />
                </video>
            </div>
        );
    }

    return (
        <div className="bg-surface-gradient relative z-0 min-h-screen w-full overflow-hidden">
            <button
                className="fixed bottom-4 left-4 z-50 h-8 w-[4rem] font-arsenal underline"
                onClick={logout}
            >
                Log out
            </button>

            {/*  BACKGROUND LAYER */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 select-none"
            >
                <div className="z-0 h-screen w-screen" />

                {/* 1. vector — paling belakang */}
                <div className="z-1 absolute inset-0 bg-[url('/starting-page/vector-99.svg')] bg-[length:auto_100%] bg-right bg-no-repeat" />

                {/* 2. star */}
                <img
                    src="/starting-page/star.svg"
                    alt=""
                    className="absolute right-0 top-0 z-[2] h-full w-auto"
                />

                {/* 3. flag*/}
                <img
                    src={`/starting-page/${flagIndex}-2hasjoined.svg`}
                    alt=""
                    className="absolute left-[30%] top-[-2.1%] z-[4] h-auto w-[75%]"
                />

                {/* 4. vignette*/}
                <div className="absolute inset-0 z-[5] bg-gradient-to-r from-black/60 via-black/10 to-transparent" />

                {/*  5. BOARD STATUS LEFT */}
                {leftCount >= 1 ? (
                    /* SIGNED: bungkus dalem relative biar nama-tim nempel ke board */
                    <div className="absolute right-[16%] top-[3%] z-[9] w-[20%]">
                        <div className="animate-persona-in relative w-full">
                            <img
                                src="/starting-page/BOARD-STATUS-LEFT(SIGNED).svg"
                                alt=""
                                className="block h-auto w-full"
                            />

                            <p className="absolute left-1/2 top-[9%] z-20 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 font-arsenal text-[1.4vw] font-bold text-white">
                                {leftCount}/{maxPlayers}
                            </p>

                            {/* stack of banner slots - one per player, fills in as they join */}
                            <div className="absolute bottom-[6%] left-[24%] flex w-[56%] flex-col gap-[0.4vw]">
                                {Array.from({ length: maxPlayers }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`relative w-full transition-opacity duration-300 ${
                                            i < leftCount
                                                ? 'opacity-100'
                                                : 'opacity-20'
                                        }`}
                                    >
                                        <img
                                            src="/starting-page/nama-tim.svg"
                                            alt=""
                                            className="h-auto w-full"
                                        />
                                        <span className="absolute left-[12%] top-[20%] w-[9vw] -rotate-[9deg] truncate font-arsenal text-[0.9vw] font-bold leading-none text-white">
                                            {leftTeam?.name ?? ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <img
                        src="/starting-page/BOARD-STATUS-LEFT-TILT-(UNSIGNED).svg"
                        alt=""
                        className="absolute right-[16%] top-[8%] z-[9] h-auto w-[20%]"
                    />
                )}

                {/*  6. BOARD STATUS RIGHT  */}
                {rightCount >= 1 ? (
                    /* SIGNED: bungkus dalem relative biar nama-tim-kanan nempel ke board */
                    <div className="absolute right-[2%] top-[8%] z-[8] w-[25%]">
                        <div className="animate-persona-in relative w-full">
                            <img
                                src="/starting-page/BOARD-STATUS-RIGHT(SIGNED).png"
                                alt=""
                                className="block h-auto w-full"
                            />

                            <p className="absolute left-1/2 top-[2%] z-20 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 font-arsenal text-[1.4vw] font-bold text-white">
                                {rightCount}/{maxPlayers}
                            </p>

                            {/* stack of banner slots - one per player, fills in as they join */}
                            <div className="absolute bottom-[10%] left-[26%] flex w-[46%] flex-col gap-[0.4vw]">
                                {Array.from({ length: maxPlayers }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`relative w-full transition-opacity duration-300 ${
                                            i < rightCount
                                                ? 'opacity-100'
                                                : 'opacity-20'
                                        }`}
                                    >
                                        <img
                                            src="/starting-page/nama-tim-kanan.svg"
                                            alt=""
                                            className="h-auto w-full"
                                        />
                                        <span className="absolute left-[12%] top-[15%] w-[9vw] rotate-[4deg] truncate font-arsenal text-[0.9vw] font-bold leading-none text-white">
                                            {rightTeam?.name ?? ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* UNSIGNED */
                    <img
                        src="/starting-page/BOARD-STATUS-RIGHT-(UNSIGNED).svg"
                        alt=""
                        className="absolute right-[3%] top-[10%] z-[8] h-auto w-[22%]"
                    />
                )}
            </div>

            {/*  CONTENT LAYER (di atas background) */}
            <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-white">
                <div className="absolute left-[25%] top-[40%] flex w-[20%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[0.1vw]">
                    <img
                        src="/starting-page/PIN.svg"
                        alt="PIN"
                        className="h-[5vw] w-[20%]"
                    />
                    <label className="group relative cursor-pointer">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            value={pin}
                            readOnly
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    triggerStart();
                                }
                            }}
                            maxLength={6}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div className="flex select-none items-center justify-center gap-x-[0.1vw] font-noto text-[5vw] font-bold">
                            {pinSlots.map((ch, i) => (
                                <span
                                    key={i}
                                    className={`${i === 3 ? 'ml-3' : ''} ${
                                        ch === 'X'
                                            ? 'text-white transition-colors group-hover:text-white/70'
                                            : 'text-white'
                                    }`}
                                >
                                    {ch}
                                </span>
                            ))}
                        </div>
                    </label>
                </div>

                <button
                    type="button"
                    onClick={triggerStart}
                    disabled={!session}
                    className={`absolute bottom-[30%] left-[25%] w-[20%] -translate-x-1/2 rotate-[2deg] cursor-pointer transition-transform duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                        pressState === 'hover'
                            ? 'scale-105'
                            : pressState === 'press'
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

                <img
                    src="/starting-page/INPUT_UNIQUE_CODE.svg"
                    alt=""
                    className="absolute bottom-[12%] left-1/2 h-auto w-[60%] -translate-x-1/2"
                />
            </div>
        </div>
    );
}
