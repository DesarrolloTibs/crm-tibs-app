import React from 'react';
import { Smartphone, Instagram, Facebook, Globe, User } from 'lucide-react';

export type OpportunityChannel = 'whatsapp' | 'facebook' | 'instagram' | 'webchat' | 'manual' | string;

interface OpportunityChannelBadgeProps {
  channel?: OpportunityChannel | null;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const getChannelMeta = (rawChannel?: string | null) => {
  const ch = (rawChannel || 'manual').toLowerCase().trim();

  switch (ch) {
    case 'whatsapp':
      return {
        id: 'whatsapp',
        label: 'WhatsApp',
        sublabel: 'IA',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200/80',
        dot: 'bg-emerald-500',
        icon: Smartphone,
      };
    case 'instagram':
      return {
        id: 'instagram',
        label: 'Instagram',
        sublabel: 'IA',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200/80',
        dot: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
        icon: Instagram,
      };
    case 'facebook':
    case 'messenger':
      return {
        id: 'facebook',
        label: 'Facebook',
        sublabel: 'IA',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200/80',
        dot: 'bg-blue-600',
        icon: Facebook,
      };
    case 'webchat':
      return {
        id: 'webchat',
        label: 'Webchat',
        sublabel: 'IA',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200/80',
        dot: 'bg-indigo-600',
        icon: Globe,
      };
    case 'manual':
    default:
      return {
        id: 'manual',
        label: 'Manual',
        sublabel: 'CRM',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        icon: User,
      };
  }
};

export const OpportunityChannelBadge: React.FC<OpportunityChannelBadgeProps> = ({
  channel,
  size = 'xs',
  showLabel = true,
  className = '',
}) => {
  const meta = getChannelMeta(channel);
  const Icon = meta.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs transition-colors shrink-0 ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses} ${className}`}
      title={`Origen de cotización: ${meta.label} (${meta.sublabel})`}
    >
      <Icon size={iconSizes} className="shrink-0" />
      {showLabel && (
        <span className="truncate">
          {meta.label}
          {meta.sublabel === 'IA' && (
            <span className="ml-0.5 text-[8px] font-bold opacity-75">IA</span>
          )}
        </span>
      )}
    </span>
  );
};

export default OpportunityChannelBadge;
