import { useEffect, useState } from "react";
import type { PlayerFlowStep } from "../../data/playerGameFlow";

type Props = {
    step: PlayerFlowStep;
    goNext: () => void;
};

export default function JoinRoomPage({ step, goNext }: Props) {
  const [pin, setPin] = useState("");
  const [joinedCount, setJoinedCount] = useState(0);
  const [pressState, setPressState] = useState<"idle" | "hover" | "press">("idle");
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: portrait)").matches || window.innerHeight >= window.innerWidth;
  });

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
  }

  function handleStart() {
    if (pin.length < 6 || joinedCount >= 2) return;
    setJoinedCount((count) => count + 1);
    setPin("");
  }

  function triggerStart() {
    if (pin.length < 6 || joinedCount >= 2) return;

    setPressState("hover");
    setTimeout(() => setPressState("press"), 120);
    setTimeout(() => {
      handleStart();
      setPressState("idle");
    }, 260);
  }

  const pinSlots = Array.from({ length: 6 }, (_, i) => pin[i] ?? "X");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const updateOrientation = () => {
      setIsPortrait(mediaQuery.matches || window.innerHeight >= window.innerWidth);
    };

    updateOrientation();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateOrientation);
    } else {
        // Jaga2 untuk browser lama yang tidak mendukung addEventListener pada MediaQueryList
      mediaQuery.addListener(updateOrientation); 
    }

    window.addEventListener("resize", updateOrientation);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updateOrientation);
      } else {
        // jaga2 untuk browser lama yang tidak mendukung removeEventListener pada MediaQueryList
        mediaQuery.removeListener(updateOrientation);
      }
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  if (isPortrait) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-fill"
        >
          <source src="/starting-page/rotate-device.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface-gradient">
      {/*  BACKGROUND LAYER */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        {/* 1. vector — paling belakang */}
        <div
          className="absolute inset-0 z-1 bg-[url('/starting-page/vector-99.svg')] bg-right bg-no-repeat bg-[length:auto_100%]"
        />

        {/* 2. star */}
        <img
          src="/starting-page/star.svg"
          alt=""
          className="absolute right-0 top-0 z-[2] h-full w-auto"
        />

        {/* 3. flag*/}
        <img
          src={`/starting-page/${joinedCount}-2hasjoined.svg`}
          alt=""
          className="absolute left-[30%] top-[-2.1%] z-[4] w-[75%] h-auto"
        />

        {/* 4. vignette*/}
        <div
          className="absolute inset-0 z-[5] bg-gradient-to-r from-black/60 via-black/10 to-transparent"
        />

        {/*  5. BOARD STATUS LEFT */}
        {joinedCount >= 1 ? (
          /* SIGNED: bungkus dalem relative biar nama-tim nempel ke board */
          <div className="absolute top-[3%] right-[16%] z-[9] w-[20%]">
            <div className="relative w-full animate-persona-in">
              <img
                src="/starting-page/BOARD-STATUS-LEFT(SIGNED).svg"
                alt=""
                className="block w-full h-auto"
              />
              {/* nama-tim wrapper: bottom/left/w relatif ke board di atas */}
              <div className="absolute bottom-[10%] left-[26%] w-[53%]">
                <img src="/starting-page/nama-tim.svg" alt="" className="w-full h-auto" />
                <span className="absolute left-[10%] top-[15%] w-[9vw] -rotate-[9deg] text-[1.8vw] font-bold leading-none text-white font-arsenal">
                  NAMA<br />TIM 1
                </span>
                <span className="absolute left-[20%] top-[75%] w-[9vw] -rotate-[5deg] text-[1vw] font-bold leading-[1vw] text-white font-arsenal">
                  has joined
                </span>
              </div>
            </div>
          </div>
        ) : (
          <img
            src="/starting-page/BOARD-STATUS-LEFT-TILT-(UNSIGNED).svg"
            alt=""
            className="absolute top-[8%] right-[16%] z-[9] w-[20%] h-auto"
          />
        )}

        {/*  6. BOARD STATUS RIGHT  */}
        {joinedCount >= 2 ? (
          /* SIGNED: bungkus dalem relative biar nama-tim-kanan nempel ke board */
          <div className="absolute top-[8%] right-[2%] z-[8] w-[25%]">
            <div className="relative w-full animate-persona-in">
              <img
                src="/starting-page/BOARD-STATUS-RIGHT(SIGNED).png"
                alt=""
                className="block w-full h-auto"
              />
              {/* nama-tim-kanan wrapper: bottom/left/w relatif ke board di atas */}
              <div className="absolute bottom-[15%] left-[28%] w-[42%]">
                <img src="/starting-page/nama-tim-kanan.svg" alt="" className="w-full h-auto" />
                <span className="absolute left-[10%] top-[10%] w-[9vw] rotate-[4deg] text-[1.8vw] font-bold leading-none text-white font-arsenal">
                  NAMA<br />TIM 1
                </span>
                <span className="absolute left-[20%] top-[75%] w-[9vw] rotate-[4deg] text-[1vw] font-bold leading-[1vw] text-white font-arsenal">
                  has joined
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* UNSIGNED */
          <img
            src="/starting-page/BOARD-STATUS-RIGHT-(UNSIGNED).svg"
            alt=""
            className="absolute top-[10%] right-[3%] z-[8] w-[22%] h-auto"
          />
        )}
      </div>
        {/* 7. edge — video di-mask pakai SVG putih (edge.png gelap, tidak bisa jadi mask) */}
        {/* Edge atas */}
        <div className="absolute top-0 inset-x-0 z-30 h-[14%] overflow-hidden pointer-events-none">
          <div className="joining-edge-top-mask absolute inset-0 bg-[#0A0C0F]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/videos/StarsLoop.mp4" type="video/mp4" />
              <source src="/starting-page/starloop.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Edge bawah */}
        <div className="absolute bottom-0 inset-x-0 z-30 h-[12%] overflow-hidden pointer-events-none">
          <div className="joining-edge-bottom-mask absolute inset-0 bg-[#0A0C0F]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/videos/StarsLoop.mp4" type="video/mp4" />
              <source src="/starting-page/starloop.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

      {/*  CONTENT LAYER (di atas background) */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-white">

        <div className="absolute w-[20%] left-[25%] top-[40%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[0.1vw]">
          <img src="/starting-page/PIN.svg" alt="PIN" className="h-[5vw] w-[20%]" />
          <label className="group relative cursor-pointer">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={pin}
              onChange={handlePinChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  triggerStart();
                }
              }}
              maxLength={6}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div className="flex items-center justify-center gap-x-[0.1vw] text-[5vw] font-bold font-noto select-none">
              {pinSlots.map((ch, i) => (
                <span
                  key={i}
                  className={`${i === 3 ? "ml-3" : ""} ${
                    ch === "X"
                      ? "text-white transition-colors group-hover:text-white/70"
                      : "text-white"
                  }`}
                >
                  {ch}
                </span>
              ))}
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className={`absolute left-[25%] bottom-[30%] -translate-x-1/2 rotate-[2deg] w-[20%] cursor-pointer transition-transform duration-150 ${
            pressState === "hover"
              ? "scale-105"
              : pressState === "press"
              ? "scale-90"
              : "hover:scale-105 active:scale-90"
          }`}
        >
          <img src="/starting-page/START_TEXT.svg" alt="Start" className="w-full h-auto pointer-events-none" />
        </button>

        <img
          src="/starting-page/INPUT_UNIQUE_CODE.svg"
          alt=""
          className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[60%] h-auto"
        />
      </div>
    </div>
  );
}