import React, { useState } from 'react';
import type { Opportunity } from '../../core/models/Opportunity';
import { Edit, Trash2, Archive, ArchiveRestore, Inbox, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import Button from '../shared/Button';

interface Props {
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
  filteredCount: number;
}

const OpportunityHistoryTable: React.FC<Props> = ({ 
  opportunities, 
  onEdit, 
  onDelete, 
  onArchive, 
  isAdmin, 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount
}) => {
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
              const isExpanded = expandedRows[opp.id!];
              const stageName = opp.stage?.strname || 'Sin etapa';
              const stageColor = opp.stage?.strcolor || '#6B7280';
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
                      {opp.company ? (
                        <>
                          <p className="text-gray-800 font-semibold">{opp.company.nombre}</p>
                          <p className="text-gray-500 text-xs">
                            {opp.contacts?.map(c => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-800">{opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : '-'}</p>
                          <p className="text-gray-500 text-xs">{opp.empresa || '-'}</p>
                        </>
                      )}
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
                      <span 
                        className="px-2.5 py-1 text-xs font-semibold rounded-full w-fit border inline-flex items-center gap-1"
                        style={{
                          backgroundColor: `${stageColor}1A`, // ~10% opacity
                          color: stageColor,
                          borderColor: `${stageColor}33`, // ~20% opacity
                        }}
                      >
                        {Number(opp.stage?.stage_type) === 1 && <Check size={11} className="stroke-[3] text-emerald-600" />}
                        {Number(opp.stage?.stage_type) === 2 && <X size={11} className="stroke-[3] text-rose-600" />}
                        {stageName}
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
            <tr className="block md:table-row w-full">
              <td colSpan={8} className="text-center py-16 block md:table-cell w-full">
                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full mx-auto">
                  <Inbox size={48} className="mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-center w-full">No se encontraron oportunidades</h3>
                  <p className="text-sm text-center w-full mt-1">Intenta ajustar los filtros o crear una nueva oportunidad.</p>
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
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? 'primary' : 'secondary'}
                className="!py-1.5 !px-3.5 !text-[11px] !rounded-lg"
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityHistoryTable;