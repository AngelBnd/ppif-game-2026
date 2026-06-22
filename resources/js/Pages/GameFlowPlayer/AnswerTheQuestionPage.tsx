import { PlayerFlowStep } from "@/data/playerGameFlow";

type Props = {
    step: PlayerFlowStep;
    question?: string;
};

export default function AnswerTheQuestionPage({ step, question }: Props) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
            <section className="w-[90%] max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                    Plyaer Answer Screen
                </p>

                <h1 className="mt-4 text-6xl font-bold">{step.title}</h1>

                <div className="text-xl font-noto">
                    {question}
                </div>
                <p className="mt-6 text-2xl text-white/70">
                    Quiz di sini short answer
                </p>

          
            </section>
        </main>
    );
}