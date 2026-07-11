import HP from '@/assets/monitor/HP.svg?react';

type TeamHPProps = {
    teamName: string;
    currentHP: number;
    maxHP: number;
};

export function TeamHP({ teamName, currentHP, maxHP }: TeamHPProps) {
    const hpPercentage =
        maxHP > 0 ? Math.min(Math.max((currentHP / maxHP) * 100, 0), 100) : 0;

    return (
        <div className="relative h-auto w-[12rem]">
            <HP className="block h-auto w-full" />

            <div className="absolute bottom-[18%] left-[15%] z-20 w-[82%] -rotate-12">
                <div className="flex items-end gap-2 text-[#73F9D9]">
                    <span className="font-arsenal text-[2.5rem] font-bold leading-none">
                        HP
                    </span>

                    <span className="mb-[3px] max-w-[7rem] font-arsenal text-[1.3rem] font-bold uppercase leading-none">
                        {teamName}
                    </span>
                </div>

                <div className="mt-4 h-[0.9rem] w-full overflow-hidden bg-[#141718]">
                    <div
                        className="h-full bg-[#73F9D9] transition-[width] duration-500 ease-out"
                        style={{
                            width: `${hpPercentage}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
