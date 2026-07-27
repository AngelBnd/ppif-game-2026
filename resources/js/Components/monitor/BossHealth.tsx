import Bosshealth from '@/assets/monitor/Bosshealth.svg?react';

type BossHealthBarProps = {
    currentHP: number;
    maxHP: number;
    className?: string;
};

export default function BossHealthBar({
    currentHP,
    maxHP,
    className = '',
}: BossHealthBarProps) {
    const healthPercentage =
        maxHP > 0 ? Math.min(Math.max((currentHP / maxHP) * 100, 0), 100) : 0;

    return (
        <div className={`w-[48rem] ${className}`}>
            <Bosshealth className="block h-auto w-full" />

            <div className="absolute left-[12%] top-5 z-20 h-[1.4rem] w-[76%] overflow-hidden bg-[#2a3032]">
                <div
                    className="h-full bg-[#BF1E2E] transition-[width] duration-500 ease-out"
                    style={{
                        width: `${healthPercentage}%`,
                    }}
                />
            </div>
        </div>
    );
}
