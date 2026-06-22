import BottomFrame from '@/Components/global/BottomBar';
import TopBar from '@/Components/global/TopBar';
import ModelBackground from '@/Components/three/ModelBackground';
import type { ReactNode } from 'react';

type BackgroundPreset = 'home' | 'about' | 'timeline' | 'contact';

type AppLayoutProps = {
    children: ReactNode;
    backgroundPreset?: BackgroundPreset;
    showBackground?: boolean;
};

export default function AppLayout({
    children,
    backgroundPreset = 'home',
    showBackground = true,
}: AppLayoutProps) {
    return (

            <div className="relative min-h-screen overflow-hidden bg-[#0d0f13] text-white">
                {showBackground && (
                    <ModelBackground preset={backgroundPreset} />
                )}

                <div className="relative z-10">
                    <TopBar />

                    <main className="min-h-screen">{children}</main>

                    <BottomFrame />
                </div>
            </div>
  
    );
}
