import React, { useMemo } from 'react';
import { Activity, Search, X, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import Table from '@shared/components/Table';
import Badge from '@shared/components/Badge';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import type { RecentTransaction } from '../schemas/myCompany.schema';
import { getInteractionHistoryColumns } from '../utils/interactionHistory.columns';
import { formatShortDate, formatFriendlyDate, formatNumber, formatTokensCompact } from '../utils/myCompany.helpers';

interface InteractionHistoryTableProps {
  transactions: RecentTransaction[];
  transactionSearch: string;
  setTransactionSearch: (val: string) => void;
  transactionFilter: 'all' | 'plan' | 'extra';
  setTransactionFilter: (filter: 'all' | 'plan' | 'extra') => void;
  selectedDateFilter?: string | null;
  onClearDateFilter?: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const InteractionHistoryTable: React.FC<InteractionHistoryTableProps> = ({
  transactions,
  transactionSearch,
  setTransactionSearch,
  transactionFilter,
  setTransactionFilter,
  selectedDateFilter = null,
  onClearDateFilter,
  onExportExcel,
  onExportPDF,
}) => {
  const columns = useMemo(() => getInteractionHistoryColumns(), []);

  // Suma exacta de recursos consumidos en los registros actualmente visibles
  const totalTokensInView = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + (tx.total_tokens || 0), 0);
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-emerald-600" size={18} />
            Historial de Interacciones Recientes
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico de las últimas consultas y respuestas procesadas por el sistema.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtro */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            size="sm"
            type="text"
            value={transactionSearch}
            onChange={e => setTransactionSearch(e.target.value)}
            onClear={() => setTransactionSearch('')}
            clearTitle="Limpiar búsqueda"
            inputPrefix={<Search size={14} />}
            placeholder="Buscar por fecha, canal, origen, acción..."
            containerClassName="w-full sm:w-72"
          />

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTransactionFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                transactionFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setTransactionFilter('plan')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                transactionFilter === 'plan'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cuota Base
            </button>
            <button
              type="button"
              onClick={() => setTransactionFilter('extra')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                transactionFilter === 'extra'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Consumo Extra
            </button>
          </div>

          {/* Botones de Exportación exclusivos del Historial de Interacciones */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <Button
              size="xs"
              variant="secondary"
              onClick={onExportExcel}
              disabled={!transactions || transactions.length === 0}
              className="gap-1.5 !py-1 border-slate-200 !font-semibold !text-emerald-700 hover:!bg-emerald-50 shadow-xs hover:translate-y-0"
              title="Exportar historial de interacciones a Excel (.xlsx)"
            >
              <FileSpreadsheet size={13} />
              <span>Excel</span>
            </Button>
            <Button
              size="xs"
              variant="secondary"
              onClick={onExportPDF}
              disabled={!transactions || transactions.length === 0}
              className="gap-1.5 !py-1 border-slate-200 !font-semibold !text-rose-700 hover:!bg-rose-50 shadow-xs hover:translate-y-0"
              title="Exportar historial de interacciones a PDF"
            >
              <FileText size={13} />
              <span>PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Banner de filtro por día activo con opción de removerlo */}
      {selectedDateFilter && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-indigo-50/80 border border-indigo-200/90 px-4 py-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-indigo-950 font-medium flex-wrap">
            <Calendar size={14} className="text-indigo-600 shrink-0" />
            <span>
              Filtrando interacciones del día:{' '}
              <strong className="font-bold text-indigo-700 capitalize">
                {formatShortDate(selectedDateFilter)}
              </strong>
            </span>
            <Badge variant="indigo" size="sm">
              {transactions.length} {transactions.length === 1 ? 'actividad' : 'actividades'}
            </Badge>
            <span className="text-[11px] font-mono text-indigo-700 font-bold bg-white/90 px-2 py-0.5 rounded-md border border-indigo-200">
              Suma: {formatNumber(totalTokensInView)} recursos
            </span>
          </div>

          <Button
            variant="ghost"
            onClick={onClearDateFilter}
            className="gap-1.5 !text-indigo-600 hover:!text-indigo-900 !font-bold hover:!bg-indigo-100 self-start sm:self-auto"
            title="Quitar filtro de día y visualizar todas las actividades"
          >
            <X size={13} />
            <span>Quitar filtro de día (Ver todos)</span>
          </Button>
        </div>
      )}

      {/* Tabla compartida estándar con soporte responsive */}
      <Table<RecentTransaction>
        columns={columns}
        data={transactions}
        variant="flat"
        maxHeight="480px"
        minHeight="180px"
        emptyTitle={
          transactionSearch
            ? "Sin coincidencias"
            : selectedDateFilter
            ? `Sin interacciones el ${formatShortDate(selectedDateFilter)}`
            : "Sin actividades"
        }
        emptyMessage={
          transactionSearch
            ? "No se encontraron registros que coincidan con los criterios de búsqueda."
            : selectedDateFilter
            ? `No se registraron interacciones en el historial durante el ${formatFriendlyDate(selectedDateFilter)}. Puedes quitar la selección para ver todas las actividades del período.`
            : "No hay actividades registradas en este período."
        }
        keyExtractor={(tx: RecentTransaction) => tx.id}
        enablePagination
        initialPageSize={10}
        footerRow={({ visibleData }) => {
          const visibleTotalTokens = visibleData.reduce((acc, tx) => acc + (tx.total_tokens || 0), 0);
          const visiblePromptTokens = visibleData.reduce((acc, tx) => acc + (tx.prompt_tokens || 0), 0);
          const visibleCompletionTokens = visibleData.reduce((acc, tx) => acc + (tx.completion_tokens || 0), 0);

          return (
            <tr className="bg-slate-100/95 backdrop-blur-xs border-t-2 border-slate-300 text-slate-800 shadow-xs">
              <td colSpan={4} className="px-4 py-3.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-emerald-600 shrink-0" />
                  <span>Total Recursos Consumidos (Página / Registros Visibles):</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                <span className="font-mono font-black text-slate-900 text-sm block">
                  {formatNumber(visibleTotalTokens)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {formatTokensCompact(visiblePromptTokens)} cons. / {formatTokensCompact(visibleCompletionTokens)} resp.
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant="indigo" size="sm" className="font-bold">
                  {visibleData.length} en página
                </Badge>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
};
