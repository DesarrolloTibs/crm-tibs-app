import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    inputPrefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    inputPrefix,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                    {label}
                </label>
            )}
            <div className="relative">
                {inputPrefix && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                        {inputPrefix}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`w-full py-4 rounded-2xl text-slate-900 text-sm font-medium transition-all duration-300 border border-slate-200 outline-none hover:border-slate-300 focus:border-indigo-600 focus:bg-white focus:shadow-xl focus:shadow-indigo-500/10 placeholder:text-slate-400 placeholder:font-medium pr-4 ${
                        inputPrefix ? 'pl-8' : 'pl-4'
                    } ${
                        error ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500' : ''
                    } ${className}`}
                    {...props}
                    value={props.value === null ? '' : props.value}
                />

            </div>
            {error && (
                <p className="text-rose-600 text-[10px] font-medium mt-1 ml-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
