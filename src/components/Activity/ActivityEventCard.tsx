import React from 'react';
import type { EventContentArg } from '@fullcalendar/core';
import type { Activity } from '../../core/models/Activity';
import { getActivityColor } from './activityColors';

interface Props {
    eventInfo: EventContentArg;
}

/**
 * Chip de evento que se renderiza dentro de cada casilla del calendario.
 * Aplica el color del tipo de actividad directamente via inline style
 * para garantizar que Tailwind CSS no lo sobreescriba.
 * Muestra una campanita si la actividad tiene un recordatorio.
 */
const ActivityEventCard: React.FC<Props> = ({ eventInfo }) => {
    const activity = eventInfo.event.extendedProps.activity as Activity;
    const color = getActivityColor(activity.typeActivity?.strname);

    const getProviderLogo = (provider?: string | null) => {
        if (!provider) return null;
        if (provider === 'google') {
            return (
                <span className="shrink-0 flex" title="Sincronizado con Google Calendar">
                    <svg className="w-3.5 h-3.5 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.47-.83-1.03-1.03-1.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                </span>
            );
        }
        if (provider === 'outlook') {
            return (
                <span className="shrink-0 flex" title="Sincronizado con Outlook">
                    <svg className="w-3.5 h-3.5 mt-0.5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022"/>
                      <rect x="12.5" y="0" width="10.5" height="10.5" fill="#7FBA00"/>
                      <rect x="0" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
                      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
                    </svg>
                </span>
            );
        }
        if (provider === 'icloud') {
            return (
                <span className="shrink-0 flex" title="Sincronizado con iCloud">
                    <svg className="w-3.5 h-3.5 text-sky-500 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 19A5.5 5.5 0 0 0 19 8.2c-.3 0-.6 0-.9.1A8 8 0 0 0 3 11.5c0 .3 0 .6.1.9A6 6 0 0 0 5.5 24H17.5z" fill="#0EA5E9" opacity="0.1" />
                      <path d="M17.5 19A5.5 5.5 0 0 0 19 8.2c-.3 0-.6 0-.9.1A8 8 0 0 0 3 11.5c0 .3 0 .6.1.9A6 6 0 0 0 5.5 24H17.5z" stroke="#0EA5E9" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                </span>
            );
        }
        return null;
    };

    return (
        <div
            className="flex items-start gap-1 px-1.5 py-1 rounded-md w-full h-auto min-h-full shadow-sm border border-black/5 border-l-4"
            style={{ backgroundColor: color.bg, color: color.text, borderLeftColor: color.border }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 hidden sm:inline-block"
                style={{ backgroundColor: color.border }}
            />
            <span className="text-[10px] sm:text-xs font-semibold break-words line-clamp-2 leading-tight flex-1">
                {eventInfo.event.title}
            </span>
            {getProviderLogo(activity.externalProvider)}
        </div>
    );
};

export default ActivityEventCard;
