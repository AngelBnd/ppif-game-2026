import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

import {
    CAMERA_PATHS,
    createCameraPaths,
    type CameraPaths,
    type CameraSampler,
} from './cameraPath';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** Loose ref shape so this works across React versions. */
type ElRef = { current: HTMLElement | null };
type ElListRef = { current: (HTMLElement | null)[] };

export type DivisionTrigger = {
    left: number;
    top: number;
    inset: number;
};

/** Passed to `initBeats` once, before any beat is built. */
export type CameraSetupContext = {
    /** Carries the clip-path. */
    clip: HTMLElement;
    /** The transformed node (position/scale). */
    world: HTMLElement;
    triggers: DivisionTrigger[];
    cfg: CameraConfig;
};

/** Passed to `buildBeat` once per trigger. */
export type CameraBeatContext = {
    clip: HTMLElement;
    world: HTMLElement;
    /** This beat's trigger spec. */
    trigger: DivisionTrigger;
    /** Beat index, 0-based. */
    index: number;
    /** Total number of beats. */
    total: number;
    cfg: CameraConfig;
};

/** Sets the resting state before any beat plays. */
export type InitBeats = (ctx: CameraSetupContext) => void;

/**
 * Appends one beat's tween(s) onto `tl`. The hook has ALREADY placed the
 * `s{index}` label at the current playhead — append forward-moving tweens only.
 * Do not add labels, seek, or use negative position offsets that reach back
 * across the previous label, or the segment ratchet will misalign.
 */
export type BuildBeat = (
    tl: gsap.core.Timeline,
    ctx: CameraBeatContext,
) => void;

export type CameraConfig = {
    perspective: number;
    paths: CameraPaths;
    springHz: number;
    wheelGain: number;
    throwGain: number;
    dollyGain: number;
    dollyMax: number;
    bankGain: number;
    bankSlopeGain: number;
    bankMax: number;
    restInset: number;
    segmentDuration: number;
    triggerAt: number;
    markers: boolean;
    /** Resting state builder. Defaults to clipping to `restInset`. */
    initBeats: InitBeats;
    /** Per-beat tween builder. Defaults to a clip-path reveal to `trigger.inset`. */
    buildBeat: BuildBeat;
};

const DEFAULTS: CameraConfig = {
    perspective: 900,
    paths: CAMERA_PATHS,
    springHz: 1.15,
    wheelGain: 1.6,
    throwGain: 9,
    dollyGain: 0.08,
    dollyMax: 160,
    bankGain: 0.004,
    bankSlopeGain: 0.006,
    bankMax: 5,
    restInset: 80,
    segmentDuration: 0.6,
    triggerAt: 0.6,
    markers: false,
    initBeats: ({ clip, cfg }) => {
        gsap.set(clip, { clipPath: `inset(0% ${cfg.restInset}% 0% 0%)` });
    },
    buildBeat: (tl, { clip, trigger, cfg }) => {
        tl.to(clip, {
            clipPath: `inset(0% ${trigger.inset}% 0% 0%)`,
            duration: cfg.segmentDuration,
            ease: 'power3.out',
        });
    },
};

export type DivisionCameraRefs = {
    scroller: ElRef;
    panel?: ElRef;
    camera: ElRef;
    world: ElRef;
    clip?: ElRef;
    marks?: ElListRef;
};

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

