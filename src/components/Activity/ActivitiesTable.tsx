
import React from 'react';

import { Edit, Inbox, Trash2 } from 'lucide-react';
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

const ActivitiesTable: React.FC<Props> = ({ activities, onEdit, onDelete, isAdmin, currentPage, totalPages, onPageChange }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate" style={{ borderSpacing: '0 0.75rem' }}>
                <thead>
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actividad</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Oportunidad</th>
                        {isAdmin && <th className="p-4 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {activities.length > 0 ? (
                        activities.map(activity => (
                            <tr key={activity.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px">
                                <td className="p-4 rounded-l-lg font-medium text-gray-900">{activity.activity}</td>
                                <td className="p-4 text-gray-600">{activity.activityType}</td>
                                <td className="p-4 text-gray-600">{new Date(activity.date).toLocaleString()}</td>
                                <td className="p-4 text-gray-600">{activity.user?.username}</td>
                                <td className="p-4 text-gray-600">{activity.opportunity?.nombre_proyecto || 'N/A'}</td>
                                {isAdmin && (
                                    <td className="p-4 rounded-r-lg text-right">
                                        <div className="flex space-x-1 justify-end">
                                            <button onClick={() => onEdit(activity)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title="Editar">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => onDelete(activity)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Eliminar">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={isAdmin ? 6 : 5} className="text-center py-16">
                                <div className="flex flex-col items-center text-gray-500">
                                    <Inbox size={48} className="mb-4" />
                                    <h3 className="text-xl font-semibold">No se encontraron actividades</h3>
                                    <p className="text-sm">Intenta ajustar los filtros o crear una nueva actividad.</p>
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
