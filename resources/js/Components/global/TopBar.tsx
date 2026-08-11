import BlackPartTopSVG from '@/../../public/svgs/BlackPartTopSVG.svg';

export default function Navbar() {
    return (
        <nav className="fixed -top-4 left-0 z-10 h-[180px] w-full overflow-hidden">
            <img
                src={BlackPartTopSVG}
                className="absolute -top-3 h-auto w-[100vw]"
            />

            <div className="absolute -top-4 left-0 w-full">
                <div className="navbar-video-mask bg-[#0A0C0F]">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover opacity-5"
                    >
                        <source
                            src="/videos/StarsLoop.webm"
                            type="video/webm"
                        />
                    </video>
                </div>
            </div>
        </nav>
    );
}
