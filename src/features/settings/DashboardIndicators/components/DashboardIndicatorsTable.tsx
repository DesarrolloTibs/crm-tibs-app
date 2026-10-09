import React, { useMemo } from 'react';
import { LayoutDashboard, Search, X } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import type { DashboardIndicator, IndicatorTypeFilter } from '../schemas/dashboardIndicators.schema';
import { getDashboardIndicatorsColumns } from '../utils/dashboardIndicators.columns';
import { COLOR_OPTIONS } from '../utils/dashboardIndicators.helpers';

interface DashboardIndicatorsTableProps {
  indicators: DashboardIndicator[];
  totalCount: number;
  loading: boolean;
  onEdit: (indicator: DashboardIndicator) => void;
  onDelete: (indicator: DashboardIndicator) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: IndicatorTypeFilter;
  setTypeFilter: (filter: IndicatorTypeFilter) => void;
  colorFilter: 'all' | string;
  setColorFilter: (filter: 'all' | string) => void;
  stages: Array<{ id: string; strname: string }>;
  activeModule: 'commercial' | 'support';
}

export const DashboardIndicatorsTable: React.FC<DashboardIndicatorsTableProps> = ({
  indicators,
  totalCount,
  loading,
  onEdit,
  onDelete,
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  colorFilter,
  setColorFilter,
  stages,
  activeModule,
}) => {
  const columns = useMemo(
    () =>
      getDashboardIndicatorsColumns({
        onEdit,
        onDelete,
        stages,
      }),
    [onEdit, onDelete, stages]
  );

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'all' || colorFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setColorFilter('all');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Encabezado y Controles de Búsqueda / Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="text-indigo-600" size={18} />
            Tarjetas de Indicadores KPI ({activeModule === 'commercial' ? 'Pipeline Comercial' : 'Mesa de Ayuda'})
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración y mapeo de etapas para las tarjetas de analítica en tiempo real del dashboard superior.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Buscador de texto */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar indicador..."
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

          {/* Filtro por Tipo (Solo relevante si es commercial) */}
          {activeModule === 'commercial' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTypeFilter('all')}
                className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                  typeFilter === 'all'
                    ? '!bg-white !text-indigo-700 shadow-xs'
                    : '!text-slate-500 hover:!text-slate-700'
                }`}
              >
                Todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTypeFilter('count')}
                className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                  typeFilter === 'count'
                    ? '!bg-white !text-sky-700 shadow-xs'
                    : '!text-slate-500 hover:!text-slate-700'
                }`}
              >
                Conteo
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTypeFilter('sum')}
                className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                  typeFilter === 'sum'
                    ? '!bg-white !text-emerald-700 shadow-xs'
                    : '!text-slate-500 hover:!text-slate-700'
                }`}
              >
                $ Monto
              </Button>
            </div>
          )}

          {/* Filtro rápido por color */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setColorFilter('all')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                colorFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Todos los colores"
            >
              Colores
            </button>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColorFilter(colorFilter === c.value ? 'all' : c.value)}
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                  colorFilter === c.value ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={`Filtrar por ${c.label}`}
              >
                <span className={`w-3 h-3 rounded-full ${c.bg}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla Compartida TanStack Table */}
      <Table<DashboardIndicator>
        columns={columns}
        data={indicators}
        variant="flat"
        maxHeight="520px"
        minHeight="180px"
        loading={loading}
        emptyTitle={hasActiveFilters ? 'Sin indicadores coincidentes' : 'Sin indicadores configurados'}
        emptyMessage={
          hasActiveFilters
            ? 'No se encontraron tarjetas que coincidan con los criterios de búsqueda o filtro.'
            : 'Aún no has creado tarjetas personalizadas para este módulo. Pulsa el botón superior para crear una.'
        }
        keyExtractor={(ind: DashboardIndicator) => ind.id || ind.title}
        enablePagination={indicators.length > 8}
        initialPageSize={8}
      />

      {/* Resumen al pie de la tabla */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Total en vista: <strong className="text-slate-700 font-bold">{indicators.length}</strong> de{' '}
            <strong className="text-slate-700 font-bold">{totalCount}</strong> configurados
          </span>
          {hasActiveFilters && (
            <>
              <span className="text-slate-300">•</span>
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="!text-xs !p-0 !h-auto text-indigo-600 hover:underline font-semibold"
              >
                Restablecer filtros
              </Button>
            </>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          Las tarjetas creadas se actualizan reactivamente en la cabecera del Dashboard principal.
        </span>
      </div>
    </div>
  );
};
