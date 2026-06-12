import React from 'react';
import { X, Calendar, Clock, User, Briefcase, Edit, Trash2 } from 'lucide-react';
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
    <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="text-indigo-500 flex-shrink-0">{icon}</span>
        {children}
    </div>
);

/* ── Componente principal ─────────────────────────────────────────────────── */

/**
 * Popover que aparece al hacer click en un evento del calendario.
 * Muestra los detalles de la actividad y botones de editar / eliminar.
 */
const ActivityPopover: React.FC<Props> = ({ activity, position, onEdit, onDelete, onClose }) => {
    const color = getActivityColor(activity.activityType);

    const popoverLeft = Math.min(position.x - 160, window.innerWidth - 340);
    const popoverTop  = Math.min(position.y + 8,   window.innerHeight - 300);

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
            {/* Overlay transparente para cerrar al clickear fuera */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Popover */}
            <div
                className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 w-80 overflow-hidden"
                style={{ left: popoverLeft, top: popoverTop }}
            >
                {/* Header con el color del tipo de actividad */}
                <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: color.bg }}
                >
                    <span className="text-white text-xs font-bold uppercase tracking-wider">
                        {activity.activityType}
                    </span>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors rounded-full p-0.5 hover:bg-white/20"
                        aria-label="Cerrar"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Cuerpo con detalles */}
                <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-[0.95rem] leading-snug">
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
                                <span className="truncate">{activity.opportunity.nombre_proyecto}</span>
                            </DetailRow>
                        )}
                    </div>
                </div>

                {/* Footer de acciones */}
                <div className="border-t border-gray-100 px-4 py-3 flex justify-end gap-2 bg-gray-50">
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                        Eliminar
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors"
                        style={{ backgroundColor: color.bg }}
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
