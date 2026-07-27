import gsap from 'gsap';
import MorphSVGPlugin from 'gsap/MorphSVGPlugin';
import { forwardRef, useEffect, useRef } from 'react';
import DialogueName1 from '../../assets/DialogueBox/IdentityBoxSequence/DialogueName1.svg?react';
import DialogueName2 from '../../assets/DialogueBox/IdentityBoxSequence/DialogueName2.svg?react';
import DialogueName3 from '../../assets/DialogueBox/IdentityBoxSequence/DialogueName3.svg?react';
import DialogueBox1 from '../../assets/DialogueBox/MainBoxSequence/DialogueBox1.svg?react';
import DialogueBox2 from '../../assets/DialogueBox/MainBoxSequence/DialogueBox2.svg?react';
import DialogueBox3 from '../../assets/DialogueBox/MainBoxSequence/DialogueBox3.svg?react';

gsap.registerPlugin(MorphSVGPlugin);

type DialogueBoxProps = {
    msg: string;
    className?: string;
    classNameSizeBox?: string;
    classNameIdentitySize?: string;
    classNameText?: string;
};

// ini pas gw bikin, gw ga planning kotak dari identitas sm yang kotak dialognya bisa berbarengan ganti ukurannya mb
// jadi ya harus manual

const DialogueBox = forwardRef<HTMLDivElement, DialogueBoxProps>(
    (
        {
            msg,
            className,
            classNameSizeBox,
            classNameIdentitySize,
            classNameText,
        },
        ref,
    ) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const ctx = gsap.context(() => {
                const fills = [
                    '#dialogue-fill-1',
                    '#dialogue-fill-2',
                    '#dialogue-fill-3',
                ];
                const borders = [
                    '#dialogue-border-1',
                    '#dialogue-border-2',
                    '#dialogue-border-3',
                ];
                const identityFills = [
                    '#identity-fill-1',
                    '#identity-fill-2',
                    '#identity-fill-3',
                ];
                const identityBorders = [
                    '#identity-border-1',
                    '#identity-border-2',
                    '#identity-border-3',
                ];
                let index = 0;
                const tl = gsap.timeline({
                    repeat: -1,
                    yoyo: true,
                    defaults: { duration: 0.3, ease: 'sine.inOut' },
                });

                function nextFill() {
                    index = (index + 1) % fills.length;
                    return fills[index];
                }

                function nextBorder() {
                    return borders[index];
                }

                function nextIdentFill() {
                    index = (index + 1) % identityFills.length;
                    return identityFills[index];
                }

                function nextIdentBorder() {
                    return identityBorders[index];
                }

                tl.to(fills[0], {
                    morphSVG: {
                        shape: nextFill(),
                        shapeIndex: 0,
                        type: 'rotational',
                    },
                })
                    .to(
                        borders[0],
                        {
                            morphSVG: {
                                shape: nextBorder(),
                                shapeIndex: 0,
                            },
                        },
                        '<',
                    )
                    .to(
                        identityFills[0],
                        {
                            morphSVG: {
                                shape: nextIdentFill(),
                                shapeIndex: 0,
                                type: 'rotational',
                            },
                        },
                        '<',
                    )
                    .to(
                        identityBorders[0],
                        {
                            morphSVG: {
                                shape: nextIdentBorder(),
                                shapeIndex: 0,
                                type: 'rotational',
                            },
                        },
                        '<',
                    );
            }, containerRef);

            return () => ctx.revert();
        }, []);

        return (
            <div className={`${className}`} ref={ref}>
                {/*ini dipakai buat ref yang eskternal*/}
                <div ref={containerRef}>
                    <div className="relative flex h-[480px] w-[1200px] justify-center">
                        <DialogueBox1
                            className={`w-[2400px] ${classNameSizeBox}`}
                        />

                        <div
                            className={`absolute left-48 top-0 ${classNameIdentitySize}`}
                        >
                            <DialogueName1 className="w-[360px]" />

                            <div className="absolute left-[152px] top-[126px] -rotate-[16deg] font-noto text-4xl font-extrabold text-black">
                                Codie
                            </div>
                        </div>

                        <div className="hidden">
                            <DialogueBox2 />
                            <DialogueBox3 />
                        </div>

                        <div className="hidden">
                            <DialogueName2 />
                            <DialogueName3 />
                        </div>

                        <div
                            className={`absolute left-80 top-40 z-20 flex h-[200px] w-[700px] items-center font-arsenal text-4xl font-bold text-[#F0F2F5] ${classNameText}`}
                        >
                            <div className="w-full">{msg}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

export default DialogueBox;
