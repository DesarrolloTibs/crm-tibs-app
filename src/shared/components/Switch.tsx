import React from 'react';

export type SwitchColor = 'indigo' | 'emerald' | 'blue';
export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  name?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  statusLabel?: React.ReactNode;
  disabled?: boolean;
  color?: SwitchColor;
  size?: SwitchSize;
  title?: string;
  className?: string;
}

const colorClasses: Record<SwitchColor, string> = {
  indigo: 'peer-checked:bg-indigo-600 peer-focus:ring-indigo-600',
  emerald: 'peer-checked:bg-emerald-600 peer-focus:ring-emerald-600',
  blue: 'peer-checked:bg-blue-600 peer-focus:ring-blue-500',
};

const sizeClasses: Record<SwitchSize, { track: string; thumb: string }> = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'after:top-0.5 after:left-0.5 after:h-4 after:w-4 peer-checked:after:translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb:
      'after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:border after:border-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white',
  },
  lg: {
    track: 'w-14 h-7',
    thumb:
      'after:top-[2px] after:left-[2px] after:h-6 after:w-6 after:border after:border-slate-300 peer-checked:after:translate-x-full peer-checked:after:border-white',
  },
};

/**
 * Interruptor booleano accesible reutilizable (soporta modo compacto inline o tarjeta descriptiva).
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  id,
  name,
  label,
  description,
  statusLabel,
  disabled = false,
  color = 'indigo',
  size = 'md',
  title,
  className = '',
}) => {
  const controlSize = sizeClasses[size];
  const controlColor = colorClasses[color];

  const toggleEl = (
    <label
      htmlFor={id}
      title={title}
      className={`relative inline-flex items-center shrink-0 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${!label && !description ? className : ''}`}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div
        className={`${controlSize.track} bg-slate-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer after:content-[''] after:absolute after:bg-white after:rounded-full after:transition-all ${controlSize.thumb} ${controlColor}`}
      />
      {statusLabel !== undefined && (
        <span className="ml-3 text-xs font-bold text-slate-700">{statusLabel}</span>
      )}
    </label>
  );

  if (!label && !description) {
    return toggleEl;
  }

  return (
    <div
      className={`p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 ${className}`}
    >
      <div className="space-y-0.5 min-w-0">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-bold text-slate-800 cursor-pointer select-none block"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="mt-0.5 shrink-0">{toggleEl}</div>
    </div>
  );
};

export default Switch;
