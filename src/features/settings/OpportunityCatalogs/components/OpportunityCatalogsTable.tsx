import React, { useMemo } from 'react';
import { Database, Search, X, SlidersHorizontal } from 'lucide-react';
import Table from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import type {
  OpportunityCatalogOption,
  CatalogOptionStatusFilter,
  CatalogOptionUsageFilter,
} from '../schemas/opportunityCatalogs.schema';
import { getOpportunityCatalogsColumns } from '../utils/opportunityCatalogs.columns';

interface OpportunityCatalogsTableProps {
  options: OpportunityCatalogOption[];
  totalCount: number;
  loading: boolean;
  catalogTitle: string;
  onEdit: (option: OpportunityCatalogOption) => void;
  onDelete: (option: OpportunityCatalogOption) => void;
  onToggleStatus: (option: OpportunityCatalogOption) => void;
  onViewOpportunities: (option: OpportunityCatalogOption) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: CatalogOptionStatusFilter;
  setStatusFilter: (filter: CatalogOptionStatusFilter) => void;
  usageFilter: CatalogOptionUsageFilter;
  setUsageFilter: (filter: CatalogOptionUsageFilter) => void;
}

export const OpportunityCatalogsTable: React.FC<OpportunityCatalogsTableProps> = ({
  options,
  totalCount,
  loading,
  catalogTitle,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewOpportunities,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  usageFilter,
  setUsageFilter,
}) => {
  const columns = useMemo(
    () =>
      getOpportunityCatalogsColumns({
        onEdit,
        onDelete,
        onToggleStatus,
        onViewOpportunities,
      }),
    [onEdit, onDelete, onToggleStatus, onViewOpportunities]
  );

  const hasActiveFilters = Boolean(searchTerm || statusFilter !== 'all' || usageFilter !== 'all');

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUsageFilter('all');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5 text-left">
      {/* Encabezado y Controles idénticos al patrón de Tipos de Actividad y Mi Empresa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-indigo-600" size={18} />
            <span>Valores de {catalogTitle}</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Opciones configuradas para la selección comercial en los formularios y filtros de Oportunidades.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtros de Estado y Uso */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Buscador */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${catalogTitle.toLowerCase()}...`}
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

          {/* Filtro de Disponibilidad / Estado */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
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
              Activos
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('inactive')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'inactive'
                  ? '!bg-white !text-slate-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Inactivos
            </Button>
          </div>

          {/* Filtro de Uso en Pipeline */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUsageFilter(usageFilter === 'used' ? 'all' : 'used')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                usageFilter === 'used'
                  ? '!bg-white !text-indigo-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
              title="Filtrar solo opciones asociadas a oportunidades"
            >
              <SlidersHorizontal size={12} className="mr-1 inline" />
              <span>En Pipeline</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla Compartida basada en TanStack Table */}
      <Table<OpportunityCatalogOption>
        columns={columns}
        data={options}
        variant="flat"
        maxHeight="520px"
        minHeight="180px"
        loading={loading}
        skeletonRows={6}
        emptyTitle={searchTerm || hasActiveFilters ? 'Sin coincidencias' : `Sin opciones registradas`}
        emptyMessage={
          searchTerm || hasActiveFilters
            ? `No se encontraron opciones en "${catalogTitle}" con los filtros seleccionados.`
            : `Aún no se han configurado opciones para el catálogo de "${catalogTitle}". Haz clic en "Nueva Opción" para comenzar.`
        }
        keyExtractor={(opt: OpportunityCatalogOption) => opt.id}
        enablePagination={options.length > 8}
        initialPageSize={8}
      />

      {/* Resumen al pie de la tabla idéntico al estándar institucional */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Total en vista: <strong className="text-slate-700 font-bold">{options.length}</strong> de{' '}
            <strong className="text-slate-700 font-bold">{totalCount}</strong> registradas
          </span>
          {hasActiveFilters && (
            <>
              <span className="text-slate-300">•</span>
              <Button
                variant="ghost"
                onClick={handleClearFilters}
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

export default OpportunityCatalogsTable;
