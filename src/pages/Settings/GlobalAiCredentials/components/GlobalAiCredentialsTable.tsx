import React, { useMemo } from 'react';
import { KeyRound, Search, X } from 'lucide-react';
import Table from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import type {
  LlmProviderItem,
  LlmStatusFilter,
} from '../schemas/globalAiCredentials.schema';
import { getGlobalAiColumns } from '../utils/globalAiCredentials.columns';

interface GlobalAiCredentialsTableProps {
  providers: LlmProviderItem[];
  totalCount: number;
  loading: boolean;
  onConfigure: (provider: LlmProviderItem) => void;
  onSetDefault: (provider: LlmProviderItem) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: LlmStatusFilter;
  setStatusFilter: (filter: LlmStatusFilter) => void;
}

export const GlobalAiCredentialsTable: React.FC<GlobalAiCredentialsTableProps> = ({
  providers,
  totalCount,
  loading,
  onConfigure,
  onSetDefault,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const columns = useMemo(
    () =>
      getGlobalAiColumns({
        onConfigure,
        onSetDefault,
      }),
    [onConfigure, onSetDefault]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Encabezado y Controles idénticos al patrón de Tipos de Actividad y Mi Empresa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="text-indigo-600" size={18} />
            Catálogo de Proveedores & Credenciales LLM
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Estado de conexión, llaves secretas de API y parámetros de vectorización por motor.
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
              placeholder="Buscar motor por nombre..."
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
              onClick={() => setStatusFilter('configured')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'configured'
                  ? '!bg-white !text-emerald-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Configurados
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('pending')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? '!bg-white !text-amber-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Pendientes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla TanStack Table */}
      <Table<LlmProviderItem>
        columns={columns}
        data={providers}
        variant="flat"
        maxHeight="520px"
        minHeight="180px"
        loading={loading}
        emptyTitle={searchTerm ? 'Sin coincidencias' : 'Sin proveedores'}
        emptyMessage={
          searchTerm
            ? 'No se encontraron motores o proveedores que coincidan con la búsqueda.'
            : 'No hay proveedores registrados en el catálogo.'
        }
        keyExtractor={(item: LlmProviderItem) => item.id}
        enablePagination={false}
      />

      {/* Resumen al pie de la tabla idéntico al estándar de Tipos de Actividad */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Total en vista: <strong className="text-slate-700 font-bold">{providers.length}</strong> de{' '}
            <strong className="text-slate-700 font-bold">{totalCount}</strong> motores
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

export default GlobalAiCredentialsTable;
