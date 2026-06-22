import type { AdminFlowStep } from "../../data/adminGameFlow";

type Props = {
    step: AdminFlowStep;
   
};

export default function BossFightPage({ step }: Props) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
            <section className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-red-300">
                    Boss Stage
                </p>

                <h1 className="mt-4 text-7xl font-black text-red-400">
                    {step.title}
                </h1>

                <p className="mt-6 text-xl text-white/60">
                    Placeholder for boss fight monitor screen.
                </p>

                
            </section>
        </main>
    );
}