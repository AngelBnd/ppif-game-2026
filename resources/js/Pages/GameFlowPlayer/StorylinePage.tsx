import { PlayerFlowStep } from "@/data/playerGameFlow";

type Props = {
    step: PlayerFlowStep;
    
};

export default function StorylinePage({ step }: Props) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#1a1a1a] text-white">
            <section className="w-[90%] max-w-5xl text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                    Storyline
                </p>

                <h1 className="mt-4 text-6xl font-bold">{step.title}</h1>

                <p className="mt-6 text-xl text-white/60">
                    Placeholder for storyline screen.
                </p>

       
            </section>
        </main>
    );
}