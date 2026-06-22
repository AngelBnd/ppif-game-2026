import type { PlayerFlowStep } from "../../data/playerGameFlow";

type Props = {
    step: PlayerFlowStep;
   goNext :  () => void;
};

export default function JoinRoomPage({ step, goNext }: Props) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="flex flex-col gap-4">
            <div className="w-48 rounded-xl bg-white/10 p-4">
                <h2 className="text-xl font-semibold">Join Room</h2>

                <input
                    placeholder="Team name"
                    className="mt-4 w-full rounded-lg bg-white px-4 py-3 text-black outline-none"
                />

                <input
                    placeholder="Room code"
                    className="mt-3 w-full rounded-lg bg-white px-4 py-3 text-black outline-none"
                />
            </div>
            <button
                onClick={()=>{goNext()}}
                className="bg-red-800 p-4 rounded-md"
            >
                join
            </button>
        </div>
        </main>
    );
}