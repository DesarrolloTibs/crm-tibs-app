import React, { useMemo } from 'react';
import { Briefcase, FileText, FileSpreadsheet } from 'lucide-react';
import type { Opportunity } from '../../schemas/pipeline.schema';
import Table from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import { getOpportunityColumns } from '../../utils/pipeline.columns';

interface PipelineTableProps {
  opportunities: Opportunity[];
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
  isAdmin: boolean;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  maxHeight?: string;
}

export const PipelineTableView: React.FC<PipelineTableProps> = ({
  opportunities,
  totalCount,
  filteredCount,
  loading = false,
  isAdmin,
  onEdit,
  onDelete,
  onArchive,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  onExportPDF,
  onExportCSV,
  maxHeight,
}) => {
  const columns = useMemo(
    () =>
      getOpportunityColumns({
        isAdmin,
        onEdit,
        onDelete,
        onArchive,
      }),
    [isAdmin, onEdit, onDelete, onArchive]
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Encabezado de la Tabla Homologado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-indigo-600" size={18} />
            Directorio de Oportunidades & Pipeline
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Listado tabular de negociaciones comerciales, estatus, montos acumulados y asignación ejecutiva.
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

      <Table
        data={opportunities}
        columns={columns}
        variant="cards"
        loading={loading}
        keyExtractor={(opp) => opp.id!}
        emptyTitle="No se encontraron oportunidades"
        emptyMessage="Intenta ajustar los filtros de búsqueda o registra una nueva oportunidad."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
        maxHeight={maxHeight}
      />
    </div>
  );
};

export const PipelineTable = PipelineTableView;
export default PipelineTableView;
