import React, { useMemo } from 'react';
import { Building2, Search, X } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import type { TenantPlanInfo, TenantStatusFilter } from '../schemas/tenants.schema';
import { getTenantsColumns } from '../utils/tenants.columns';

interface TenantsTableProps {
  tenants: TenantPlanInfo[];
  totalCount: number;
  loading: boolean;
  onEdit: (tenant: TenantPlanInfo) => void;
  onDelete: (tenant: TenantPlanInfo) => void;
  onToggleAllowExtra: (tenant: TenantPlanInfo) => void;
  onOpenQueue: (tenant: TenantPlanInfo) => void;
  queueSummaries: Record<number, { total: number; coverageUntil: string | null }>;
  togglingExtraId: number | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: TenantStatusFilter;
  setStatusFilter: (filter: TenantStatusFilter) => void;
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  totalCount,
  loading,
  onEdit,
  onDelete,
  onToggleAllowExtra,
  onOpenQueue,
  queueSummaries,
  togglingExtraId,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const columns = useMemo(
    () =>
      getTenantsColumns({
        onEdit,
        onDelete,
        onToggleAllowExtra,
        onOpenQueue,
        queueSummaries,
        togglingExtraId,
      }),
    [onEdit, onDelete, onToggleAllowExtra, onOpenQueue, queueSummaries, togglingExtraId]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Encabezado y Controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={18} />
            Catálogo de Organizaciones e Inquilinos
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Administración centralizada de esquemas multitenant, vigencias de suscripción y límites de tokens.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o esquema..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <Button
                variant="icon"
                onClick={() => setSearchTerm('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 !p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs flex-wrap">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('all')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? '!bg-white !text-indigo-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Todos
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('active')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'active'
                  ? '!bg-white !text-emerald-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Activas
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('inactive')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'inactive'
                  ? '!bg-white !text-rose-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Inactivas
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('with_queue')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'with_queue'
                  ? '!bg-white !text-amber-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Con Cola
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('allow_extra')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'allow_extra'
                  ? '!bg-white !text-purple-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Excedente
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla TanStack Compartida con Paginación y Responsive */}
      <Table<TenantPlanInfo>
        columns={columns}
        data={tenants}
        variant="flat"
        maxHeight="560px"
        minHeight="180px"
        loading={loading}
        emptyTitle={searchTerm || statusFilter !== 'all' ? 'Sin coincidencias' : 'Sin organizaciones'}
        emptyMessage={
          searchTerm || statusFilter !== 'all'
            ? 'No se encontraron organizaciones que coincidan con los filtros aplicados.'
            : 'No hay organizaciones registradas en la plataforma.'
        }
        keyExtractor={(t: TenantPlanInfo) => String(t.id)}
        enablePagination={tenants.length > 8}
        initialPageSize={8}
      />

      {/* Resumen al pie de tabla */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Total en vista: <strong className="text-slate-700 font-bold">{tenants.length}</strong> de{' '}
            <strong className="text-slate-700 font-bold">{totalCount}</strong> registradas
          </span>
          {(searchTerm || statusFilter !== 'all') && (
            <>
              <span className="text-slate-300">•</span>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="!text-indigo-600 hover:!text-indigo-800 !p-1 !text-xs font-semibold"
              >
                Limpiar filtros
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
