import GameHubStoryline from '@/Components/about/GameHubStoryline';
import { getStorylineConfig } from '@/Components/about/storylineConfig';
import type { Step } from '@/types/step';

type Props = {
    step: Step;
};

export default function StorylinePage({ step }: Props) {
    const { panels, triggers } = getStorylineConfig(step.slug);

    return (
        <main className="relative min-h-screen overflow-hidden text-white">
            <div className="absolute inset-0 z-0 h-screen w-screen bg-[#0A0C0F] opacity-50" />
            <p className="absolute left-8 top-8 z-40 text-sm uppercase tracking-[0.3em] text-white/50">
                {step.title}
            </p>

            <GameHubStoryline panels={panels} triggers={triggers} />
        </main>
    );
}
