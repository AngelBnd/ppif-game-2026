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
import { useEffect, useMemo, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

// Padding past the rightmost panel so the last image isn't flush against
// the end of the scroll track.
const TRACK_END_PADDING_PX = 100;

// Trigger `left`/`top` percentages (see storylineConfig) are computed
// against this track width, so it has to match the actual panel content -
// a fixed width either clips later panels short or leaves the camera
// scrolling past empty space once they don't line up with panel count.
function trackWidthFor(panels: StorylinePanel[]): number {
    if (panels.length === 0) return TRACK_END_PADDING_PX;

    const rightEdge = Math.max(
        ...panels.map((p) => parseFloat(p.left) + parseFloat(p.width)),
    );

    return rightEdge + TRACK_END_PADDING_PX;
}

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
    const panelImgRefs = useRef<(HTMLImageElement | null)[]>([]);
    panelImgRefs.current = panelImgRefs.current.slice(0, panels.length);

    const refs = useRef({
        scroller: scrollRef,
        panel: panelRef,
        camera: cameraRef,
        world: worldRef,
        clip: clipRef,
        marks: markRefs,
    }).current;

    const trackWidth = useMemo(() => trackWidthFor(panels), [panels]);

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

    useEffect(() => {
        const scroller = scrollRef.current;
        const elements = panelImgRefs.current.filter(
            (el): el is HTMLImageElement => el !== null,
        );
        if (!scroller || elements.length !== panels.length) return;

        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (reduce) {
            gsap.set(elements, { opacity: 1, scale: 1, y: 0 });
            return;
        }

        gsap.set(elements, { scale: 0.55, y: 30, transformOrigin: '50% 50%' });

        const popIn = (el: HTMLImageElement) =>
            gsap.to(el, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.5,
                ease: 'back.out(1.3)',
            });

        // Driven directly off scrollLeft instead of ScrollTrigger - simpler
        // to reason about here, and sidesteps ScrollTrigger's own
        // trigger/end defaulting when created without a `trigger` element.
        // Thresholds come from the panel config (left/width), not
        // getBoundingClientRect - the camera hook rewrites this element's
        // ancestor transform every frame, so a measured rect wouldn't
        // reflect where the panel actually sits once the user scrolls.
        const revealed = elements.map(() => false);

        const computeStarts = () => {
            const viewW = scroller.clientWidth;
            const maxScroll = Math.max(0, scroller.scrollWidth - viewW);

            return panels.map((p) => {
                const center = parseFloat(p.left) + parseFloat(p.width) / 2;

                // A panel near the end of the track can sit close enough to
                // the right edge that centering it would need more scroll
                // than the track actually has - clamp to the furthest the
                // user can actually reach, so it still pops in (right when
                // the user hits the end of the scroll) instead of never
                // crossing its threshold.
                return Math.min(center - viewW / 2, maxScroll);
            });
        };

        let starts = computeStarts();

        const checkReveal = () => {
            const pos = scroller.scrollLeft;
            starts.forEach((start, i) => {
                if (!revealed[i] && pos >= start) {
                    revealed[i] = true;
                    popIn(elements[i]);
                }
            });
        };

        checkReveal();
        scroller.addEventListener('scroll', checkReveal, { passive: true });

        const onResize = () => {
            starts = computeStarts();
            checkReveal();
        };
        window.addEventListener('resize', onResize);

        return () => {
            scroller.removeEventListener('scroll', checkReveal);
            window.removeEventListener('resize', onResize);
            gsap.killTweensOf(elements);
        };
    }, [panels]);

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
                        width: `${trackWidth}px`,
                        height: '856px',
                        minWidth: `${trackWidth}px`,
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
                            className="absolute z-50 h-5 w-5"
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
                                    ref={(el) => {
                                        panelImgRefs.current[i] = el;
                                    }}
                                    src={p.src}
                                    alt=""
                                    draggable={false}
                                    data-beat={p.beat}
                                    style={{
                                        left: p.left,
                                        top: p.top,
                                        width: p.width,
                                        opacity: 0,
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
