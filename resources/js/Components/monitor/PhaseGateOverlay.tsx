import type { SessionInfo } from '@/types/gameSession';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

import LetsFightBtn from '@/assets/monitor/Lets_fight_Button.svg';
import NumberOne from '@/assets/monitor/ONE.png';
import PhaseText from '@/assets/monitor/PHASE.svg';
import StarBg from '@/assets/monitor/star_background.png';
import NumberThree from '@/assets/monitor/THREE.png';
import NumberTwo from '@/assets/monitor/TWO.png';

type PhaseGateOverlayProps = {
    session: SessionInfo | null;
    isStarting: boolean;
    startError: boolean;
    onStartPhase: () => void;
    isIntroDone: boolean;
};

export default function PhaseGateOverlay({
    session,
    isStarting,
    startError,
    onStartPhase,
    isIntroDone,
}: PhaseGateOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    const starBgRef = useRef<HTMLImageElement>(null);
    const phaseTextRef = useRef<HTMLImageElement>(null);
    const phaseNumRef = useRef<HTMLImageElement>(null);
    const letsFightRef = useRef<HTMLButtonElement>(null);
    const letsFightImgRef = useRef<HTMLImageElement>(null);
    const uiContainerRef = useRef<HTMLDivElement>(null);

    const introVideoRef = useRef<HTMLVideoElement>(null);
    const outroVideoRef = useRef<HTMLVideoElement>(null);

    // State untuk mengatur alur: 'intro' -> 'static' -> 'outro'
    const [animationState, setAnimationState] = useState<
        'intro' | 'static' | 'outro'
    >('intro');

    const phaseNum = session?.boss_phase ?? 1;

    // Map nomor phase ke variabel import
    const phaseNumberImg =
        phaseNum === 3 ? NumberThree : phaseNum === 2 ? NumberTwo : NumberOne;

    useEffect(() => {
        if (!isIntroDone) return;

        const tl = gsap.timeline();

        // 1. Star Background Fade In (Muncul Duluan)
        tl.fromTo(
            starBgRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.6, ease: 'power2.out' },
        );

        // 2. PHASE text muncul (Animasi gaya About Tab)
        tl.fromTo(
            phaseTextRef.current,
            { xPercent: -10, rotation: -6, scale: 1, autoAlpha: 0 },
            {
                xPercent: 5,
                rotation: 3,
                scale: 1,
                duration: 0.15,
                autoAlpha: 1,
                ease: 'power2.out',
            },
            '-=0.2',
        ).to(phaseTextRef.current, {
            xPercent: 0,
            rotation: 0,
            scale: 1,
            duration: 0.12,
            ease: 'power2.out',
        });

        // 3. Nomor Phase muncul
        tl.fromTo(
            phaseNumRef.current,
            { xPercent: -10, rotation: -6, scale: 1, autoAlpha: 0 },
            {
                xPercent: 5,
                rotation: 3,
                scale: 1,
                duration: 0.15,
                autoAlpha: 1,
                ease: 'power2.out',
            },
            '-=0.1',
        ).to(phaseNumRef.current, {
            xPercent: 0,
            rotation: 0,
            scale: 1,
            duration: 0.12,
            ease: 'power2.out',
        });

        // 4. Tombol Let's Fight muncul terakhir
        tl.fromTo(
            letsFightRef.current,
            { xPercent: -10, rotation: -6, scale: 1, autoAlpha: 0 },
            {
                xPercent: 5,
                rotation: 3,
                scale: 1,
                duration: 0.15,
                autoAlpha: 1,
                ease: 'power2.out',
            },
            '-=0.1',
        ).to(letsFightRef.current, {
            xPercent: 0,
            rotation: 0,
            scale: 1,
            duration: 0.12,
            ease: 'power2.out',
        });

        const wiggleTween = gsap.fromTo(
            letsFightImgRef.current,
            { rotation: -1 }, // Miring ke kiri
            {
                rotation: 1, // Miring ke kanan
                duration: 1.5,
                repeat: -1, // Loop selamanya
                yoyo: true, // Gerak bolak-balik
                ease: 'sine.inOut',
                delay: 1, // Delay 1 detik agar tidak tabrakan dengan animasi masuk (nomor 4)
            },
        );

        if (introVideoRef.current) {
            introVideoRef.current.play().catch((err) => {
                console.warn('Autoplay ditahan oleh browser:', err);
            });
        }

        return () => {
            tl.kill();
        };
    }, [isIntroDone]);

    // 2. Antisipasi jika gagal menghubungi server
    useEffect(() => {
        if (startError && overlayRef.current) {
            // Munculkan kembali UI secara visual agar pemain bisa klik ulang
            gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.3 });
            gsap.to(uiContainerRef.current, { autoAlpha: 1, duration: 0.3 });
            gsap.to(starBgRef.current, { autoAlpha: 1, duration: 0.3 });
            setAnimationState('static');
        }
    }, [startError]);

    const handleFightClick = () => {
        if (animationState === 'outro' || isStarting) return;

        // Pindah ke state outro
        setAnimationState('outro');

        // Hilangkan elemen UI statis (Bintang, Teks, Tombol) dengan cepat sebelum video outro main
        gsap.to(uiContainerRef.current, {
            autoAlpha: 0,
            duration: 0.2,
            ease: 'power2.in',
        });

        gsap.to(starBgRef.current, {
            autoAlpha: 0,
            duration: 0.2,
            ease: 'power2.in',
        });

        // Play video outro
        if (outroVideoRef.current) {
            outroVideoRef.current.currentTime = 0;
            outroVideoRef.current.play();
        }
    };

    // 3. Fungsi baru untuk menyembunyikan layar dan mengirim perintah ke BossFightPage
    const handleVideoEnd = () => {
        onStartPhase();

        if (overlayRef.current) {
            gsap.to(overlayRef.current, {
                autoAlpha: 0,
                duration: 0.5,
                ease: 'power2.inOut',
            });
        }
    };

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 z-[46] flex items-center justify-center overflow-hidden bg-[#0A0C0F]/90"
        >
            {/* 1. Layer Animasi Mata */}
            <div className="pointer-events-none absolute inset-0 z-0 flex w-screen items-center justify-center">
                {/* ================= PHASE 1 ================= */}
                {phaseNum === 1 && (
                    <>
                        <video
                            ref={introVideoRef}
                            src="/activity/video/phases/Phase1Intro.webm"
                            autoPlay={false}
                            muted
                            playsInline
                            onEnded={() => setAnimationState('static')}
                            className={`absolute h-auto w-screen scale-100 drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'intro'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                        <img
                            src="/activity/video/phases/Phase1Static.webp"
                            alt="Eyeshot Phase 1"
                            className={`absolute h-auto w-screen scale-100 object-contain drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'static'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                        <video
                            ref={outroVideoRef}
                            src="/activity/video/phases/Phase1Outro.webm"
                            muted
                            playsInline
                            onEnded={handleVideoEnd}
                            className={`absolute h-auto w-screen scale-100 drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'outro'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                    </>
                )}

                {/* ================= PHASE 2 ================= */}
                {phaseNum === 2 && (
                    <>
                        <video
                            ref={introVideoRef}
                            src="/activity/video/phases/Phase2Intro.webm"
                            autoPlay={false}
                            muted
                            playsInline
                            onEnded={() => setAnimationState('static')}
                            className={`absolute h-auto w-screen scale-100 drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'intro'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                        <img
                            src="/activity/video/phases/Phase2Static.webp"
                            alt="Eyeshot Phase 2"
                            className={`absolute h-auto w-screen scale-100 object-contain drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'static'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                        <video
                            ref={outroVideoRef}
                            src="/activity/video/phases/Phase2Outro.webm"
                            muted
                            playsInline
                            onEnded={handleVideoEnd}
                            className={`absolute h-auto w-screen scale-100 drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'outro'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                    </>
                )}

                {/* ================= PHASE 3 ================= */}
                {phaseNum === 3 && (
                    <>
                        <video
                            ref={introVideoRef}
                            src="/activity/video/phases/Phase3Intro.webm"
                            autoPlay={false}
                            muted
                            playsInline
                            onEnded={() => setAnimationState('static')}
                            className={`absolute h-auto w-screen scale-100 drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'intro'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                        <img
                            src="/activity/video/phases/Phase3Static.webp"
                            alt="Eyeshot Phase 3"
                            className={`absolute h-auto w-screen scale-100 object-contain drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'static'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                        <video
                            ref={outroVideoRef}
                            src="/activity/video/phases/Phase3Outro.webm"
                            muted
                            playsInline
                            onEnded={handleVideoEnd}
                            className={`absolute h-auto w-screen scale-100 drop-shadow-2xl transition-opacity duration-300 ${
                                animationState === 'outro'
                                    ? 'z-10 opacity-100'
                                    : 'pointer-events-none z-0 opacity-0'
                            }`}
                        />
                    </>
                )}
            </div>
            {/* 2. Star Background (Di tengah dengan z-10) */}
            <img
                ref={starBgRef}
                src={StarBg}
                alt="Stars"
                className="pointer-events-none absolute bottom-[-30px] right-[-30px] z-10 h-[80%] w-auto object-contain opacity-0"
            />

            {/* 3. Layer UI Assets (Paling depan, dipertahankan dengan z-20) */}
            <div
                ref={uiContainerRef}
                className="absolute z-20 ml-[650px] mt-8 flex flex-col items-center justify-center"
            >
                <div className="relative mb-6 mt-4 h-[550px] w-[400px] md:w-[500px]">
                    <img
                        ref={phaseTextRef}
                        src={PhaseText}
                        alt="PHASE"
                        className="absolute bottom-10 z-20 h-auto w-[500px] object-contain opacity-0 md:w-[550px]"
                    />
                    <img
                        ref={phaseNumRef}
                        src={phaseNumberImg}
                        alt={`Phase ${phaseNum}`}
                        className="absolute -bottom-16 -right-[30%] z-10 h-auto w-[270px] object-contain opacity-0 drop-shadow-lg md:w-[380px]"
                    />
                </div>

                <button
                    ref={letsFightRef}
                    onClick={handleFightClick}
                    disabled={isStarting}
                    className="absolute -bottom-[-35px] right-[-20px] z-30 w-[320px] cursor-pointer opacity-0 transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-110 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-[400px]"
                >
                    <img
                        ref={letsFightImgRef} // Pasang ref-nya di sini
                        src={LetsFightBtn}
                        alt="Let's Fight!"
                        className="h-auto w-full object-contain drop-shadow-xl"
                    />
                </button>

                {startError && (
                    <p className="absolute -bottom-12 mt-4 font-arsenal text-sm text-red-400">
                        Gagal memulai phase - coba tekan Let's Fight lagi.
                    </p>
                )}
            </div>
        </div>
    );
}
