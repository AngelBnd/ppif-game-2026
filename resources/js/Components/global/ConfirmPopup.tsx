import Holdup from '@/assets/svgs/Holdup.svg';
import PopupBox from '@/assets/svgs/PopupBox.svg';
import type { ReactNode } from 'react';

type ConfirmPopupProps = {
    message: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmDisabled?: boolean;
    cancelDisabled?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    // Sizing/position varies a lot between where this is used (e.g. the
    // admin's large desktop popup vs the player's small phone popup), so
    // every piece is left to the caller rather than baked in as a default
    // that would need overriding (same-property Tailwind classes don't
    // reliably override each other based on JSX order).
    boxClassName?: string;
    holdupClassName?: string;
    popupBoxClassName?: string;
    contentClassName?: string;
    messageClassName?: string;
    buttonsClassName?: string;
    buttonClassName?: string;
};

export default function ConfirmPopup({
    message,
    onConfirm,
    onCancel,
    confirmDisabled = false,
    cancelDisabled = false,
    confirmLabel = 'IYA!!!',
    cancelLabel = 'TIDAK',
    boxClassName = '',
    holdupClassName = '',
    popupBoxClassName = '',
    contentClassName = '',
    messageClassName = '',
    buttonsClassName = '',
    buttonClassName = '',
}: ConfirmPopupProps) {
    return (
        <div className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-black/70 px-4">
            <div className={`relative animate-pop-in ${boxClassName}`}>
                <img
                    className={`absolute z-40 block h-auto ${holdupClassName}`}
                    src={Holdup}
                    alt=""
                />
                <img
                    className={`relative ${popupBoxClassName}`}
                    src={PopupBox}
                    alt=""
                />

                <div
                    className={`absolute left-1/2 flex -translate-x-1/2 flex-col ${contentClassName}`}
                >
                    <div
                        className={`z-50 text-center font-arsenal font-bold ${messageClassName}`}
                    >
                        {message}
                    </div>

                    <div
                        className={`flex justify-center font-noto font-bold ${buttonsClassName}`}
                    >
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={cancelDisabled}
                            className={`transition-transform duration-150 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={confirmDisabled}
                            className={`transition-transform duration-150 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
