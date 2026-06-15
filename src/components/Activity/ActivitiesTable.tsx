
import React, { useState } from 'react';

import { Edit, Inbox, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Activity } from '../../core/models/Activity';

interface Props {
    activities: Activity[];
    onEdit: (activity: Activity) => void;
    onDelete: (activity: Activity) => void;
    isAdmin: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const ActivitiesTable: React.FC<Props> = ({ activities, onEdit, onDelete, currentPage, totalPages, onPageChange }) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
                <thead className="hidden md:table-header-group">
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actividad</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Relación</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Oportunidad</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {activities.length > 0 ? (
                        activities.map(activity => {
                            const isExpanded = expandedRows[activity.id!];
                            return (
                                <tr key={activity.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0">
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
                                                <p>-</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`p-4 border-b border-gray-100 md:border-none text-gray-600 ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                        <div className="flex flex-col md:block">
                                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Oportunidad</span>
                                            <p>{activity.opportunity?.nombre_proyecto || 'N/A'}</p>
                                        </div>
                                    </td>

                                    <td className="p-4 block md:table-cell md:rounded-r-lg text-right">
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
                            );
                        })
                    ) : (
                        <tr className="block md:table-row w-full">
                            <td colSpan={6} className="text-center py-16 block md:table-cell w-full">
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
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 p-4">
                    <div className="flex space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                                onClick={() => onPageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivitiesTable;
