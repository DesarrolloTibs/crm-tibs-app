import React from 'react';
import type { Opportunity, OpportunityStageType } from '../../core/models/Opportunity';
import { Edit, Trash2, Archive, ArchiveRestore, Inbox } from 'lucide-react';

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
};

const OpportunityHistoryTable: React.FC<Props> = ({ opportunities, onEdit, onDelete, onArchive, isAdmin, currentPage, totalPages, onPageChange }) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate" style={{ borderSpacing: '0 0.75rem' }}>
        <thead>
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Proyecto</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Cliente / Empresa</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Ejecutivo</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Etapa</th>
            <th className="p-4 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider">Monto Total</th>
            <th className="p-4 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody>
          {opportunities.length > 0 ? (
            opportunities.map(opp => {
              const stageStyle = stageColors[opp.etapa] || { bg: 'bg-gray-100', text: 'text-gray-800' };
              return (
                <tr key={opp.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px">
                  <td className="p-4 rounded-l-lg">
                    <p className="text-gray-900 font-semibold">{opp.nombre_proyecto}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-800">{opp.cliente?.nombre} {opp.cliente?.apellido}</p>
                    <p className="text-gray-500 text-xs">{opp.empresa}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-700">{opp.ejecutivo?.username || 'No asignado'}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${stageStyle.bg} ${stageStyle.text}`}>
                      {opp.etapa}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-gray-900 font-semibold">{formatCurrency(opp.monto_total, opp.moneda)}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${opp.archived ? 'text-yellow-900' : 'text-green-900'}`}>
                      <span aria-hidden className={`absolute inset-0 ${opp.archived ? 'bg-yellow-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                      <span className="relative">{opp.archived ? 'Archivado' : 'Activo'}</span>
                    </span>
                  </td>
                  <td className="p-4 rounded-r-lg">
                    <div className="flex space-x-1 justify-end">
                      <button
                        onClick={() => onEdit(opp)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onArchive(opp)}
                            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full"
                            title={opp.archived ? 'Desarchivar' : 'Archivar'}
                          >
                            {opp.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
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
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center text-gray-500">
                  <Inbox size={48} className="mb-4" />
                  <h3 className="text-xl font-semibold">No se encontraron oportunidades</h3>
                  <p className="text-sm">Intenta ajustar los filtros o crear una nueva oportunidad.</p>
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