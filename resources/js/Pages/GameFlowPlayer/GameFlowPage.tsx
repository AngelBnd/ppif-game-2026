import { useNavigate, useParams } from "react-router-dom";
import { playerGameFlow } from "../../data/playerGameFlow";

import ActivityPage from "./ActivityPage";
import AnswerTheQuestionPage from "./AnswerTheQuestionPage";
import BossFightPage from "./BossFightPage";
import StorylinePage from "./StorylinePage";
import JoinRoomPage from "./JoiningPage";

import Button from "@/Components/global/Button";
import NextButton from "@/assets/icons/NextButtonSVG.svg?react"

export default function PlayerFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();

    const step = playerGameFlow.find((item) => item.slug === stepId);

    if (!step) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Player Page Not Found</h1>

                    <button
                        onClick={() => navigate("/player/join-room")}
                        className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-black"
                    >
                        Back to Join Room
                    </button>
                </div>
            </main>
        );
    }

    const goNext = () => {
        if (step.next) {
            navigate(`/player/${step.next}`);
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden">
          <div className="absolute right-8 top-8">
            <Button
              Icon={NextButton}
              className=""
              iconClassName="w-48"
              onClick={goNext}
            />
            <div className="font-arsenal text-white w-48">
              player nanti ga ada button nextnya, 
              nextnya itu dikendaliin sama admin
              ini cuman biar gampang aja liat" pagenya.
              <br/>
              buat liat admin /admin
              buat liat player /player
            </div>
          </div>
            {step.type === "join" && (
                <JoinRoomPage step={step} goNext={goNext} />
            )}

            {step.type === "story" &&(

              <StorylinePage step={step}  />
            )}

            {step.type === "answer" && (
                <AnswerTheQuestionPage step={step}  />
            )}

            {step.type === "activity" && (
                <ActivityPage step={step} />
            )}

            {step.type === "boss" && (
                <BossFightPage step={step}  />
            )}
        </div>
    );
}