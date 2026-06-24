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

    return (
        <div
            className="flex items-start gap-1 px-1.5 py-1 rounded-md w-full h-auto min-h-full shadow-sm border border-black/5 border-l-4"
            style={{ backgroundColor: color.bg, color: color.text, borderLeftColor: color.border }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 hidden sm:inline-block"
                style={{ backgroundColor: color.border }}
            />
            <span className="text-[10px] sm:text-xs font-semibold break-words line-clamp-2 leading-tight">
                {eventInfo.event.title}
            </span>
        </div>
    );
};

export default ActivityEventCard;
