import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PlayerFlowStep } from "../../data/playerGameFlow";

type Props = {
    step: PlayerFlowStep;
};

export default function ActivityPage({ step }: Props) {
    const navigate = useNavigate();
    const [isClicked, setIsClicked] = useState(false);
    const [barStage, setBarStage] = useState(0);

    const clickSound = useRef(new Audio("/sounds/boom.mp3"));
    const whooshSound = useRef(new Audio("/sounds/Whoosh.mp3"));

    useEffect(() => {
        const t1 = setTimeout(() => {
            whooshSound.current.currentTime = 0;
            whooshSound.current.volume = 0.5;
            whooshSound.current.play().catch(console.error);
            setBarStage(1);
        }, 100);

        const t2 = setTimeout(() => setBarStage(2), 400);
        const t3 = setTimeout(() => setBarStage(3), 520);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    const handleNextClick = () => {
        if (isClicked) return;

        clickSound.current.currentTime = 0;
        clickSound.current.play();
        setIsClicked(true);

        setTimeout(() => {
            setIsClicked(false);
            if (step.next) {
                navigate(`/player/${step.next}`);
            }
        }, 300);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#0b0d10] select-none">
            {/* Background */}
            <img
                src="/activity/edge.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            <img
                src="/activity/bg-overlay.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover mix-blend-screen z-[1]"
            />

            <img
                src="/activity/vector-390.svg"
                alt=""
                className="absolute left-0 w-full top-1/2 -translate-y-1/2 -rotate-[4.401deg] h-[43.97vw] opacity-80 z-[2]"
            />

            <div className="absolute inset-0 flex items-center justify-center p-0 md:p-0 z-[3]">
                <div
                    className="relative aspect-[1920/1080]"
                    style={{
                        width: "min(100%, 1920px, calc((100vh - 2rem) * 1920 / 1080))",
                    }}
                >
                    {/* NEXT BUTTON */}
                    <button
                        className={`absolute z-40 top-0 right-0
              flex items-center gap-[0.6vw] sm:gap-[0.9vw]
              transition-transform duration-75 ease-out
              cursor-pointer
              ${isClicked ? "scale-125" : "scale-100"}`}
                        onClick={handleNextClick}
                    >
                        <img
                            src="/activity/frame-x.svg"
                            alt=""
                            className="w-[6vw] max-w-[36px] h-auto sm:w-[4vw] sm:max-w-[44px] md:w-[2.9vw] md:max-w-[51px]"
                        />
                        <img
                            src="/activity/next-text.svg"
                            alt=""
                            className="w-[14vw] max-w-[90px] h-auto sm:w-[10vw] sm:max-w-[108px] md:w-[7vw] md:max-w-[125px] -rotate-[2deg]"
                        />
                    </button>

                    {/* ACTIVITY BAR */}
                    <img
                        src="/activity/bar.png"
                        alt=""
                        className={`
              absolute left-1/2 top-1/2 z-10
              w-[88%] sm:w-[80%] md:w-[74.045%]
              h-auto -translate-y-1/2
              transition-all duration-150 ease-linear
              ${
                  barStage === 0
                      ? "-translate-x-[180%] opacity-0 scale-90 -rotate-6"
                      : barStage === 1
                      ? "-translate-x-[45%] opacity-100 scale-105 rotate-1"
                      : barStage === 2
                      ? "-translate-x-[53%] scale-[0.98] -rotate-1"
                      : "-translate-x-1/2 opacity-100 scale-100 rotate-0"
              }
            `}
                    />
                </div>
            </div>

            {/* ROTATE DEVICE OVERLAY */}
            <div className="rotate-overlay fixed inset-0 z-[999] items-center justify-center bg-black/30 overflow-hidden">
                <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/activity/video/rotate-device.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            </div>
        </div>
    );
}