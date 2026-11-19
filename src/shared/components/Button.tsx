import React from 'react';
import Loader from './Loader';

export type ButtonVariant =
  | 'primary'
  | 'indigo'
  | 'success'
  | 'danger'
  | 'secondary'
  | 'ghost'
  | 'ghost-danger'
  | 'icon';

export type ButtonSize = 'default' | 'sm' | 'xs';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  loadingText = 'Cargando...',
  className = '',
  disabled,
  ...props
}) => {
  // ghost, ghost-danger e icon tienen su propia base para no heredar py-3.5/px-6 gigantes
  const isCompact = variant === 'ghost' || variant === 'ghost-danger' || variant === 'icon';

  const sizeStyle =
    size === 'xs'
      ? 'inline-flex items-center justify-center gap-1 font-bold text-xs py-1.5 px-2.5 rounded-lg border border-transparent select-none'
      : size === 'sm'
      ? 'inline-flex items-center justify-center gap-1.5 font-semibold text-xs py-2 px-3.5 rounded-lg border border-transparent select-none'
      : 'flex items-center justify-center font-extrabold uppercase tracking-widest text-[10px] py-3.5 px-6 rounded-xl border border-transparent select-none';

  const baseStyle = isCompact
    ? 'transition-all duration-200 inline-flex items-center justify-center cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed'
    : `transition-all duration-300 cursor-pointer ${sizeStyle}`;

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100',
    indigo:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100',
    success:
      'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:scale-100',
    secondary:
      'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed',
    /** Botón de texto/enlace sin fondo, con hover sutil */
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-2 py-1.5 text-xs font-semibold',
    /** Variante ghost para acciones destructivas (limpiar, eliminar) */
    'ghost-danger': 'text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2 py-1.5 text-xs font-semibold',
    /** Botón cuadrado/redondo solo con icono */
    icon: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5',
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader inline size="xs" colorClassName="text-current" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
