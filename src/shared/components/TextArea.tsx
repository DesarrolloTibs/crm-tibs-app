import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full py-3.5 px-4 rounded-2xl text-slate-900 text-sm font-medium transition-all duration-300 border border-slate-200 outline-none hover:border-slate-300 focus:border-indigo-600 focus:bg-white focus:shadow-xl focus:shadow-indigo-500/10 placeholder:text-slate-400 placeholder:font-medium min-h-[90px] ${
                    error ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500' : ''
                } ${className}`}
                {...props}
            />
            {error && (
                <p className="text-rose-600 text-[10px] font-medium mt-1 ml-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default TextArea;
