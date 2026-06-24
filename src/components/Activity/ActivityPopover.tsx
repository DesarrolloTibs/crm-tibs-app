import React from 'react';
import { X, Calendar, Clock, User, Briefcase, Edit, Trash2, Building, Bell } from 'lucide-react';
import type { Activity } from '../../core/models/Activity';
import { getActivityColor } from './activityColors';

interface Props {
    activity: Activity;
    position: { x: number; y: number };
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

/* ── Sub-componentes internos ─────────────────────────────────────────────── */

interface DetailRowProps {
    icon: React.ReactNode;
    children: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, children }) => (
    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 w-full min-w-0">
        <span className="text-indigo-500 flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0 break-words whitespace-normal leading-normal">{children}</div>
    </div>
);

/* ── Componente principal ─────────────────────────────────────────────────── */

/**
 * Popover que aparece al hacer click en un evento del calendario.
 * Muestra los detalles de la actividad y botones de editar / eliminar.
 */
const ActivityPopover: React.FC<Props> = ({ activity, onEdit, onDelete, onClose }) => {
    const typeName = activity.typeActivity?.strname;
    const color = getActivityColor(typeName);

    const formattedDate = new Date(activity.date).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = new Date(activity.date).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            {/* Overlay/Backdrop oscuro para todos los tamaños */}
            <div className="fixed inset-0 z-40 bg-black/45 transition-opacity animate-fade-in" onClick={onClose} />

            {/* Popover Centrado en Pantalla */}
            <div
                className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 w-[90vw] max-w-[340px] md:w-80 overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-up"
            >
                {/* Header con el color del tipo de actividad */}
                <div
                    className="px-4 py-3 flex items-center justify-between border-b"
                    style={{ backgroundColor: color.bg, borderColor: color.border }}
                >
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: color.text }}>
                        {typeName || 'Sin tipo'}
                    </span>
                    <button
                        onClick={onClose}
                        className="transition-colors rounded-full p-0.5 hover:bg-black/10"
                        style={{ color: color.text }}
                        aria-label="Cerrar"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Cuerpo con detalles */}
                <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-[0.95rem] leading-snug break-words line-clamp-4" title={activity.activity}>
                        {activity.activity}
                    </h3>

                    <div className="space-y-2">
                        <DetailRow icon={<Calendar size={14} />}>
                            <span className="capitalize">{formattedDate}</span>
                        </DetailRow>

                        <DetailRow icon={<Clock size={14} />}>
                            <span>{formattedTime}</span>
                        </DetailRow>

                        {activity.user?.username && (
                            <DetailRow icon={<User size={14} />}>
                                <span>{activity.user.username}</span>
                            </DetailRow>
                        )}

                        {activity.opportunity?.nombre_proyecto && (
                            <DetailRow icon={<Briefcase size={14} />}>
                                <span className="break-words whitespace-normal" title={activity.opportunity.nombre_proyecto}>{activity.opportunity.nombre_proyecto}</span>
                            </DetailRow>
                        )}

                        {activity.company?.nombre ? (
                            <DetailRow icon={<Building size={14} />}>
                                <span className="break-words whitespace-normal" title={activity.company.nombre}>{activity.company.nombre}</span>
                            </DetailRow>
                        ) : activity.client?.nombre ? (
                            <DetailRow icon={<User size={14} />}>
                                <span className="break-words whitespace-normal" title={`${activity.client.nombre} ${activity.client.apellido}`}>{activity.client.nombre} {activity.client.apellido}</span>
                            </DetailRow>
                        ) : null}

                        {activity.reminder && (
                            <div className="mt-2 pt-2 border-t border-amber-200 space-y-1">
                                <DetailRow icon={<Bell size={14} className="text-amber-500" />}>
                                    <span className="font-medium text-amber-700 break-words line-clamp-3" title={activity.reminder.title}>{activity.reminder.title}</span>
                                </DetailRow>
                                <DetailRow icon={<Clock size={14} className="text-amber-400" />}>
                                    <span className="text-amber-600 text-[10px] sm:text-xs">
                                        {new Date(activity.reminder.date).toLocaleString('es-MX', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </DetailRow>
                            </div>
                        )}
                    </div>
                </div>


                {/* Footer de acciones */}
                <div className="border-t border-gray-100 px-4 py-3 flex justify-end gap-2 bg-gray-50">
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                        Eliminar
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors border hover:brightness-95"
                        style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}
                    >
                        <Edit size={14} />
                        Editar
                    </button>
                </div>
            </div>
        </>
    );
};

export default ActivityPopover;
