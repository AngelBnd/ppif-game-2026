export default function Navbar() {
    return (
        <nav className="fixed -top-4 left-0 z-10 h-[180px] w-full overflow-hidden">
            <div className="absolute -top-3 left-0 w-full">
                <div className="navbar-video-mask bg-[#0A0C0F]">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover opacity-5"
                    >
                        <source src="/videos/StarsLoop.mp4" type="video/mp4" />
                    </video>
                </div>
            </div>
        </nav>
    );
}
