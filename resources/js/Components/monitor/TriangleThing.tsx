import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import TriangleThingSvg from '@/assets/monitor/trianglething.svg';

type TriangleThingProps = {
    size?: string;
    className?: string;
};

export default function TriangleThing({
    size = '7rem',
    className = '',
}: TriangleThingProps) {
    const shapeRef = useRef<HTMLImageElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(shapeRef.current, {
                scale: 1.28,
                duration: 1.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <img
            ref={shapeRef}
            src={TriangleThingSvg}
            alt="Triangle Thing"
            style={{ width: size }}
            className={`h-auto ${className}`}
        />
    );
}
