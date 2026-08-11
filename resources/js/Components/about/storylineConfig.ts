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
import Panel7hope from '@/assets/storyline/hope/Panel7.webp';

import Panel1change from '@/assets/storyline/change/c1.webp';
import Panel2change from '@/assets/storyline/change/c2.webp';
import Panel3change from '@/assets/storyline/change/c3.webp';
import Panel4change from '@/assets/storyline/change/c4.webp';
import Panel5change from '@/assets/storyline/change/c5.webp';
import Panel6change from '@/assets/storyline/change/c6.webp';

import Panel1commit from '@/assets/storyline/commit/f1.webp';
import Panel2commit from '@/assets/storyline/commit/f2.webp';
import Panel3commit from '@/assets/storyline/commit/f3.webp';
import Panel4commit from '@/assets/storyline/commit/f4.webp';
import Panel5commit from '@/assets/storyline/commit/f5.webp';
import Panel6commit from '@/assets/storyline/commit/f6.webp';

import Prologue1 from '@/assets/storyline/prolog/e1.webp';
import Prologue2 from '@/assets/storyline/prolog/e2.webp';
import Prologue3 from '@/assets/storyline/prolog/e3.webp';
import Prologue4 from '@/assets/storyline/prolog/e4.webp';
import Prologue5 from '@/assets/storyline/prolog/e5.webp';
import Prologue6 from '@/assets/storyline/prolog/e6.webp';

import Epilogue1 from '@/assets/storyline/epi/s1.webp';
import Epilogue10 from '@/assets/storyline/epi/s10.webp';
import Epilogue11 from '@/assets/storyline/epi/s11.webp';
import Epilogue2 from '@/assets/storyline/epi/s2.webp';
import Epilogue3 from '@/assets/storyline/epi/s3.webp';
import Epilogue4 from '@/assets/storyline/epi/s4.webp';
import Epilogue5 from '@/assets/storyline/epi/s5.webp';
import Epilogue6 from '@/assets/storyline/epi/s6.webp';
import Epilogue7 from '@/assets/storyline/epi/s7.webp';
import Epilogue8 from '@/assets/storyline/epi/s8.webp';
import Epilogue9 from '@/assets/storyline/epi/s9.webp';

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
            {
                src: Prologue1,
                left: '150px',
                top: '12%',
                width: '850px',
                beat: 0,
            },
            {
                src: Prologue2,
                left: '1200px',
                top: '30%',
                width: '700px',
                beat: 1,
            },
            {
                src: Prologue3,
                left: '2000px',
                top: '8%',
                width: '900px',
                beat: 2,
            },
            {
                src: Prologue4,
                left: '3000px',
                top: '3%',
                width: '350px',
                beat: 2,
            },
            {
                src: Prologue5,
                left: '3400px',
                top: '3%',
                width: '350px',
                beat: 2,
            },
            {
                src: Prologue6,
                left: '3800px',
                top: '3%',
                width: '350px',
                beat: 2,
            },
        ],
    },
    'chapter-1': {
        panels: [
            {
                src: Panel1hope,
                left: '150px',
                top: '15%',
                width: '1000px',
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
            {
                src: Panel7hope,
                left: '5400px',
                top: '17%',
                width: '800px',
                beat: 2,
            },
        ],
    },
    'chapter-2': {
        panels: [
            {
                src: Panel1change,
                left: '150px',
                top: '14%',
                width: '1000px',
                beat: 0,
            },
            {
                src: Panel2change,
                left: '1250px',
                top: '20%',
                width: '900px',
                beat: 1,
            },
            {
                src: Panel3change,
                left: '2000px',
                top: '10%',
                width: '900px',
                beat: 2,
            },
            {
                src: Panel4change,
                left: '3000px',
                top: '20%',
                width: '800px',
                beat: 2,
            },
            {
                src: Panel5change,
                left: '3950px',
                top: '12%',
                width: '850px',
                beat: 2,
            },
            {
                src: Panel6change,
                left: '4900px',
                top: '22%',
                width: '800px',
                beat: 2,
            },
        ],
    },
    'chapter-3': {
        panels: [
            {
                src: Panel1commit,
                left: '150px',
                top: '14%',
                width: '1000px',
                beat: 0,
            },
            {
                src: Panel2commit,
                left: '1200px',
                top: '34%',
                width: '800px',
                beat: 1,
            },
            {
                src: Panel3commit,
                left: '1950px',
                top: '10%',
                width: '900px',
                beat: 2,
            },
            {
                src: Panel4commit,
                left: '2950px',
                top: '19%',
                width: '850px',
                beat: 2,
            },
            {
                src: Panel5commit,
                left: '4150px',
                top: '15%',
                width: '850px',
                beat: 2,
            },
            {
                src: Panel6commit,
                left: '5000px',
                top: '22%',
                width: '800px',
                beat: 2,
            },
        ],
    },
    'epilogue-1': {
        panels: [
            {
                src: Epilogue1,
                left: '150px',
                top: '10%',
                width: '850px',
                beat: 0,
            },
            {
                src: Epilogue2,
                left: '800px',
                top: '28%',
                width: '400px',
                beat: 1,
            },
            {
                src: Epilogue3,
                left: '1450px',
                top: '20%',
                width: '400px',
                beat: 2,
            },
            {
                src: Epilogue4,
                left: '2500px',
                top: '20%',
                width: '750px',
                beat: 2,
            },
            {
                src: Epilogue5,
                left: '3450px',
                top: '20%',
                width: '420px',
                beat: 2,
            },
        ],
    },
    'epilogue-2': {
        panels: [
            {
                src: Epilogue6,
                left: '150px',
                top: '15%',
                width: '800px',
                beat: 0,
            },
            {
                src: Epilogue7,
                left: '1000px',
                top: '32%',
                width: '700px',
                beat: 1,
            },
            {
                src: Epilogue8,
                left: '1650px',
                top: '10%',
                width: '900px',
                beat: 2,
            },
            {
                src: Epilogue9,
                left: '2750px',
                top: '20%',
                width: '350px',
                beat: 2,
            },
            {
                src: Epilogue10,
                left: '3100px',
                top: '20%',
                width: '350px',
                beat: 2,
            },
            {
                src: Epilogue11,
                left: '3600px',
                top: '5%',
                width: '1200px',
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
