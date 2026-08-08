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

import Panel1hope from '@/assets/storyline/hope/Panel1.webp';
import Panel2hope from '@/assets/storyline/hope/Panel2.webp';
import Panel3hope from '@/assets/storyline/hope/Panel3.webp';
import Panel4hope from '@/assets/storyline/hope/Panel4.webp';
import Panel5hope from '@/assets/storyline/hope/Panel5.webp';
import Panel6hope from '@/assets/storyline/hope/Panel6.webp';

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
            {
                src: Panel1hope,
                left: '150px',
                top: '15%',
                width: '900px',
                beat: 0,
            },
            {
                src: Panel2hope,
                left: '1300px',
                top: '10%',
                width: '700px',
                beat: 1,
            },
            {
                src: Panel3hope,
                left: '1900px',
                top: '38%',
                width: '700px',
                beat: 2,
            },
            {
                src: Panel4hope,
                left: '2800px',
                top: '12%',
                width: '900px',
                beat: 2,
            },
            {
                src: Panel5hope,
                left: '3600px',
                top: '23%',
                width: '700px',
                beat: 2,
            },
            {
                src: Panel6hope,
                left: '4500px',
                top: '12%',
                width: '800px',
                beat: 2,
            },
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
            {
                src: Panel1,
                left: '1600px',
                top: '14%',
                width: '520px',
                beat: 2,
            },
        ],
    },
    'epilogue-1': {
        panels: [
            { src: Panel1, left: '300px', top: '20%', width: '540px', beat: 0 },
            {
                src: Panel1,
                left: '1000px',
                top: '15%',
                width: '480px',
                beat: 1,
            },
        ],
    },
    'epilogue-2': {
        panels: [
            { src: Panel1, left: '180px', top: '22%', width: '500px', beat: 0 },
            { src: Panel1, left: '820px', top: '18%', width: '520px', beat: 1 },
            {
                src: Panel1,
                left: '1500px',
                top: '25%',
                width: '480px',
                beat: 2,
            },
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
