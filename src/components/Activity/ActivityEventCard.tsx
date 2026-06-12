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
 */
const ActivityEventCard: React.FC<Props> = ({ eventInfo }) => {
    const activity = eventInfo.event.extendedProps.activity as Activity;
    const color = getActivityColor(activity.typeActivity?.strname);

    return (
        <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md overflow-hidden w-full h-full"
            style={{ backgroundColor: color.bg, color: color.text }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.65)' }}
            />
            <span className="text-xs font-semibold truncate leading-tight">
                {eventInfo.event.title}
            </span>
        </div>
    );
};

export default ActivityEventCard;
