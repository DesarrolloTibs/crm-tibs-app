import React, { useMemo } from 'react';
import { CalendarDays, FileText, FileSpreadsheet } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import type {
  Activity,
  ActivityFiltersState,
} from '../schemas/activities.schema';
import { getActivitiesColumns } from '../utils/activities.columns';

interface ActivitiesTableProps {
  activities: Activity[];
  totalCount: number;
  loading: boolean;
  filters?: ActivityFiltersState;
  onClearFilters?: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  filteredCount?: number;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
}

export const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
  activities,
  totalCount,
  loading,
  filters,
  onClearFilters,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  filteredCount,
  onExportPDF,
  onExportCSV,
}) => {
  const columns = useMemo(
    () =>
      getActivitiesColumns({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  const hasActiveFilters = Boolean(
    filters &&
      (filters.search.trim() ||
        filters.userId !== 'all' ||
        filters.typeActivityId !== 'all' ||
        Boolean(filters.date))
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      {/* ── Encabezado de la Tabla ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-indigo-600" size={18} />
            Directorio de Actividades & Citas
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Bitácora de reuniones, demos, tareas y llamadas programadas con clientes y empresas.
          </p>
        </div>

        {/* Acciones de Exportación y Conteo */}
        <div className="flex items-center gap-2">
          {onExportPDF && (
            <Button
              variant="secondary"
              onClick={onExportPDF}
              className="gap-1.5 text-xs !py-1.5 !px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-2xs"
              title="Exportar a PDF"
            >
              <FileText size={14} className="text-red-500" />
              <span>PDF</span>
            </Button>
          )}

          {onExportCSV && (
            <Button
              variant="secondary"
              onClick={onExportCSV}
              className="gap-1.5 text-xs !py-1.5 !px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 shadow-2xs"
              title="Exportar a Excel / CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              <span>Excel</span>
            </Button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Total: <strong className="text-slate-800">{totalCount}</strong>
            {filteredCount !== undefined && filteredCount !== totalCount && (
              <span className="text-indigo-600 ml-1 font-semibold">
                ({filteredCount} filtradas)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Tabla TanStack Table ── */}
      <Table
        data={activities}
        columns={columns}
        variant="cards"
        loading={loading}
        emptyTitle={hasActiveFilters ? 'Sin resultados para la búsqueda' : 'No hay actividades registradas'}
        emptyMessage={
          hasActiveFilters
            ? 'No encontramos actividades que coincidan con los filtros aplicados. Prueba restableciendo los criterios.'
            : 'Comienza agendando tu primera cita, demo o llamada comercial en el CRM.'
        }
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
        footerRow={
          <tr>
            <td colSpan={columns.length} className="px-4 py-3 bg-slate-50/80 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium w-full">
                <span>
                  Mostrando <strong className="text-slate-800">{activities.length}</strong> de{' '}
                  <strong className="text-slate-800">{totalCount}</strong> actividades registradas
                </span>
                {hasActiveFilters && onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            </td>
          </tr>
        }
      />
    </div>
  );
};

export default ActivitiesTable;
