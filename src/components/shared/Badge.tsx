import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'indigo' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error:   'bg-rose-50 text-rose-700 border border-rose-200',
  info:    'bg-sky-50 text-sky-700 border border-sky-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  indigo:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  purple:  'bg-purple-50 text-purple-700 border border-purple-200',
};

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
  info:    'bg-sky-500',
  neutral: 'bg-slate-400',
  indigo:  'bg-indigo-500',
  purple:  'bg-purple-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 font-bold tracking-wide',
  md: 'text-xs px-2.5 py-1 font-semibold',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  dot = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
