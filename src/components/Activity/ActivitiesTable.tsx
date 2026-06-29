import React, { useState } from 'react';
import { Edit, Inbox, Trash2, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import type { Activity } from '../../core/models/Activity';

interface Props {
    activities: Activity[];
    onEdit: (activity: Activity) => void;
    onDelete: (activity: Activity) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    totalCount: number;
    filteredCount: number;
}

const ActivitiesTable: React.FC<Props> = ({ 
    activities, 
    onEdit, 
    onDelete, 
    currentPage, 
    totalPages, 
    onPageChange,
    pageSize,
    onPageSizeChange,
    totalCount,
    filteredCount
}) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="overflow-x-auto pb-8"> {/* Añadido padding bottom para evitar corte de tooltip */}
            <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
                <thead className="hidden md:table-header-group">
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actividad</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Relación</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Oportunidad</th>
                        <th className="p-4 w-12">{/* Nueva columna vacía para campanita (sin header) */}</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider print:hidden">Acciones</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {activities.length > 0 ? (
                        activities.map(activity => {
                            const isExpanded = expandedRows[activity.id!];
                            return (
                                <React.Fragment key={activity.id}>
                                    {/* ── Fila de la Actividad ── */}
                                    <tr className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-1 md:mb-0">
                                        <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg font-medium text-gray-900">
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Actividad</span>
                                                <p>{activity.activity}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none text-gray-600">
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Tipo</span>
                                                <p>{activity.typeActivity?.strname || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none text-gray-600">
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha</span>
                                                <p>{new Date(activity.date).toLocaleString()}</p>
                                            </div>
                                        </td>
                                        <td className={`p-4 border-b border-gray-100 md:border-none text-gray-600 ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Usuario</span>
                                                <p>{activity.user?.username}</p>
                                            </div>
                                        </td>
                                        <td className={`p-4 border-b border-gray-100 md:border-none text-gray-600 ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Relación</span>
                                                {activity.company ? (
                                                    <p className="font-semibold text-gray-800">Empresa: {activity.company.nombre}</p>
                                                ) : activity.client ? (
                                                    <p>Contacto: {activity.client.nombre} {activity.client.apellido}</p>
                                                ) : (
                                                    <p></p>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`p-4 border-b border-gray-100 md:border-none text-gray-600 ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Oportunidad</span>
                                                <p>{activity.opportunity?.nombre_proyecto || ''}</p>
                                            </div>
                                        </td>

                                        <td className={`p-4 border-b border-gray-100 md:border-none text-gray-600 ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                            {/* Columna de Recordatorio (Campanita) */}
                                            {activity.reminder ? (
                                                <div 
                                                    className="relative group flex flex-col md:flex-row md:items-center md:justify-center cursor-pointer select-none w-full md:w-auto"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Solo activar tooltip en desktop
                                                        if (window.innerWidth >= 768) {
                                                            setActiveTooltip(activeTooltip === activity.id ? null : activity.id!);
                                                        }
                                                    }}
                                                    onMouseLeave={() => setActiveTooltip(null)}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mr-2">Recordatorio: </span>
                                                        <div className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all duration-200 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 w-fit">
                                                            <Bell size={15} className="text-amber-600 md:animate-[swing_1s_ease-in-out_infinite] md:origin-top" />
                                                        </div>
                                                    </div>

                                                    {/* Vista inline exclusiva para móvil */}
                                                    <div className="md:hidden mt-2 bg-amber-50/70 border border-amber-200/50 rounded-xl p-3 text-xs text-amber-900 w-full max-w-xs shadow-sm flex flex-col gap-1.5">
                                                        <div className="font-bold text-amber-800 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                                                            <Bell size={10} className="text-amber-600" />
                                                            Recordatorio Activo
                                                        </div>
                                                        <div className="font-semibold text-amber-950 break-words whitespace-normal leading-snug">{activity.reminder.title}</div>
                                                        <div className="text-[10px] text-amber-700 font-medium">
                                                            {new Date(activity.reminder.date).toLocaleString('es-MX', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Tooltip con información del recordatorio (exclusivo para desktop) */}
                                                    <div className={`hidden md:flex absolute bottom-full mb-2 ${activeTooltip === activity.id ? 'md:flex' : 'md:hidden'} group-hover:md:flex flex-col bg-slate-900 text-white text-xs rounded-lg py-2.5 px-3 shadow-xl z-50 w-72 pointer-events-none right-[-20px] border border-slate-700/50`}>
                                                        <div className="font-bold text-amber-400 border-b border-slate-700 pb-1 mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                                            <Bell size={10} className="text-amber-400" />
                                                            Recordatorio Activo
                                                        </div>
                                                        <div className="font-semibold text-slate-100 break-words whitespace-normal leading-snug">{activity.reminder.title}</div>
                                                        <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                                            {new Date(activity.reminder.date).toLocaleString('es-MX', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </div>
                                                        <div className="absolute top-full right-[32px] border-4 border-transparent border-t-slate-900"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="hidden md:block w-full h-full min-h-[18px]"></div>
                                            )}
                                        </td>

                                        <td className="p-4 block md:table-cell md:rounded-r-lg text-right print:hidden">
                                            <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                                                <button
                                                    onClick={() => toggleRow(activity.id!)}
                                                    className="md:hidden text-blue-600 font-medium text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded"
                                                >
                                                    {isExpanded ? <ChevronUp size={16} className="mr-1"/> : <ChevronDown size={16} className="mr-1"/>}
                                                    {isExpanded ? 'Menos' : 'Más'} detalles
                                                </button>
                                                <div className="flex space-x-1">
                                                    <button onClick={() => onEdit(activity)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title="Editar">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => onDelete(activity)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Eliminar">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr className="block md:table-row w-full">
                            <td colSpan={8} className="text-center py-16 block md:table-cell w-full">
                                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full mx-auto">
                                    <Inbox size={48} className="mb-4 mx-auto" />
                                    <h3 className="text-xl font-semibold text-center w-full">No se encontraron actividades</h3>
                                    <p className="text-sm text-center w-full mt-1">Intenta ajustar los filtros o crear una nueva actividad.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 gap-4 bg-slate-50/50 rounded-xl border border-slate-100/60 print:hidden">
                {/* Left Side: pageSize input and record details */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-none">
                    <span>Mostrar</span>
                    <input
                        type="number"
                        min="0"
                        value={pageSize === 0 ? '' : pageSize}
                        onChange={(e) => {
                            const val = e.target.value;
                            onPageSizeChange(val === '' ? 0 : Math.max(0, parseInt(val, 10)));
                        }}
                        placeholder="Todos"
                        className="w-16 text-center border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none"
                    />
                    <span>registros de {filteredCount} (total: {totalCount})</span>
                </div>

                {/* Right Side: Page navigation buttons */}
                {totalPages > 1 && (
                    <div className="flex space-x-1.5">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border select-none cursor-pointer ${
                                    currentPage === i + 1 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                                onClick={() => onPageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivitiesTable;
