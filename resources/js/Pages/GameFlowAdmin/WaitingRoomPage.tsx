import Button from "@/Components/global/Button";
import type { AdminFlowStep } from "../../data/adminGameFlow";
import StartButton from "@/assets/icons/StartButtonSVG.svg?react"

type Props = {
    step: AdminFlowStep;
   goNext: () => void
};

export default function WaitingRoomPage({ step, goNext }: Props) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
            <section className="w-[90%] max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                    Admin PLACEHOLDER Waiting Room
                </p>

                <h1 className="mt-4 text-6xl font-bold">{step.title}</h1>

                <p className="mt-6 text-xl text-white/60">
                    Waiting for players to join the room.
                </p>

                <div className="mt-8 rounded-2xl bg-black/40 p-6">
                    <p className="text-white/50">Joined teams will appear here.</p>
            
                <Button
                onClick={goNext}
                Icon={StartButton}
                className="h-16 w-32"
                iconClassName="h-full w-full"
                />
                    
                </div>
   
            </section>
        </main>
    );
}