export function useDivisionCamera({
    enabled,
    triggers,
    refs,
    config,
}: {
    enabled: boolean;
    /** MUST be referentially stable — module constant or useMemo. */
    triggers: DivisionTrigger[];
    refs: DivisionCameraRefs;
    config?: Partial<CameraConfig>;
}) {
    useEffect(() => {
        if (!enabled) return;

        const scroller = refs.scroller.current;
        const camera = refs.camera.current;
        const world = refs.world.current;
        if (!scroller || !camera || !world) return;

        const clip = refs.clip?.current ?? null;
        const marks = (refs.marks?.current ?? []).filter(
            Boolean,
        ) as HTMLElement[];
        if (clip && marks.length !== triggers.length) {
            console.warn(
                `[camera] ${marks.length} marker nodes for ${triggers.length} triggers — beats will misalign.`,
            );
        }

        const cfg = { ...DEFAULTS, ...config };
        const P = cfg.perspective;
        const N = triggers.length;

        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const isTouch = window.matchMedia('(hover: none)').matches;
        const ownsScroll = !isTouch && !reduce;

        /* Baked once. No dependency on layout or viewport. */
        const camSample: CameraSampler = createCameraPaths(cfg.paths);

        /* -------------------------------------------------------------- *
         * Cached measurements
         *
         * Reading clientWidth / scrollWidth inside the ticker forces a
         * synchronous reflow every frame, made worse by the fact that we
         * also WRITE scrollLeft. Measure on mount and on resize only.
         * -------------------------------------------------------------- */

        let camLeft = 0;
        let viewW = scroller.clientWidth;
        let scrollSpan = 1;
        let panelW = 1;

        const contentLeft = (el: HTMLElement) =>
            el.getBoundingClientRect().left -
            (scroller.getBoundingClientRect().left - scroller.scrollLeft);

        const measure = () => {
            camLeft = contentLeft(camera);
            viewW = scroller.clientWidth;
            scrollSpan = Math.max(1, scroller.scrollWidth - viewW);
            panelW = Math.max(1, camera.offsetWidth);
        };

        const clampScroll = (v: number) => gsap.utils.clamp(0, scrollSpan, v);

        /* -------------------------------------------------------------- *
         * Critically damped spring, implicit Euler.
         *
         * Unconditionally stable, no overshoot, and — the point — velocity
         * stays CONTINUOUS when the target jumps. An exponential lerp has a
         * velocity discontinuity on every input event, which is what reads
         * as slightly digital.
         * -------------------------------------------------------------- */

        let target = scroller.scrollLeft;
        let pos = target;
        let vel = 0;

        const OMEGA = 2 * Math.PI * cfg.springHz;

        const step = (dt: number) => {
            const f = 1 + 2 * dt * OMEGA;
            const oo = OMEGA * OMEGA;
            const hoo = dt * oo;
            const hhoo = dt * hoo;
            const det = 1 / (f + hhoo);

            const nextVel = (vel + hoo * (target - pos)) * det;
            pos = (f * pos + dt * vel + hhoo * target) * det;
            vel = nextVel;
        };

        /* -------------------------------------------------------------- *
         * Input — writes `target` only. Never touches scrollLeft.
         * -------------------------------------------------------------- */

        const normalizeWheel = (e: WheelEvent) => {
            const raw =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (e.deltaMode === 1) return raw * 16; // lines
            if (e.deltaMode === 2) return raw * viewW; // pages
            return raw;
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            target = clampScroll(target + normalizeWheel(e) * cfg.wheelGain);
        };

        let dragging = false;
        let dragStartX = 0;
        let dragStartScroll = 0;
        let lastPointerX = 0;
        let dragVel = 0;

        const onPointerDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            dragging = true;
            dragStartX = e.clientX;
            lastPointerX = e.clientX;
            dragStartScroll = pos;
            dragVel = 0;
            scroller.style.cursor = 'grabbing';
            scroller.style.userSelect = 'none';
        };

        const onPointerMove = (e: MouseEvent) => {
            if (!dragging) return;
            const dx = e.clientX - lastPointerX;
            lastPointerX = e.clientX;
            dragVel = dragVel * 0.7 + dx * 0.3;
            target = clampScroll(dragStartScroll - (e.clientX - dragStartX));
        };

        const release = () => {
            if (!dragging) return;
            dragging = false;
            scroller.style.cursor = 'grab';
            scroller.style.userSelect = '';
            target = clampScroll(target - dragVel * cfg.throwGain);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const page = viewW * 0.8;
            const map: Record<string, number> = {
                ArrowRight: 220,
                ArrowLeft: -220,
                PageDown: page,
                PageUp: -page,
            };
            if (e.key in map) {
                e.preventDefault();
                target = clampScroll(target + map[e.key]);
            } else if (e.key === 'Home') {
                e.preventDefault();
                target = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                target = scrollSpan;
            }
        };

        /* Scrollbar drags, anchor jumps, find-in-page. Resync hard — chasing
         * these with the spring makes the scrollbar fight the render loop. */
        const onScroll = () => {
            if (!ownsScroll) return;
            if (Math.abs(scroller.scrollLeft - pos) > 2) {
                pos = target = scroller.scrollLeft;
                vel = 0;
            }
        };

        const onDragStart = (e: Event) => e.preventDefault();

        /* -------------------------------------------------------------- *
         * Clip ratchet — forward only, one segment at a time.
         *
         * Optional subsystem: only built when a `clip` element is provided.
         * The arm + teardown steps are exposed as closures so the rAF and
         * cleanup below can drive it without knowing its internals; both stay
         * null for a plain scroll-camera.
         * -------------------------------------------------------------- */

        let armBeats: (() => void) | null = null;
        let killBeats: (() => void) | null = null;

        if (clip) {
            const clipTl = gsap.timeline({ paused: true });
            cfg.initBeats({ clip, world, triggers, cfg });

            triggers.forEach((trg, i) => {
                // The hook owns the label the ratchet keys off; the consumer
                // only supplies the tween(s) that play across this segment.
                clipTl.addLabel(`s${i}`);
                cfg.buildBeat(clipTl, {
                    clip,
                    world,
                    trigger: trg,
                    index: i,
                    total: N,
                    cfg,
                });
            });

            const at = (i: number) =>
                clipTl.labels[`s${i}`] ?? clipTl.duration();
            const endOf = (i: number) =>
                i + 1 < N ? at(i + 1) : clipTl.duration();

            let queue: number[] = [];
            let cursor = 0;
            let active: gsap.core.Tween | null = null;

            const runNext = () => {
                const i = queue.shift();
                if (i === undefined) {
                    active = null;
                    clipTl.timeScale(1);
                    return;
                }

                clipTl.timeScale(Math.min(1 + queue.length * 0.35, 1.6));
                active = clipTl.tweenFromTo(at(i), endOf(i), {
                    ease: 'none',
                    onComplete: runNext,
                });
            };

            let armed = false;
            let pending = -1;

            const enqueue = (i: number) => {
                /* Triggers can fire during the first refresh, before layout has
                 * settled. Record and snap on arm — don't animate a beat the
                 * user scrolled past before the page was ready. */
                if (!armed) {
                    pending = Math.max(pending, i);
                    return;
                }
                /* Fill any gap, or a skipped beat stays in its start state. */
                for (let k = cursor; k <= i; k++) queue.push(k);
                cursor = Math.max(cursor, i + 1);
                if (!active) runNext();
            };

            const markTriggers = marks.map((mark, i) =>
                ScrollTrigger.create({
                    scroller,
                    horizontal: true,
                    trigger: mark,
                    start: `left ${cfg.triggerAt * 100}%`,
                    once: true,
                    markers: cfg.markers ? { indent: i * 22 } : false,
                    onEnter: () => enqueue(i),
                }),
            );

            armBeats = () => {
                armed = true;
                if (pending >= 0) {
                    clipTl.seek(endOf(pending));
                    cursor = pending + 1;
                    pending = -1;
                }
            };

            killBeats = () => {
                active?.kill();
                clipTl.kill();
                markTriggers.forEach((t) => t.kill());
            };
        }

        /* -------------------------------------------------------------- *
         * Render — the single writer
         * -------------------------------------------------------------- */

        let dolly = 0;
        let bank = 0;
        let lastPos = pos;

        world.style.willChange = 'transform';

        const render = () => {
            const dt = Math.min(gsap.ticker.deltaRatio() / 60, 1 / 30);

            if (ownsScroll) {
                step(dt);
                const settled =
                    Math.abs(target - pos) < 0.05 && Math.abs(vel) < 0.05;
                if (!settled) scroller.scrollLeft = pos;
            } else {
                pos = scroller.scrollLeft;
                vel = (pos - lastPos) / Math.max(dt, 1 / 240);
            }
            lastPos = pos;

            if (reduce) return; // flat camera, clip reveal still plays

            /* The viewport's centre in the camera's own coordinates. Doubles
             * as the vanishing point and as the curve's x lookup. */
            const focusX = pos + viewW / 2 - camLeft;
            const k = camSample(focusX / panelW);

            /* scale = P / (P - z)  =>  z = P * (1 - 1/scale).
             * POSITIVE z is toward the viewer. The velocity pull-back pushes
             * the other way, so it SUBTRACTS. */
            const z = P * (1 - 1 / k.scale);

            const lerp = 1 - Math.pow(1 - 0.1, dt * 60);

            const dollyTarget = Math.min(
                Math.abs(vel) * cfg.dollyGain,
                cfg.dollyMax,
            );
            dolly += (dollyTarget - dolly) * lerp;

            /* Two sources of roll: the curve's own steepness, and raw scroll
             * speed. Zero either gain to isolate the other. */
            const bankTarget = gsap.utils.clamp(
                -cfg.bankMax,
                cfg.bankMax,
                k.slope * cfg.bankSlopeGain + vel * cfg.bankGain,
            );
            bank += (bankTarget - bank) * lerp;

            /* Screen offset of a world-space translate at depth z is
             * multiplied by `scale`. Divide it out so sway/lift mean pixels. */
            const wx = -k.sway / k.scale;
            const wy = -k.lift / k.scale;

            /* Vanishing point tracks the viewport centre, so whatever is
             * centred scales in place instead of sliding toward an edge. */
            camera.style.perspectiveOrigin = `${focusX}px 50%`;
            /* Roll must pivot at the same point, or it swings the whole panel. */
            world.style.transformOrigin = `${focusX}px 50%`;
            world.style.transform = `rotateZ(${bank}deg) translate3d(${wx}px, ${wy}px, ${z - dolly}px)`;
        };

        /* -------------------------------------------------------------- *
         * Wiring
         * -------------------------------------------------------------- */

        if (ownsScroll) {
            scroller.addEventListener('wheel', onWheel, { passive: false });
            scroller.addEventListener('mousedown', onPointerDown);
            window.addEventListener('mousemove', onPointerMove);
            window.addEventListener('mouseup', release);
            scroller.addEventListener('mouseleave', release);
            scroller.style.cursor = 'grab';
        }
        scroller.addEventListener('keydown', onKeyDown);
        scroller.addEventListener('scroll', onScroll, { passive: true });
        scroller.addEventListener('dragstart', onDragStart);

        gsap.ticker.add(render);
        measure();

        /* Refresh AFTER layout settles. Called synchronously, ScrollTrigger
         * measures before fonts load and before images have intrinsic size. */
        const rafId = requestAnimationFrame(() => {
            measure();
            ScrollTrigger.refresh();
            armBeats?.();
        });

        let resizeTimer: number | undefined;
        const onResize = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                measure();
                ScrollTrigger.refresh();
            }, 150);
        };
        window.addEventListener('resize', onResize);
        const ro = new ResizeObserver(onResize);
        ro.observe(scroller);

        /* -------------------------------------------------------------- *
         * Teardown
         * -------------------------------------------------------------- */

        return () => {
            cancelAnimationFrame(rafId);
            window.clearTimeout(resizeTimer);
            ro.disconnect();
            window.removeEventListener('resize', onResize);

            scroller.removeEventListener('wheel', onWheel);
            scroller.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', release);
            scroller.removeEventListener('mouseleave', release);
            scroller.removeEventListener('keydown', onKeyDown);
            scroller.removeEventListener('scroll', onScroll);
            scroller.removeEventListener('dragstart', onDragStart);

            gsap.ticker.remove(render);
            killBeats?.();

            scroller.style.cursor = '';
            scroller.style.userSelect = '';
            world.style.willChange = '';
            world.style.transform = '';
            world.style.transformOrigin = '';
            camera.style.perspectiveOrigin = '';
        };
    }, [enabled, triggers, refs, config]);
}
