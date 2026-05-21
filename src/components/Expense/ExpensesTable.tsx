import React, { useState } from 'react';
import type { Expense } from '../../core/models/Expense';
import { Edit, Trash2, Inbox, Calendar, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';

// Checking utils folder in previous steps showed it exists but didn't list content. I'll stick to inline formatting or standard JS Date for now to be safe.

interface Props {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onUploadReceipt: (expense: Expense) => void;
}

const ExpensesTable: React.FC<Props> = ({ expenses, onEdit, onDelete, currentPage, totalPages, onPageChange, onUploadReceipt }) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
                <thead className="hidden md:table-header-group">
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Asociado A</th>
                        <th className="p-4"></th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {expenses.length > 0 ? (
                        expenses.map(expense => {
                            const isExpanded = expandedRows[expense.id!];
                            return (
                                <tr key={expense.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0">
                                    <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg">
                                        <div className="flex flex-col md:block">
                                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha</span>
                                            <div className="flex items-center text-gray-700">
                                                <Calendar size={16} className="mr-2 text-gray-400" />
                                                {new Date(expense.fecha + 'T12:00:00').toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                                        <div className="flex flex-col md:block">
                                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Concepto</span>
                                            <p className="font-semibold text-gray-900">{expense.concepto}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                                        <div className="flex flex-col md:block">
                                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Monto</span>
                                            <div className="flex items-center font-medium text-green-600">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expense.monto)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                        <div className="flex flex-col md:block">
                                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Usuario</span>
                                            <p className="text-gray-700">{expense.usuario?.username || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                                        <div className="flex flex-col md:block">
                                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Asociado A</span>
                                            {expense.client ? (
                                                <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm w-fit mt-1 md:mt-0">
                                                    <Briefcase size={14} className="mr-1" />
                                                    Cliente: {expense.client.nombre} {expense.client.apellido}
                                                </span>
                                            ) : expense.opportunity ? (
                                                <span className="flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded text-sm w-fit mt-1 md:mt-0">
                                                    <Briefcase size={14} className="mr-1" />
                                                    Oportunidad: {expense.opportunity.nombre_proyecto}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Sin asociación</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 block md:table-cell md:rounded-r-lg">
                                        <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                                            <button 
                                                onClick={() => toggleRow(expense.id!)} 
                                                className="md:hidden text-blue-600 font-medium text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded"
                                            >
                                                {isExpanded ? <ChevronUp size={16} className="mr-1"/> : <ChevronDown size={16} className="mr-1"/>}
                                                {isExpanded ? 'Menos' : 'Más'} detalles
                                            </button>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => onUploadReceipt(expense)}
                                                    className={`p-2 rounded-full ${expense.receiptUrl ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'}`}
                                                    title={expense.receiptUrl ? "Ver/Actualizar Comprobante" : "Subir Comprobante"}
                                                >
                                                    <div className="relative">
                                                        <Inbox size={18} />
                                                        {expense.receiptUrl && (
                                                            <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"></span>
                                                        )}
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => onEdit(expense)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(expense)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={6} className="text-center py-16 block md:table-cell">
                                <div className="flex flex-col items-center text-gray-500">
                                    <Inbox size={48} className="mb-4" />
                                    <h3 className="text-xl font-semibold">No se encontraron gastos</h3>
                                    <p className="text-sm">Registra un nuevo gasto para comenzar.</p>
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

export default ExpensesTable;
