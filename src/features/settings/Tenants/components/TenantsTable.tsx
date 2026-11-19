import React, { useMemo } from 'react';
import { Building2, Search } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import type { TenantPlanInfo, TenantStatusFilter } from '../schemas/tenants.schema';
import { getTenantsColumns } from '../utils/tenants.columns';

interface TenantsTableProps {
  tenants: TenantPlanInfo[];
  totalCount: number;
  loading: boolean;
  onEdit: (tenant: TenantPlanInfo) => void;
  onDelete: (tenant: TenantPlanInfo) => void;
  onToggleAllowExtra: (tenant: TenantPlanInfo) => void;
  onToggleIbmAudio?: (tenant: TenantPlanInfo) => void;
  onOpenQueue: (tenant: TenantPlanInfo) => void;
  queueSummaries: Record<number, { total: number; coverageUntil: string | null }>;
  togglingExtraId: number | null;
  togglingIbmAudioId?: number | null;
  isSuperAdmin?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: TenantStatusFilter;
  setStatusFilter: (filter: TenantStatusFilter) => void;
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  loading,
  onEdit,
  onDelete,
  onToggleAllowExtra,
  onToggleIbmAudio,
  onOpenQueue,
  queueSummaries,
  togglingExtraId,
  togglingIbmAudioId = null,
  isSuperAdmin = false,
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
        onToggleIbmAudio,
        onOpenQueue,
        queueSummaries,
        togglingExtraId,
        togglingIbmAudioId,
        isSuperAdmin,
      }),
    [
      onEdit,
      onDelete,
      onToggleAllowExtra,
      onToggleIbmAudio,
      onOpenQueue,
      queueSummaries,
      togglingExtraId,
      togglingIbmAudioId,
      isSuperAdmin,
    ]
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
          <Input
            size="sm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar por nombre o esquema..."
            inputPrefix={<Search size={14} />}
            containerClassName="w-full sm:w-64"
          />

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
            {isSuperAdmin && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStatusFilter('ibm_audio')}
                className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                  statusFilter === 'ibm_audio'
                    ? '!bg-white !text-indigo-700 shadow-xs'
                    : '!text-slate-500 hover:!text-slate-700'
                }`}
              >
                Audio IBM
              </Button>
            )}
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
        enablePagination
        initialPageSize={10}
      />
    </div>
  );
};
