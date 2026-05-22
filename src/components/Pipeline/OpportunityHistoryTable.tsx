import React, { useState } from 'react';
import type { Opportunity, OpportunityStageType } from '../../core/models/Opportunity';
import { Edit, Trash2, Archive, ArchiveRestore, Inbox, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const stageColors: Record<OpportunityStageType, { bg: string; text: string }> = {
  'Nuevo': { bg: 'bg-gray-100', text: 'text-gray-800' },
  'Descubrimiento': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Estimación': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'Propuesta': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'Negociación': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Ganada': { bg: 'bg-green-100', text: 'text-green-800' },
  'Perdida': { bg: 'bg-red-100', text: 'text-red-800' },
  'Cancelada': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Standby': { bg: 'bg-pink-100', text: 'text-pink-800' },
};

const OpportunityHistoryTable: React.FC<Props> = ({ opportunities, onEdit, onDelete, onArchive, isAdmin, currentPage, totalPages, onPageChange }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 0}).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
        <thead className="hidden md:table-header-group">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Proyecto</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Cliente / Empresa</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Ejecutivo</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Etapa</th>
            <th className="p-4 text-right md:text-right text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
            <th className="p-4 text-center md:text-center text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Moneda</th>
            <th className="p-4 text-center md:text-center text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {opportunities.length > 0 ? (
            opportunities.map(opp => {
              const stageStyle = stageColors[opp.etapa] || { bg: 'bg-gray-100', text: 'text-gray-800' };
              const isExpanded = expandedRows[opp.id!];
              return (
                <tr key={opp.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0">
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Proyecto</span>
                      <p className="text-gray-900 font-semibold">{opp.nombre_proyecto}</p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Cliente / Empresa</span>
                      <p className="text-gray-800">{opp.cliente?.nombre} {opp.cliente?.apellido}</p>
                      <p className="text-gray-500 text-xs">{opp.empresa}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Ejecutivo</span>
                      <p className="text-gray-700">{opp.ejecutivo?.username || 'No asignado'}</p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Etapa</span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${stageStyle.bg} ${stageStyle.text}`}>
                        {opp.etapa}
                      </span>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none md:text-right ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Monto</span>
                      <p className="text-gray-900 font-semibold">${formatNumber(opp.monto_total)}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none md:text-center ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Moneda</span>
                      <p className="text-gray-700">{opp.moneda}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none md:text-center ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</span>
                      <span className={`relative inline-block px-3 py-1 font-semibold leading-tight w-fit ${opp.archived ? 'text-yellow-900' : 'text-green-900'}`}>
                        <span aria-hidden className={`absolute inset-0 ${opp.archived ? 'bg-yellow-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                        <span className="relative">{opp.archived ? 'Archivado' : 'Activo'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell md:rounded-r-lg">
                    <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                      <button 
                        onClick={() => toggleRow(opp.id!)} 
                        className="md:hidden text-blue-600 font-medium text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        {isExpanded ? <ChevronUp size={16} className="mr-1"/> : <ChevronDown size={16} className="mr-1"/>}
                        {isExpanded ? 'Menos' : 'Más'} detalles
                      </button>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onArchive(opp)}
                          className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full"
                          title={opp.archived ? 'Desarchivar' : 'Archivar'}
                        >
                          {opp.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onEdit(opp)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => onDelete(opp)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-16 block md:table-cell w-full">
                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full">
                  <Inbox size={48} className="mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-center w-full">No se encontraron oportunidades</h3>
                  <p className="text-sm text-center w-full mt-1">Intenta ajustar los filtros o crear una nueva oportunidad.</p>
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

export default OpportunityHistoryTable;