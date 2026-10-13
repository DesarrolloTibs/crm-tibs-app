import React from 'react';
import {
  WhatsAppLogo,
  InstagramLogo,
  FacebookLogo,
  WebchatLogo,
  ManualCrmLogo,
} from '../../../components/shared/ChannelIcons';
export type { ChannelIconProps } from '../../../components/shared/ChannelIcons';
export {
  WhatsAppLogo,
  InstagramLogo,
  FacebookLogo,
  WebchatLogo,
  ManualCrmLogo,
};

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
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        hoverBg: 'hover:bg-emerald-100',
        solidBg: 'bg-emerald-500 text-white',
        dot: 'bg-emerald-500',
        icon: WhatsAppLogo,
        tooltip: 'Origen: WhatsApp (Cotización generada por Agente de IA)',
      };
    case 'instagram':
      return {
        id: 'instagram',
        label: 'Instagram',
        sublabel: 'IA',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        hoverBg: 'hover:bg-rose-100',
        solidBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white',
        dot: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
        icon: InstagramLogo,
        tooltip: 'Origen: Instagram Direct (Cotización generada por Agente de IA)',
      };
    case 'facebook':
    case 'messenger':
      return {
        id: 'facebook',
        label: 'Facebook',
        sublabel: 'IA',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hoverBg: 'hover:bg-blue-100',
        solidBg: 'bg-[#1877F2] text-white',
        dot: 'bg-[#1877F2]',
        icon: FacebookLogo,
        tooltip: 'Origen: Facebook Messenger (Cotización generada por Agente de IA)',
      };
    case 'webchat':
      return {
        id: 'webchat',
        label: 'Webchat',
        sublabel: 'IA',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        hoverBg: 'hover:bg-indigo-100',
        solidBg: 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white',
        dot: 'bg-indigo-600',
        icon: WebchatLogo,
        tooltip: 'Origen: Webchat (Cotización generada por Widget de IA)',
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
        hoverBg: 'hover:bg-slate-100',
        solidBg: 'bg-slate-600 text-white',
        dot: 'bg-slate-400',
        icon: ManualCrmLogo,
        tooltip: 'Origen: Manual / CRM (Cotización creada por asesor comercial)',
      };
  }
};

export const OpportunityChannelBadge: React.FC<OpportunityChannelBadgeProps> = ({
  channel,
  size = 'xs',
  showLabel = false,
  className = '',
}) => {
  const meta = getChannelMeta(channel);
  const Icon = meta.icon;

  // Tamaños cuando se muestra sólo el icono/logo
  const iconOnlySizes = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
  }[size];

  // Tamaños cuando se muestra icono + texto (píldora completa)
  const pillSizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  // Tamaño numérico del SVG
  const svgSizes = {
    xs: 11,
    sm: 13,
    md: 15,
  }[size];

  // Renderizado modo sólo icono/logo (en las oportunidades)
  if (!showLabel) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border shadow-2xs transition-all duration-200 hover:scale-110 hover:shadow-xs cursor-help shrink-0 ${meta.bg} ${meta.text} ${meta.border} ${meta.hoverBg} ${iconOnlySizes} ${className}`}
        title={meta.tooltip}
        aria-label={meta.tooltip}
      >
        <Icon size={svgSizes} className="shrink-0" />
      </span>
    );
  }

  // Renderizado con etiqueta de texto completa
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs transition-colors shrink-0 ${meta.bg} ${meta.text} ${meta.border} ${pillSizes} ${className}`}
      title={meta.tooltip}
      aria-label={meta.tooltip}
    >
      <Icon size={svgSizes} className="shrink-0" />
      <span className="truncate">
        {meta.label}
        {meta.sublabel === 'IA' && (
          <span className="ml-1 text-[8px] font-bold px-1 py-0.2 bg-white/80 rounded border border-current opacity-85">
            IA
          </span>
        )}
      </span>
    </span>
  );
};

export default OpportunityChannelBadge;
