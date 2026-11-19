import React from 'react';

export type KpiTone = 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'purple';
export type KpiVariant = 'white' | 'tinted';

export interface KpiCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon: React.ReactNode;
  tone?: KpiTone;
  variant?: KpiVariant;
  monoValue?: boolean;
  className?: string;
}

const whiteToneClasses: Record<
  KpiTone,
  { value: string; subtext: string; iconWrap: string }
> = {
  slate: {
    value: 'text-slate-900',
    subtext: 'text-slate-500',
    iconWrap: 'bg-slate-100 border-slate-200 text-slate-600',
  },
  indigo: {
    value: 'text-indigo-600',
    subtext: 'text-indigo-700/80',
    iconWrap: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  },
  emerald: {
    value: 'text-emerald-600',
    subtext: 'text-emerald-700/80',
    iconWrap: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  },
  amber: {
    value: 'text-amber-600',
    subtext: 'text-amber-700/80',
    iconWrap: 'bg-amber-50 border-amber-100 text-amber-600',
  },
  rose: {
    value: 'text-rose-600',
    subtext: 'text-rose-700/80',
    iconWrap: 'bg-rose-50 border-rose-100 text-rose-600',
  },
  violet: {
    value: 'text-violet-600',
    subtext: 'text-violet-700/80',
    iconWrap: 'bg-violet-50 border-violet-100 text-violet-600',
  },
  purple: {
    value: 'text-purple-600',
    subtext: 'text-purple-700/80',
    iconWrap: 'bg-purple-50 border-purple-100 text-purple-600',
  },
};

const tintedToneClasses: Record<
  KpiTone,
  { card: string; label: string; value: string; subtext: string; icon: string }
> = {
  slate: {
    card: 'bg-slate-50 border-slate-200',
    label: 'text-slate-500',
    value: 'text-slate-900',
    subtext: 'text-slate-600',
    icon: 'text-slate-500',
  },
  indigo: {
    card: 'bg-indigo-50/70 border-indigo-200',
    label: 'text-indigo-700',
    value: 'text-indigo-950',
    subtext: 'text-indigo-700/80',
    icon: 'text-indigo-600',
  },
  emerald: {
    card: 'bg-emerald-50/70 border-emerald-200',
    label: 'text-emerald-700',
    value: 'text-emerald-950',
    subtext: 'text-emerald-700/80',
    icon: 'text-emerald-600',
  },
  amber: {
    card: 'bg-amber-50/70 border-amber-200',
    label: 'text-amber-800',
    value: 'text-amber-950',
    subtext: 'text-amber-800/80',
    icon: 'text-amber-600',
  },
  rose: {
    card: 'bg-rose-50/70 border-rose-200',
    label: 'text-rose-700',
    value: 'text-rose-950',
    subtext: 'text-rose-700/80',
    icon: 'text-rose-600',
  },
  violet: {
    card: 'bg-violet-50/70 border-violet-200',
    label: 'text-violet-700',
    value: 'text-violet-950',
    subtext: 'text-violet-700/80',
    icon: 'text-violet-600',
  },
  purple: {
    card: 'bg-purple-50/70 border-purple-200',
    label: 'text-purple-700',
    value: 'text-purple-950',
    subtext: 'text-purple-700/80',
    icon: 'text-purple-600',
  },
};

/**
 * Tarjeta estandarizada de métrica KPI para banners de estadísticas y modales de auditoría.
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  tone = 'indigo',
  variant = 'white',
  monoValue = false,
  className = '',
}) => {
  if (variant === 'tinted') {
    const t = tintedToneClasses[tone];
    return (
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-2 ${t.card} ${className}`}>
        <div className="min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${t.label}`}>
            {label}
          </span>
          <div
            className={`text-xl font-black mt-0.5 tabular-nums ${t.value} ${
              monoValue ? 'font-mono' : ''
            }`}
          >
            {value}
          </div>
          {subtext !== undefined && (
            <span className={`text-[11px] font-semibold tabular-nums block ${t.subtext}`}>
              {subtext}
            </span>
          )}
        </div>
        <div className={`shrink-0 ${t.icon}`}>{icon}</div>
      </div>
    );
  }

  const w = whiteToneClasses[tone];
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between gap-2 ${className}`}
    >
      <div className="min-w-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`text-2xl font-black tracking-tight tabular-nums ${w.value} ${
              monoValue ? 'font-mono' : ''
            }`}
          >
            {value}
          </span>
          {subtext !== undefined && (
            <span className={`text-xs font-medium ${w.subtext}`}>{subtext}</span>
          )}
        </div>
      </div>
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${w.iconWrap}`}
      >
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;
