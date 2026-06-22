import type { ComponentType, SVGProps } from 'react';

type SvgButtonProps = {
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    onClick: () => void;
    className?: string;
    iconClassName?: string;
    ariaLabel?: string;
};

export default function Button({
    Icon,
    onClick,
    className = '',
    iconClassName = '',
    ariaLabel = 'button',
}: SvgButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={`transition duration-200 hover:scale-105 active:scale-95 ${className}`}
        >
            <Icon className={iconClassName} />
        </button>
    );
}
