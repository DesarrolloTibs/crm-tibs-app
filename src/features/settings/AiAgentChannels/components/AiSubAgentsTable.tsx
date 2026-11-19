import React, { useMemo } from 'react';
import { Sliders, Search, Plus, Brain } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
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
          <Input
            size="sm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar por nombre o clave..."
            inputPrefix={<Search size={14} />}
            containerClassName="w-full sm:w-60"
          />

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
            <Button
              size="xs"
              variant="secondary"
              onClick={onOpenRouterModal}
              className="!text-[11px] bg-slate-50 hover:!bg-slate-100 border-slate-200 shadow-2xs hover:translate-y-0"
              title="Configurar directivas del Router Principal"
            >
              <Brain size={12} className="text-indigo-600" />
              <span>Router</span>
            </Button>
          )}

          {/* Botón "+ Nuevo Sub-Agente" */}
          <Button
            size="xs"
            variant="indigo"
            onClick={onCreate}
            className="!text-[11px] gap-1.5 !px-3 shadow-xs hover:translate-y-0"
          >
            <Plus size={13} />
            <span>Nuevo Sub-Agente</span>
          </Button>
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
        enablePagination
        initialPageSize={10}
      />
    </div>
  );
};
