import React from 'react';
import type { CalendarProviderConfig } from '../schemas/myCalendar.schema';

/**
 * Icono SVG oficial de Google Calendar
 */
export const GoogleCalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-5.5 h-5.5' }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.47-.83-1.03-1.03-1.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

/**
 * Icono SVG oficial de Microsoft Outlook / 365
 */
export const OutlookCalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-5.5 h-5.5' }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="0" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
);

/**
 * Catálogo de configuración de proveedores soportados (Google y Outlook)
 */
export const CALENDAR_PROVIDERS: CalendarProviderConfig[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    tagline: 'Google Workspace & Gmail',
    description: 'Vincula tus actividades del CRM automáticamente con tu cuenta personal o empresarial de Google Calendar.',
    authType: 'oauth',
    enabled: true,
    iconBg: 'bg-blue-50',
    activeBorderColor: 'border-blue-500',
    activeRingColor: 'ring-blue-500/10',
    accentColor: 'text-blue-600',
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    tagline: 'Microsoft 365 & Outlook',
    description: 'Sincroniza tus citas comerciales con tu calendario corporativo de Microsoft Exchange o Outlook personal.',
    authType: 'oauth',
    enabled: true,
    iconBg: 'bg-sky-50',
    activeBorderColor: 'border-sky-500',
    activeRingColor: 'ring-sky-500/10',
    accentColor: 'text-sky-600',
  },
];

/**
 * Obtener metadatos y configuración de un proveedor por ID
 */
export const getProviderMeta = (providerId?: string): CalendarProviderConfig | undefined => {
  if (!providerId) return undefined;
  return CALENDAR_PROVIDERS.find((p) => p.id === providerId);
};

/**
 * Renderizador de icono de proveedor
 */
export const renderProviderIcon = (providerId?: string, className?: string): React.ReactNode => {
  switch (providerId) {
    case 'google':
      return <GoogleCalendarIcon className={className} />;
    case 'outlook':
      return <OutlookCalendarIcon className={className} />;
    default:
      return null;
  }
};
