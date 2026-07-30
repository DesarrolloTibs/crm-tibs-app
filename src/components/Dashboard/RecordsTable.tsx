import React from 'react';
import { ClipboardList, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Opportunity } from '../../core/models/Opportunity';
import type { Ticket } from '../../core/models/Ticket';
import type { ActiveTab, CurrencyFilter } from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../shared/EmptyState';

interface RecordsTableProps {
  activeTab: ActiveTab;
  tableDataList: (Opportunity | Ticket)[];
  paginatedList: (Opportunity | Ticket)[];
  tableSearch: string;
  onSearchChange: (v: string) => void;
  selectedKpiId: string | null;
  selectedChartFilter: { chartKey: string; value: string } | null;
  currentIndicators: any[];
  onClearKpi: () => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (fn: (p: number) => number) => void;
  currencyFilter: CurrencyFilter;
  activeCurrency: string;
}

const RecordsTable: React.FC<RecordsTableProps> = ({
  activeTab, tableDataList, paginatedList, tableSearch, onSearchChange,
  selectedKpiId, selectedChartFilter, currentIndicators, onClearKpi,
  currentPage, pageSize, onPageChange, currencyFilter,
}) => {
  const navigate = useNavigate();
  const totalPages = Math.ceil(tableDataList.length / pageSize);

  const sectionTitle = selectedChartFilter
    ? `Registros filtrados por gráfico: "${selectedChartFilter.value}"`
    : selectedKpiId
      ? `Registros en: "${currentIndicators.find(i=>i.id===selectedKpiId)?.title}"`
      : activeTab === 'commercial' ? 'Oportunidades en este Pipeline' : 'Tickets en esta Mesa de Ayuda';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={20} />
            {sectionTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedChartFilter ? `Solo registros del elemento "${selectedChartFilter.value}".`
              : selectedKpiId ? 'Solo registros del KPI seleccionado.'
              : 'Registros consolidados activos bajo las etapas elegidas.'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          <div className="relative flex-grow sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" value={tableSearch} onChange={e=>onSearchChange(e.target.value)} placeholder="Buscar..." className="w-full sm:w-56 h-10 pl-10 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all" />
          </div>
          {selectedKpiId && (
            <button onClick={onClearKpi} className="px-3.5 h-10 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all whitespace-nowrap cursor-pointer">
              Ver todos
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {tableDataList.length === 0 ? (
        <EmptyState title="No se encontraron registros" message="No hay registros activos que coincidan con la búsqueda o filtros aplicados." icon={<Search size={28} className="text-slate-400" />} />
      ) : activeTab === 'commercial' ? (
        /* Opportunities table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase">
              <tr>
                <th className="p-3.5 rounded-l-xl">Oportunidad / Proyecto</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Empresa</th>
                <th className="p-3.5">Ejecutivo</th>
                <th className="p-3.5">Etapa</th>
                <th className="p-3.5 text-right">Monto</th>
                <th className="p-3.5 rounded-r-xl text-center w-14">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(paginatedList as Opportunity[]).map(opp => (
                <tr key={opp.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                  <td className="p-3.5 font-bold text-slate-800 max-w-[200px] truncate">{opp.nombre_proyecto}</td>
                  <td className="p-3.5">{opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : opp.empresa || 'N/A'}</td>
                  <td className="p-3.5">{opp.company?.nombre || opp.empresa || 'N/A'}</td>
                  <td className="p-3.5 text-slate-500">{opp.ejecutivo?.username || 'Sin asignar'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: opp.stage?.strcolor ? opp.stage.strcolor+'15' : '#f1f5f9', color: opp.stage?.strcolor || '#64748b' }}>
                      {opp.stage?.strname || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">
                    {(() => { const a=Number(opp.monto_total||0); return currencyFilter==='consolidado'&&opp.moneda==='USD'?formatCurrency(a*(opp.tipoCambio&&opp.tipoCambio>0?opp.tipoCambio:1),'MXN'):formatCurrency(a,opp.moneda); })()}
                  </td>
                  <td className="p-3.5 text-center">
                    <button type="button" onClick={() => navigate(`/pipeline?opportunityId=${opp.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer" title="Ir a oportunidad">
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tickets table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase">
              <tr>
                <th className="p-3.5 rounded-l-xl">Nro Ticket</th>
                <th className="p-3.5">Asunto</th>
                <th className="p-3.5">Prioridad</th>
                <th className="p-3.5">Tipo Incidencia</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Asignado a</th>
                <th className="p-3.5">Etapa</th>
                <th className="p-3.5 rounded-r-xl text-center w-14">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(paginatedList as Ticket[]).map(t => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                  <td className="p-3.5 font-black text-indigo-600">#{t.ticket_number.toString().padStart(5,'0')}</td>
                  <td className="p-3.5 font-bold text-slate-800 max-w-[200px] truncate">{t.strtitle}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.priority===3?'bg-rose-50 text-rose-600':t.priority===2?'bg-amber-50 text-amber-600':'bg-emerald-50 text-emerald-600'}`}>
                      {t.priority===3?'Alta':t.priority===2?'Media':'Baja'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{t.tipo_incidencia||'Normal'}</td>
                  <td className="p-3.5">{t.cliente?`${t.cliente.nombre} ${t.cliente.apellido}`:t.contactName||'N/A'}</td>
                  <td className="p-3.5 text-slate-500">{t.responsable?.username||'Sin asignar'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: t.stage?.strcolor?t.stage.strcolor+'15':'#f1f5f9', color:t.stage?.strcolor||'#64748b' }}>
                      {t.stage?.strname||'N/A'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button type="button" onClick={() => navigate(`/helpdesk?ticketId=${t.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer" title="Ir a ticket">
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {tableDataList.length > pageSize && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 flex-wrap gap-2 text-xs font-bold text-slate-500">
          <span>Mostrando {Math.min(tableDataList.length,(currentPage-1)*pageSize+1)} - {Math.min(tableDataList.length,currentPage*pageSize)} de {tableDataList.length} registros</span>
          <div className="flex gap-1">
            <button type="button" disabled={currentPage===1} onClick={()=>onPageChange(p=>Math.max(1,p-1))} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">Anterior</button>
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">Pág. {currentPage} de {totalPages}</div>
            <button type="button" disabled={currentPage===totalPages} onClick={()=>onPageChange(p=>Math.min(totalPages,p+1))} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsTable;
