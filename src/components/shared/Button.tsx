import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'indigo' | 'success';
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    loading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyle = "transition-all duration-300 flex items-center justify-center cursor-pointer font-extrabold uppercase tracking-widest text-[10px] py-3.5 px-6 rounded-xl border border-transparent select-none";

    const variantStyles = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100",
        indigo: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100",
        secondary: "border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    };

    return (
        <button
            disabled={disabled || loading}
            className={`${baseStyle} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Cargando...</span>
                </div>
            ) : children}
        </button>
    );
};

export default Button;
