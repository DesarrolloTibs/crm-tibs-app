import React, { useCallback, useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { Bell } from 'lucide-react';

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

/* ── Sub-componente: chip de recordatorio en el calendario ────────────────── */

const ReminderEventCard: React.FC<{ eventInfo: EventContentArg }> = ({ eventInfo }) => {
    return (
        <div
            className="flex items-start gap-1 px-1 sm:px-1.5 py-0.5 rounded-md w-full h-auto min-h-full shadow-sm border border-amber-300"
            style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
            <Bell size={10} className="flex-shrink-0 mt-0.5 hidden sm:block" style={{ color: '#d97706' }} />
            <span className="text-[10px] sm:text-xs font-semibold break-words line-clamp-2 leading-tight">
                {eventInfo.event.title}
            </span>
        </div>
    );
};

/* ── Componente ───────────────────────────────────────────────────────────── */

/**
 * Vista de calendario de actividades estilo Google Calendar.
 * Muestra:
 *  - Actividades → chips de color según tipo
 *  - Recordatorios → chips amber separados en su propia fecha/hora
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /* ── Eventos de actividades ──────────────────────────────────────────── */
    const activityEvents = activities.map((activity) => ({
        id: `activity-${activity.id}`,
        title: activity.activity,
        start: activity.date,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        extendedProps: { type: 'activity', activity },
        color: getActivityColor(activity.typeActivity?.strname).bg,
    }));

    /* ── Eventos de recordatorios (fecha propia del reminder) ────────────── */
    const reminderEvents = activities
        .filter((a) => !!a.reminder)
        .map((activity) => ({
            id: `reminder-${activity.id}`,
            title: activity.reminder!.title,
            start: activity.reminder!.date,
            backgroundColor: '#fef3c7',
            borderColor: '#fcd34d',
            textColor: '#92400e',
            extendedProps: { type: 'reminder', activity },
        }));

    const events = [...activityEvents, ...reminderEvents];

    /* ── Handlers ───────────────────────────────────────────────────────── */

    const handleEventClick = useCallback((info: EventClickArg) => {
        const activity = info.event.extendedProps.activity as Activity;

        // Los recordatorios abren el popover de su actividad (para editar/eliminar)
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
        (eventInfo: EventContentArg) => {
            const eventType = eventInfo.event.extendedProps.type as string;
            if (eventType === 'reminder') {
                return <ReminderEventCard eventInfo={eventInfo} />;
            }
            return <ActivityEventCard eventInfo={eventInfo} />;
        },
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
                    initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
                    locale={esLocale}
                    views={{
                        timeGridWeek: {
                            type: 'timeGrid',
                            duration: { days: isMobile ? 3 : 7 }
                        }
                    }}
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
                        timeGridWeek: 'Semana',
                        timeGridDay: 'Día',
                        listWeek: 'Agenda',
                    }}
                    events={events}
                    selectable
                    selectMirror
                    dayMaxEvents={isMobile ? 2 : 4}
                    weekends
                    nowIndicator
                    eventMaxStack={3}
                    slotEventOverlap={false}
                    eventMinHeight={26}
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
