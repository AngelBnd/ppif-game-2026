import InputBackground from '@/assets/phone/InputJawaban.svg';
import { forwardRef, type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    wrapperClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', wrapperClassName = '', ...props }, ref) => {
        return (
            <div className={`relative w-[19.375rem] max-w-full ${wrapperClassName}`}>
                <img
                    src={InputBackground}
                    alt=""
                    className="block h-auto w-full"
                />
                <input
                    ref={ref}
                    {...props}
                    className={`absolute inset-0 h-full w-full appearance-none border-0 bg-[#0A0C0F] text-center font-arsenal text-base text-white outline-none [clip-path:polygon(13%_20%,88%_28%,84%_78%,18%_84%)] placeholder:font-arsenal placeholder:text-[#5B5B5B] ${className}`}
                />
            </div>
        );
    },
);

Input.displayName = 'Input';

export default Input;
