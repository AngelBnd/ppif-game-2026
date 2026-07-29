import gsap from 'gsap';
import MotionPathPlugin from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

/**
 * Camera channels sampled from SVG path data.
 *
 * Each path is a GRAPH curve: x is scroll progress, y is the channel value.
 * x must increase monotonically. Values are normalised against each path's
 * own x extent, so the authored x range is arbitrary — 0..1 and 0..1000
 * behave identically, and nothing depends on viewport size.
 *
 * The paths are plain strings. Nothing is added to the DOM.
 */

export type CameraSample = {
    sway: number;
    lift: number;
    scale: number;
    /** d(lift)/d(progress). Feeds roll. */
    slope: number;
};

type Baked = { table: Float64Array; step: number };

export type ChannelSpec = {
    d: string;
    /** Multiplier applied after zeroing. Hand-drawn curves usually need < 1. */
    gain?: number;
    /**
     * Baseline subtracted so the channel starts (or averages) at neutral.
     * 'first' — subtract y at x=0. Right for a curve drawn over your layout.
     * 'mean'  — centre it, so it deviates both ways evenly.
     * number  — subtract a literal value.
     * 'none'  — take y as authored. Correct for the scale channel.
     */
    zero?: 'first' | 'mean' | 'none' | number;
};

function bake(spec: ChannelSpec, resolution: number, label: string): Baked {
    const { d, gain = 1, zero = 'first' } = spec;
    const raw = MotionPathPlugin.stringToRawPath(d);
    MotionPathPlugin.cacheRawPathMeasurements(raw, 16);

    /* getPositionOnPath is parameterised by ARC LENGTH once cached, so these
     * samples are unevenly spaced in x — a steep section covers little x per
     * unit progress. The resample below relocks progress to scroll position. */
    const M = resolution * 4;
    const xs = new Float64Array(M);
    const ys = new Float64Array(M);

    for (let i = 0; i < M; i++) {
        const p = MotionPathPlugin.getPositionOnPath(raw, i / (M - 1));
        xs[i] = p.x;
        ys[i] = p.y;
    }

    for (let i = 1; i < M; i++) {
        if (xs[i] < xs[i - 1] - 0.001) {
            console.warn(
                `[camera] path "${label}" doubles back in x — graph curves must advance left to right.`,
            );
            break;
        }
    }

    const x0 = xs[0];
    const span = xs[M - 1] - x0 || 1;

    const table = new Float64Array(resolution);
    let j = 0;
    for (let i = 0; i < resolution; i++) {
        const xt = x0 + (span * i) / (resolution - 1);
        while (j < M - 2 && xs[j + 1] < xt) j++;
        const seg = xs[j + 1] - xs[j] || 1;
        table[i] = ys[j] + (ys[j + 1] - ys[j]) * ((xt - xs[j]) / seg);
    }

    let base = 0;
    if (zero === 'first') base = table[0];
    else if (zero === 'mean') {
        let sum = 0;
        for (let i = 0; i < resolution; i++) sum += table[i];
        base = sum / resolution;
    } else if (typeof zero === 'number') base = zero;

    if (base !== 0 || gain !== 1) {
        for (let i = 0; i < resolution; i++)
            table[i] = (table[i] - base) * gain;
    }

    return { table, step: 1 / (resolution - 1) };
}

function read(b: Baked, u: number) {
    const last = b.table.length - 1;
    const f = gsap.utils.clamp(0, 1, u) * last;
    const i = Math.floor(f);
    if (i >= last) return b.table[last];
    return b.table[i] + (b.table[i + 1] - b.table[i]) * (f - i);
}

/** Central difference. Value per unit progress. */
function slopeOf(b: Baked, u: number) {
    const h = b.step * 2;
    return (read(b, u + h) - read(b, u - h)) / (2 * h);
}

/* ------------------------------------------------------------------ *
 * Authoring
 *
 * x: 0 → 1000 spans the scrollable range.
 * y: the channel value. SVG y points DOWN, so lift/sway are negated on
 *    read — draw a curve rising on screen to lift content upward.
 *
 * Keep bezier handles COLLINEAR across each node or you get a cusp, and a
 * cusp is a visible corner in the motion. Below, every node's incoming and
 * outgoing handles are horizontal, which is what keeps them smooth.
 * ------------------------------------------------------------------ */

export const CAMERA_PATHS = {
    lift: 'M0,0 C120,0 140,-30 260,-30 C400,-30 420,10 550,10 C680,10 700,-60 820,-60 C920,-60 940,-15 1000,-15',
    sway: 'M0,0 C120,0 140,40 260,40 C400,40 420,-30 550,-30 C680,-30 700,60 820,60 C920,60 940,0 1000,0',
    scale: 'M0,0 C120,0 140,22 260,22 C400,22 420,-8 550,-8 C680,-8 700,38 820,38 C920,38 940,0 1000,0',
};

export type CameraPaths = {
    lift?: string | ChannelSpec;
    sway?: string | ChannelSpec;
    scale?: string | ChannelSpec;
};

const spec = (v: string | ChannelSpec | undefined): ChannelSpec | null =>
    v == null ? null : typeof v === 'string' ? { d: v } : v;

/** Bake once. The result has no dependency on layout or viewport. */
export function createCameraPaths(
    paths: CameraPaths = CAMERA_PATHS,
    resolution = 512,
) {
    const l = spec(paths.lift);
    const s = spec(paths.sway);
    const c = spec(paths.scale);

    const liftB = l ? bake(l, resolution, 'lift') : null;
    const swayB = s ? bake(s, resolution, 'sway') : null;
    const scaleB = c ? bake({ zero: 'none', ...c }, resolution, 'scale') : null;

    return (u: number): CameraSample => ({
        sway: swayB ? -read(swayB, u) : 0,
        lift: liftB ? -read(liftB, u) : 0,
        scale: scaleB ? Math.max(0.2, 1 + read(scaleB, u) / 100) : 1,
        slope: liftB ? -slopeOf(liftB, u) : 0,
    });
}

export type CameraSampler = ReturnType<typeof createCameraPaths>;
