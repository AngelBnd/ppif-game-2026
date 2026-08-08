import { CAMERA_PATHS } from '@/Components/about/cameraPath';
import {
    DEFAULT_STORYLINE_TRIGGERS,
    type StorylinePanel,
} from '@/Components/about/storylineConfig';
import {
    CameraConfig,
    useDivisionCamera,
    type DivisionTrigger,
} from '@/Components/about/useDivisionCamera';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

type Props = {
    panels: StorylinePanel[];
    triggers?: DivisionTrigger[];
    /** "I'm Ready" button only renders when this is provided. */
    onReady?: () => void;
};

export default function GameHubStoryline({
    panels,
    triggers = DEFAULT_STORYLINE_TRIGGERS,
    onReady,
}: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef<HTMLDivElement>(null);
    const clipRef = useRef<HTMLDivElement>(null);
    const markRefs = useRef<(HTMLDivElement | null)[]>([]);

    const refs = useRef({
        scroller: scrollRef,
        panel: panelRef,
        camera: cameraRef,
        world: worldRef,
        clip: clipRef,
        marks: markRefs,
    }).current;

    const CAMERA_CONFIG: Partial<CameraConfig> = {
        perspective: 900,
        markers: true,
        paths: {
            lift: {
                d: 'M0,183.62 C0,183.62 451.83,183.62 808.52,183.62 C1165.2,183.62 1374.43,2.09 1735.62,7.59 C2096.82,13.09 2409.76,173.59 2729.48,138.59 C3049.18,103.59 3400,274.09 3400,274.09',
                zero: 'mean',
                gain: 0.23,
            },
            scale: { d: CAMERA_PATHS.scale, gain: 0.03 },
            sway: { d: CAMERA_PATHS.sway, zero: 'mean', gain: 0 },
        },
        bankGain: 0.0009,
        bankSlopeGain: 0.008,
        dollyGain: 0,
        dollyMax: 0,
    };

    useDivisionCamera({
        enabled: true,
        triggers,
        refs,
        config: CAMERA_CONFIG,
    });

    return (
        <div className="absolute inset-0 overflow-hidden text-white">
            <div
                ref={scrollRef}
                className="absolute inset-0 z-20 h-screen overflow-x-auto overflow-y-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div
                    ref={panelRef}
                    className="relative"
                    style={{
                        width: '3400px',
                        height: '856px',
                        minWidth: '3400px',
                        minHeight: '856px',
                    }}
                >
                    {triggers.map((trg, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                markRefs.current[i] = el;
                            }}
                            style={{
                                left: `${trg.left}%`,
                                top: `${trg.top}%`,
                            }}
                            className="absolute z-50 h-5 w-5 bg-green-500"
                        />
                    ))}

                    <div
                        ref={cameraRef}
                        className="relative h-[690px] w-[4400px]"
                        style={{ perspective: '900px' }}
                    >
                        <div
                            ref={worldRef}
                            className="absolute inset-0 h-full w-full"
                            style={{
                                transformStyle: 'preserve-3d',
                                willChange: 'transform',
                            }}
                        >
                            {/* <div
                                ref={clipRef}
                                className="h-full [clip-path:inset(0_80%_0_0)]"
                            >
                                <DivisionStreak className="relative z-20 h-full w-auto max-w-none drop-shadow-[0px_8px_0px_#0A0C0F]" />
                            </div> */}

                            {/* Storyline panels */}
                            {panels.map((p, i) => (
                                <img
                                    key={`panel-${i}`}
                                    src={p.src}
                                    alt=""
                                    draggable={false}
                                    data-beat={p.beat}
                                    style={{
                                        left: p.left,
                                        top: p.top,
                                        width: p.width,
                                    }}
                                    className="pointer-events-none absolute z-30 h-auto select-none"
                                />
                            ))}
                        </div>
                        {/* 
                        {onReady && (
                            <button
                                onClick={onReady}
                                className="absolute bottom-6 right-4 z-30 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-black transition hover:scale-105 active:scale-95"
                            >
                                I'm Ready
                            </button>
                        )} */}
                    </div>
                </div>
            </div>
        </div>
    );
}
