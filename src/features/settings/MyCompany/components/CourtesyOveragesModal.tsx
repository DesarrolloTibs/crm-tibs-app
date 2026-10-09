import React, { useMemo } from 'react';
import {
  Sparkles, FileSpreadsheet, Download, RefreshCw, X, AlertTriangle
} from 'lucide-react';
import Modal from '@shared/components/Modal';
import Badge from '@shared/components/Badge';
import Button from '@shared/components/Button';
import Loader from '@shared/components/Loader';
import EmptyState from '@shared/components/EmptyState';
import Table from '@shared/components/Table';
import type {
  CourtesyOveragesReportResponse,
  CourtesyOverageTenantReport,
} from '../schemas/myCompany.schema';
import { formatNumber } from '../utils/myCompany.helpers';
import { getCourtesyColumns } from '../utils/courtesyReport.columns';

interface CourtesyOveragesModalProps {
  open: boolean;
  onClose: () => void;
  report: CourtesyOveragesReportResponse | null;
  loading: boolean;
  onReload: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onInspectTenant: (tenant: {
    id: number;
    name: string;
    schema_name: string;
    allow_extra: boolean;
  }) => void;
}

export const CourtesyOveragesModal: React.FC<CourtesyOveragesModalProps> = ({
  open,
  onClose,
  report,
  loading,
  onReload,
  onExportExcel,
  onExportPDF,
  onInspectTenant,
}) => {
  const columns = useMemo(
    () => getCourtesyColumns({ onInspectTenant }),
    [onInspectTenant]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-6xl"
      height="h-auto max-h-[92vh]"
      padding="p-6"
      hideCloseButton={true}
      className="rounded-2xl shadow-2xl"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Reporte Consolidado de Cortesías de Servicio
                <Badge variant="purple" size="sm">Global SaaS</Badge>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fiscalización global de desbordes absorbidos por la plataforma sin costo para las organizaciones.
              </p>
            </div>
          </div>

          {/* Barra de Acciones del Modal: Exportar Excel, PDF, Recargar y Cerrar */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="secondary"
              onClick={onExportExcel}
              disabled={!report || loading || !report.report.length}
              title="Exportar reporte a Excel (.xlsx)"
              className="!py-1.5 !px-3 !text-xs font-bold gap-1.5 shadow-xs text-emerald-700 hover:text-emerald-800 hover:!bg-emerald-50 !border-emerald-300"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Excel</span>
            </Button>

            <Button
              variant="secondary"
              onClick={onExportPDF}
              disabled={!report || loading || !report.report.length}
              title="Exportar reporte a PDF"
              className="!py-1.5 !px-3 !text-xs font-bold gap-1.5 shadow-xs text-rose-700 hover:text-rose-800 hover:!bg-rose-50 !border-rose-300"
            >
              <Download size={14} className="text-rose-600" />
              <span>PDF</span>
            </Button>

            <Button
              variant="secondary"
              onClick={onReload}
              disabled={loading}
              title="Recargar reporte de cortesías"
              className="!py-1.5 !px-2.5 !text-xs text-slate-600 shadow-xs hover:!bg-slate-100 !border-slate-300"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-0.5 border border-transparent hover:border-slate-200"
              title="Cerrar ventana de auditoría"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader size="md" className="h-20" />
            <span className="text-xs font-semibold">Generando reporte consolidado...</span>
          </div>
        ) : !report ? (
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8 text-rose-500" />}
            title="Error de carga"
            message="No se pudo obtener el reporte consolidado de cortesías."
            className="py-10"
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Organizaciones
                </span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {report.total_tenants}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">
                  Organizaciones con Cortesía
                </span>
                <span className="text-2xl font-black text-purple-900 font-mono">
                  {report.tenants_with_courtesy_overage}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">
                  Recursos Absorbidos SaaS
                </span>
                <span className="text-2xl font-black text-indigo-900 font-mono">
                  +{formatNumber(report.total_tokens_absorbed)}
                </span>
              </div>
            </div>

            {/* Tabla compartida Table para el reporte de cortesías */}
            <Table<CourtesyOverageTenantReport>
              columns={columns}
              data={report.report}
              variant="flat"
              maxHeight="420px"
              minHeight="180px"
              keyExtractor={(item: CourtesyOverageTenantReport) => String(item.tenant_id)}
              enablePagination={report.report.length > 8}
              initialPageSize={8}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
