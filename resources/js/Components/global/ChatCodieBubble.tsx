import ChatCodie from '@/assets/global/CHATCODIE.webp';
import { forwardRef, type ReactNode } from 'react';

type ChatCodieBubbleProps = {
    text: ReactNode;
    className?: string;
    imgClassName?: string;
    textClassName?: string;
};

const ChatCodieBubble = forwardRef<HTMLDivElement, ChatCodieBubbleProps>(
    ({ text, className = '', imgClassName = '', textClassName = '' }, ref) => {
        return (
            <div
                ref={ref}
                className={`relative flex w-full shrink-0 justify-center ${className} `}
            >
                <img
                    src={ChatCodie}
                    alt=""
                    className={`block h-auto w-[99%] max-w-none shrink-0 ${imgClassName}`}
                />

                <h1
                    className={`absolute right-[6%] top-[40%] w-[53%] text-start font-arsenal text-[90%] font-bold leading-tight text-[#F0F2F5] ${textClassName}`}
                >
                    {text}
                </h1>
            </div>
        );
    },
);

ChatCodieBubble.displayName = 'ChatCodieBubble';

export default ChatCodieBubble;
