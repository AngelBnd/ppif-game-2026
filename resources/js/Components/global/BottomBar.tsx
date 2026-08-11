import BlackPartBottom from '@/../../public/svgs/BlackPartBottomSVG.svg';

export default function BottomFrame() {
    return (
        <div
            className={`pointer-events-none fixed -bottom-2 left-0 block w-full overflow-hidden`}
        >
            <img
                src={BlackPartBottom}
                className="relative bottom-0 h-auto w-[100vw]"
            />
            <div className="bottomFrame-video-mask absolute -bottom-12 bg-[#0A0C0F]">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="block w-full object-cover opacity-5"
                >
                    <source src="/videos/StarsLoop.webm" type="video/webm" />
                </video>
            </div>
        </div>
    );
}
