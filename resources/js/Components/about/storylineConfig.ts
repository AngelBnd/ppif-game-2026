import type { DivisionTrigger } from '@/Components/about/useDivisionCamera';

export type StorylinePanel = {
    src: string;
    left: string;
    top: string;
    width: string;
    /** Tags this panel for the fade-in/out buildBeat pattern (data-beat). */
    beat: number;
};

export type StorylineConfig = {
    panels: StorylinePanel[];
    /** Camera "beat" markers along the scroll track. Falls back to
     * DEFAULT_STORYLINE_TRIGGERS when omitted - independent of panel count. */
    triggers?: DivisionTrigger[];
};

// Only Panel1 has source art so far (converted from public/storyline/1/Panel1.png).
// Every slug below reuses it with a different layout so each storyline step
// at least *looks* distinct while real art is still pending - swap in the
// real per-slug panels (and the SLBox line-boxes) once that art exists.
const Panel1 = '/storyline/1/Panel1.webp';

export const DEFAULT_STORYLINE_TRIGGERS: DivisionTrigger[] = [
    { left: 29, top: 20, inset: 64 },
    { left: 45, top: 20, inset: 43 },
    { left: 63, top: 20, inset: 32 },
    { left: 77, top: 20, inset: 0 },
];

// One entry per `type: 'story'` slug in StepSeeder.php.
export const STORYLINE_CONFIGS: Record<string, StorylineConfig> = {
    prologue: {
        panels: [
            { src: Panel1, left: '200px', top: '10%', width: '520px', beat: 0 },
            { src: Panel1, left: '750px', top: '23%', width: '480px', beat: 1 },
        ],
    },
    'chapter-1': {
        panels: [
            { src: Panel1, left: '150px', top: '15%', width: '460px', beat: 0 },
            { src: Panel1, left: '700px', top: '30%', width: '540px', beat: 1 },
            { src: Panel1, left: '1400px', top: '12%', width: '500px', beat: 2 },
        ],
    },
    'chapter-2': {
        panels: [
            { src: Panel1, left: '100px', top: '25%', width: '500px', beat: 0 },
            { src: Panel1, left: '900px', top: '10%', width: '520px', beat: 1 },
        ],
    },
    'chapter-3': {
        panels: [
            { src: Panel1, left: '250px', top: '18%', width: '480px', beat: 0 },
            { src: Panel1, left: '850px', top: '28%', width: '500px', beat: 1 },
            { src: Panel1, left: '1600px', top: '14%', width: '520px', beat: 2 },
        ],
    },
    'epilogue-1': {
        panels: [
            { src: Panel1, left: '300px', top: '20%', width: '540px', beat: 0 },
            { src: Panel1, left: '1000px', top: '15%', width: '480px', beat: 1 },
        ],
    },
    'epilogue-2': {
        panels: [
            { src: Panel1, left: '180px', top: '22%', width: '500px', beat: 0 },
            { src: Panel1, left: '820px', top: '18%', width: '520px', beat: 1 },
            { src: Panel1, left: '1500px', top: '25%', width: '480px', beat: 2 },
        ],
    },
};

// Any story slug not listed above (e.g. a new chapter added later) still
// renders something instead of crashing.
export const DEFAULT_STORYLINE_CONFIG: StorylineConfig = {
    panels: [
        { src: Panel1, left: '200px', top: '10%', width: '520px', beat: 0 },
        { src: Panel1, left: '750px', top: '23%', width: '480px', beat: 1 },
    ],
};

export function getStorylineConfig(slug: string): StorylineConfig {
    return STORYLINE_CONFIGS[slug] ?? DEFAULT_STORYLINE_CONFIG;
}
