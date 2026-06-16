import React from 'react';
import type { TypeActivity } from '../../core/models/Activity';
import { Edit, Trash2, Inbox, ClipboardList } from 'lucide-react';

interface Props {
    types: TypeActivity[];
    onEdit: (type: TypeActivity) => void;
    onDelete: (type: TypeActivity) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const ActivityTypesTable: React.FC<Props> = ({ types, onEdit, onDelete, currentPage, totalPages, onPageChange }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
                <thead className="hidden md:table-header-group">
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Tipo de Actividad</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {types.length > 0 ? (
                        types.map(type => (
                            <tr key={type.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0">
                                <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg font-medium text-gray-900">
                                    <div className="flex flex-col md:block">
                                        <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Tipo de Actividad</span>
                                        <div className="flex items-center gap-2">
                                            <ClipboardList size={16} className="text-gray-400" />
                                            <p className="font-semibold text-gray-900">{type.strname}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none text-gray-600">
                                    <div className="flex flex-col md:block">
                                        <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</span>
                                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${type.blnstatus ? 'text-green-900' : 'text-red-900'} max-w-fit`}>
                                            <span aria-hidden className={`absolute inset-0 ${type.blnstatus ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}></span>
                                            <span className="relative text-xs">{type.blnstatus ? 'Activo' : 'Inactivo'}</span>
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 block md:table-cell md:rounded-r-lg text-right">
                                    <div className="flex justify-end space-x-1">
                                        <button
                                            onClick={() => onEdit(type)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(type)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr className="block md:table-row w-full">
                            <td colSpan={3} className="text-center py-16 block md:table-cell w-full">
                                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full mx-auto">
                                    <Inbox size={48} className="mb-4 mx-auto" />
                                    <h3 className="text-xl font-semibold text-center w-full">No se encontraron tipos de actividad</h3>
                                    <p className="text-sm text-center w-full mt-1">Intenta crear un nuevo tipo de actividad.</p>
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

export default ActivityTypesTable;
