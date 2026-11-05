import React, { useMemo } from 'react';
import { Layers, Search, X } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import type { Plan, SubscriptionPlanStatusFilter } from '../schemas/subscriptionPlans.schema';
import { getSubscriptionPlansColumns } from '../utils/subscriptionPlans.columns';

interface SubscriptionPlansTableProps {
  plans: Plan[];
  totalCount: number;
  loading: boolean;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: SubscriptionPlanStatusFilter;
  setStatusFilter: (filter: SubscriptionPlanStatusFilter) => void;
}

export const SubscriptionPlansTable: React.FC<SubscriptionPlansTableProps> = ({
  plans,
  totalCount,
  loading,
  onEdit,
  onDelete,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const columns = useMemo(
    () =>
      getSubscriptionPlansColumns({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Encabezado y Controles estandarizados */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-indigo-600" size={18} />
            Catálogo de Planes de Suscripción
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración global de niveles de servicio, tarifas, cuotas de tokens y periodicidad para inquilinos.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtro de Estado */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar plan por nombre..."
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
        </div>
      </div>

      {/* Tabla compartida estándar TanStack Table */}
      <Table<Plan>
        columns={columns}
        data={plans}
        variant="flat"
        maxHeight="520px"
        minHeight="180px"
        loading={loading}
        emptyTitle={searchTerm ? 'Sin coincidencias' : 'Sin planes registrados'}
        emptyMessage={
          searchTerm
            ? 'No se encontraron planes que coincidan con la búsqueda ingresada.'
            : 'No hay planes de suscripción configurados en la plataforma aún.'
        }
        keyExtractor={(p: Plan) => p.plan_id}
        enablePagination={plans.length > 8}
        initialPageSize={8}
      />

      {/* Resumen al pie de la tabla */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Total en vista: <strong className="text-slate-700 font-bold">{plans.length}</strong> de{' '}
            <strong className="text-slate-700 font-bold">{totalCount}</strong> registrados
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

export default SubscriptionPlansTable;
