import type { AdminFlowStep } from "../../data/adminGameFlow";

type Props = {
    step: AdminFlowStep;
   
};

export default function ActivityPage({ step }: Props) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
            <section className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                    Admin Activity
                </p>

                <h1 className="mt-4 text-6xl font-bold">{step.title}</h1>

                <p className="mt-4 text-white/60">
                    Placeholder for activity screen.
                </p>

            </section>
        </main>
    );
}