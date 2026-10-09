import { Smartphone, MessageSquare, Layers, MessageCircle, Sparkles, Activity } from 'lucide-react';

/**
 * Normaliza cadenas de texto para búsqueda: elimina mayúsculas y diacríticos/acentos.
 */
export const normalizeSearchText = (val?: string | null): string => {
  if (!val) return '';
  return val
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Formateo estándar de números con formato regional es-MX.
 */
export const formatNumber = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('es-MX').format(val);
};

/**
 * Abreviación compacta de recursos / tokens (ej. 1.2M, 45.3K).
 */
export const formatTokensCompact = (tokens?: number | null): string => {
  if (!tokens || isNaN(tokens)) return '0';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return formatNumber(tokens);
};

/**
 * Formateo amigable de fecha (ej. "25 de septiembre de 2026").
 */
export const formatFriendlyDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'No programada';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formato corto de fecha (para timeline diario ej. "vie, 25 sept").
 */
export const formatShortDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Formato completo de fecha y hora (ej. "25 sept 2026, 17:30:15").
 */
export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Formato conciso de fecha para ciclos (ej. "25/09/2026").
 */
export const formatCycleDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Cálculo de días restantes de vigencia de renovación.
 */
export const getRenewalDays = (
  renewalDateStr?: string | null
): { days: number; text: string; variant: 'neutral' | 'warning' | 'error' } | null => {
  if (!renewalDateStr) return null;
  const renewal = new Date(renewalDateStr);
  if (isNaN(renewal.getTime())) return null;

  const now = new Date();
  const diffTime = renewal.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, text: `Venció hace ${Math.abs(diffDays)} días`, variant: 'error' };
  }
  if (diffDays === 0) {
    return { days: 0, text: 'Vence hoy', variant: 'warning' };
  }
  if (diffDays <= 5) {
    return { days: diffDays, text: `${diffDays} días restantes`, variant: 'warning' };
  }
  return { days: diffDays, text: `${diffDays} días restantes`, variant: 'neutral' };
};

/**
 * Mapeo de metadatos e iconos de canales orientados al negocio.
 */
export const getChannelMeta = (channel: string) => {
  switch (channel?.toLowerCase()) {
    case 'whatsapp':
      return {
        label: 'WhatsApp',
        icon: <Smartphone size={14} className="text-emerald-600" />,
        badgeVariant: 'success' as const,
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        barColor: 'bg-emerald-500',
      };
    case 'webchat_interno':
    case 'webchat':
      return {
        label: 'Webchat CRM',
        icon: <MessageSquare size={14} className="text-indigo-600" />,
        badgeVariant: 'indigo' as const,
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-700',
        barColor: 'bg-indigo-600',
      };
    case 'rag':
      return {
        label: 'Base de Conocimiento',
        icon: <Layers size={14} className="text-amber-600" />,
        badgeVariant: 'warning' as const,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        barColor: 'bg-amber-500',
      };
    case 'messenger':
      return {
        label: 'Messenger',
        icon: <MessageCircle size={14} className="text-sky-600" />,
        badgeVariant: 'info' as const,
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        textColor: 'text-sky-700',
        barColor: 'bg-sky-500',
      };
    case 'instagram':
      return {
        label: 'Instagram',
        icon: <Sparkles size={14} className="text-pink-600" />,
        badgeVariant: 'purple' as const,
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        textColor: 'text-pink-700',
        barColor: 'bg-pink-500',
      };
    default:
      return {
        label: channel || 'General',
        icon: <Activity size={14} className="text-slate-600" />,
        badgeVariant: 'neutral' as const,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-700',
        barColor: 'bg-slate-500',
      };
  }
};

/**
 * Mapeo de conceptos técnicos de backend a nombres amigables de negocio.
 */
export const getActionDisplay = (action?: string | null): { label: string; badgeClass: string } => {
  const act = (action || '').toLowerCase().trim();
  if (act.includes('rag') || act.includes('ingest') || act.includes('doc')) {
    return { label: 'Consulta a Base de Conocimiento', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (act.includes('router') || act.includes('clasif') || act.includes('atencion_inicial')) {
    return { label: 'Atención Inicial & Enrutamiento', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' };
  }
  if (act.includes('comercial') || act.includes('subagent')) {
    return { label: 'Asesor Comercial', badgeClass: 'bg-purple-50 text-purple-800 border-purple-200' };
  }
  if (act.includes('rescue') || act.includes('deriv')) {
    return { label: 'Derivación a Asesor', badgeClass: 'bg-teal-50 text-teal-800 border-teal-200' };
  }
  if (act.includes('soporte') || act.includes('ticket')) {
    return { label: 'Atención de Soporte', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' };
  }
  if (act === 'inferencia' || act === 'default' || !act) {
    return { label: 'Respuesta del Asistente', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
  }
  const formatted = act.replace(/_/g, ' ').replace(/-/g, ' ');
  return {
    label: formatted.charAt(0).toUpperCase() + formatted.slice(1),
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };
};

/**
 * Iniciales de usuario a partir de su nombre.
 */
export const getUserInitials = (name?: string | null): string => {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/**
 * Comprueba si dos fechas corresponden al mismo día calendario.
 * Soporta cadenas ISO ("2026-08-26T17:30:51.000Z"), YYYY-MM-DD ("2026-08-26") y formatos con espacio.
 */
export const isSameDay = (dateStr1?: string | null, dateStr2?: string | null): boolean => {
  if (!dateStr1 || !dateStr2) return false;

  // 1. Comparación rápida por prefijo YYYY-MM-DD si ambas fechas lo contienen
  const ymd1 = dateStr1.slice(0, 10);
  const ymd2 = dateStr2.slice(0, 10);
  if (ymd1 === ymd2 && /^\d{4}-\d{2}-\d{2}$/.test(ymd1)) {
    return true;
  }

  // 2. Comparación mediante objeto Date en caso de divergencias de formato o zona horaria
  const parseToDate = (str: string): Date => {
    if (str.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return new Date(`${str}T12:00:00`);
    }
    return new Date(str);
  };

  const d1 = parseToDate(dateStr1);
  const d2 = parseToDate(dateStr2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return false;
  }

  // Compara año, mes y día en tiempo local
  if (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  ) {
    return true;
  }

  // O en tiempo UTC
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
};

