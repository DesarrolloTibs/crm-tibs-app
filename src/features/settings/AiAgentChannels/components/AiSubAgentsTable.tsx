import React, { useMemo } from 'react';
import { Sliders, Search, X, Plus, Brain } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import type { SubAgent, SubAgentStatusFilter } from '../schemas/aiAgent.schema';
import { getSubAgentsColumns } from '../utils/subAgents.columns';

interface AiSubAgentsTableProps {
  subAgents: SubAgent[];
  totalCount: number;
  loading: boolean;
  onEdit: (agent: SubAgent) => void;
  onDelete: (agent: SubAgent) => void;
  onToggleStatus: (agent: SubAgent) => void;
  onCreate: () => void;
  onOpenRouterModal?: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: SubAgentStatusFilter;
  setStatusFilter: (filter: SubAgentStatusFilter) => void;
}

export const AiSubAgentsTable: React.FC<AiSubAgentsTableProps> = ({
  subAgents,
  totalCount,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
  onOpenRouterModal,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const columns = useMemo(
    () =>
      getSubAgentsColumns({
        onEdit,
        onDelete,
        onToggleStatus,
      }),
    [onEdit, onDelete, onToggleStatus]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Encabezado y controles de búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Sliders className="text-indigo-600" size={17} />
            Catálogo y Matriz de Sub-Agentes
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión detallada de roles, herramientas asignadas y calibración de temperatura de cada agente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o clave..."
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
                  ? '!bg-white !text-indigo-700 shadow-2xs'
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
                  ? '!bg-white !text-emerald-700 shadow-2xs'
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
                  ? '!bg-white !text-slate-700 shadow-2xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Inactivos
            </Button>
          </div>

          {/* Directivas del Router */}
          {onOpenRouterModal && (
            <button
              type="button"
              onClick={onOpenRouterModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Configurar directivas del Router Principal"
            >
              <Brain size={12} className="text-indigo-600" />
              <span>Router</span>
            </button>
          )}

          {/* Botón "+ Nuevo Sub-Agente" */}
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer border-none"
          >
            <Plus size={13} />
            <span>Nuevo Sub-Agente</span>
          </button>
        </div>
      </div>

      {/* Tabla TanStack */}
      <Table<SubAgent>
        columns={columns}
        data={subAgents}
        variant="flat"
        maxHeight="460px"
        minHeight="160px"
        loading={loading}
        emptyTitle={searchTerm ? 'Sin coincidencias' : 'Sin sub-agentes'}
        emptyMessage={
          searchTerm
            ? 'No se encontraron sub-agentes que coincidan con los criterios de búsqueda.'
            : 'No hay sub-agentes registrados en este tenant.'
        }
        keyExtractor={(agent: SubAgent) => agent.id || agent.key}
        enablePagination={subAgents.length > 6}
        initialPageSize={6}
      />

      {/* Footer de resumen */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 pt-1">
        <span>
          Visualizando <strong className="text-slate-700 font-bold">{subAgents.length}</strong> de{' '}
          <strong className="text-slate-700 font-bold">{totalCount}</strong> sub-agentes configurados
        </span>
        {(searchTerm || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="!text-xs !p-0 !h-auto text-indigo-600 hover:underline"
          >
            Restablecer filtros
          </Button>
        )}
      </div>
    </div>
  );
};
