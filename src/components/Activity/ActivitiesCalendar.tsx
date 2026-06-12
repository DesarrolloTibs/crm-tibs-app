import React, { useCallback, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';

import type { Activity, TypeActivity } from '../../core/models/Activity';
import { getActivityColor } from './activityColors';
import ActivityTypeLegend from './ActivityTypeLegend';
import ActivityEventCard from './ActivityEventCard';
import ActivityPopover from './ActivityPopover';
import './calendar.css';

/* ── Tipos ────────────────────────────────────────────────────────────────── */

interface Props {
    activities: Activity[];
    activityTypes: TypeActivity[];
    onEdit: (activity: Activity) => void;
    onDelete: (activity: Activity) => void;
    onCreateWithDate: (date: string) => void;
}

interface PopoverState {
    visible: boolean;
    activity: Activity | null;
    position: { x: number; y: number };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Convierte un Date al formato que espera datetime-local: "YYYY-MM-DDTHH:mm"
 * sin desplazamiento de zona horaria.
 */
const toLocalDateTimeString = (date: Date): string => {
    const copy = new Date(date);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().slice(0, 16);
};

/* ── Componente ───────────────────────────────────────────────────────────── */

/**
 * Vista de calendario de actividades estilo Google Calendar.
 * Orquesta los sub-componentes: ActivityTypeLegend, ActivityEventCard, ActivityPopover.
 */
const ActivitiesCalendar: React.FC<Props> = ({
    activities,
    activityTypes,
    onEdit,
    onDelete,
    onCreateWithDate,
}) => {
    const calendarRef = useRef<FullCalendar>(null);
    const [popover, setPopover] = useState<PopoverState>({
        visible: false,
        activity: null,
        position: { x: 0, y: 0 },
    });

    /* Convertir actividades al formato de FullCalendar.
       backgroundColor/borderColor se pasan en 'transparent' porque el color
       lo aplica directamente ActivityEventCard via inline style. */
    const events = activities.map((activity) => ({
        id: activity.id,
        title: activity.activity,
        start: activity.date,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        extendedProps: { activity },
        // Necesario para la vista de Lista, que usa el dot de color
        color: getActivityColor(activity.typeActivity?.strname).bg,
    }));

    /* ── Handlers ───────────────────────────────────────────────────────── */

    const handleEventClick = useCallback((info: EventClickArg) => {
        const activity = info.event.extendedProps.activity as Activity;
        const rect = info.el.getBoundingClientRect();
        setPopover({
            visible: true,
            activity,
            position: { x: rect.left + rect.width / 2, y: rect.bottom },
        });
    }, []);

    const handleDateSelect = useCallback(
        (info: DateSelectArg) => {
            onCreateWithDate(toLocalDateTimeString(info.start));
            calendarRef.current?.getApi().unselect();
        },
        [onCreateWithDate],
    );

    const handlePopoverEdit = useCallback(() => {
        if (popover.activity) {
            onEdit(popover.activity);
            setPopover((prev) => ({ ...prev, visible: false }));
        }
    }, [popover.activity, onEdit]);

    const handlePopoverDelete = useCallback(() => {
        if (popover.activity) {
            onDelete(popover.activity);
            setPopover((prev) => ({ ...prev, visible: false }));
        }
    }, [popover.activity, onDelete]);

    const closePopover = useCallback(() => {
        setPopover((prev) => ({ ...prev, visible: false }));
    }, []);

    /* ── Render de evento personalizado ─────────────────────────────────── */

    const renderEventContent = useCallback(
        (eventInfo: EventContentArg) => <ActivityEventCard eventInfo={eventInfo} />,
        [],
    );

    /* ── JSX ─────────────────────────────────────────────────────────────── */

    return (
        <div className="relative">
            <ActivityTypeLegend activityTypes={activityTypes} />

            <div className="tibs-calendar bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                    }}
                    buttonText={{
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        list: 'Agenda',
                    }}
                    events={events}
                    selectable
                    selectMirror
                    dayMaxEvents={4}
                    weekends
                    nowIndicator
                    eventMaxStack={3}
                    contentHeight={680}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    eventContent={renderEventContent}
                    moreLinkContent={(args) => `+${args.num} más`}
                />
            </div>

            {popover.visible && popover.activity && (
                <ActivityPopover
                    activity={popover.activity}
                    position={popover.position}
                    onEdit={handlePopoverEdit}
                    onDelete={handlePopoverDelete}
                    onClose={closePopover}
                />
            )}
        </div>
    );
};

export default ActivitiesCalendar;
