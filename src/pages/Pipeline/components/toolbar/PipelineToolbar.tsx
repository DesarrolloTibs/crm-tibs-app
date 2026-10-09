import React from 'react';
import {
  Plus,
  Users,
  XCircle,
  Filter,
  ChevronUp,
  ChevronDown,
  Settings2,
  Star,
  Calendar,
  UserCheck,
  Kanban,
} from 'lucide-react';
import UnifiedSearchBar from '../../../../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../../../../components/shared/UnifiedSearchBar';
import StageVisibilitySelector from '../../../../components/shared/StageVisibilitySelector';
import Button from '../../../../components/shared/Button';
import Input from '../../../../components/shared/Input';
import type { Stage, PipelineViewMode } from '../../schemas/pipeline.schema';
import PipelineViewTabs from './PipelineViewTabs';

interface Executive {
  id: string;
  username: string;
}
interface ContactItem {
  id: string;
  name: string;
}

interface Props {
  pipelineName: string;
  pipelineDescription: string;
  viewMode: PipelineViewMode;
  setViewMode: (v: PipelineViewMode) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  contactFilter: string;
  setContactFilter: (v: string) => void;
  contactsList: ContactItem[];
  executiveFilter: string;
  setExecutiveFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  archivedFilter: 'active' | 'archived' | 'all';
  setArchivedFilter: (v: 'active' | 'archived' | 'all') => void;
  priorityFilter: number | null;
  setPriorityFilter: (v: number | null) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  showToolbar: boolean;
  setShowToolbar: (v: boolean) => void;
  stages: Stage[];
  activeStages: Stage[];
  visibleStageIds: string[];
  onVisibilityChange: (id: string) => void;
  executives: Executive[];
  isAdmin: boolean;
  isCustomFilterActive: boolean;
  searchDropdownRef: React.RefObject<HTMLDivElement | null>;
  onNewOpportunity: () => void;
  onOpenSettings: () => void;
  onOpenCustomFilter: () => void;
  onClearFilters: () => void;
  badges: SearchBadge[];
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  totalOpportunitiesCount?: number;
}

export const PipelineToolbar: React.FC<Props> = ({
  pipelineName,
  pipelineDescription,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  contactFilter,
  setContactFilter,
  contactsList,
  executiveFilter,
  setExecutiveFilter,
  statusFilter,
  setStatusFilter,
  archivedFilter,
  setArchivedFilter,
  priorityFilter,
  setPriorityFilter,
  showFilters,
  setShowFilters,
  showToolbar,
  setShowToolbar,
  stages,
  activeStages,
  visibleStageIds,
  onVisibilityChange,
  executives,
  isAdmin,
  searchDropdownRef,
  onNewOpportunity,
  onOpenSettings,
  onOpenCustomFilter,
  onClearFilters,
  badges,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  totalOpportunitiesCount,
}) => (
  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs mb-4 md:mb-6">
    {/* Cabecera Principal del Módulo con Icono Estándar */}
    <div className="flex items-center gap-3.5">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
        <Kanban size={24} />
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          {pipelineName || 'Pipeline Comercial'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          {pipelineDescription || 'Pipeline por defecto para gestionar oportunidades comerciales.'}
        </p>
      </div>
    </div>

    {/* Controles de Búsqueda, Vista y Acciones */}
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
      <UnifiedSearchBar
        ref={searchDropdownRef}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder={
          !executiveFilter &&
          !statusFilter &&
          priorityFilter === null &&
          archivedFilter === 'active' &&
          !startDate &&
          !endDate &&
          !contactFilter
            ? 'Buscar...'
            : ''
        }
        badges={badges}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        dropdownWidthClass="w-[720px]"
      >
        <div className="flex-1 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
            <Filter size={12} /> Filtros
          </h4>
          <Button
            variant="ghost"
            onClick={() =>
              setArchivedFilter(archivedFilter === 'archived' ? 'active' : 'archived')
            }
            className="!justify-between w-full !text-xs sm:!text-sm !text-gray-700 !px-2 !py-1 !rounded"
          >
            <span>Oportunidades Archivadas</span>
            {archivedFilter === 'archived' && (
              <span className="text-indigo-600 font-extrabold text-sm">✓</span>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setArchivedFilter(archivedFilter === 'all' ? 'active' : 'all')
            }
            className="!justify-between w-full !text-xs sm:!text-sm !text-gray-700 !px-2 !py-1 !rounded"
          >
            <span>Todas las Oportunidades</span>
            {archivedFilter === 'all' && (
              <span className="text-indigo-600 font-extrabold text-sm">✓</span>
            )}
          </Button>
          <div className="border-t border-gray-100 my-1 shrink-0" />
          <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-1 shrink-0 select-none">
            Prioridad
          </h5>
          <div className="flex items-center gap-0.5 px-2 py-1">
            {[1, 2, 3].map((star) => (
              <Button
                key={star}
                variant="icon"
                onClick={() =>
                  setPriorityFilter(priorityFilter === star ? null : star)
                }
                title={
                  star === 1 ? 'Baja o mayor' : star === 2 ? 'Media o mayor' : 'Alta'
                }
                className="!p-0.5 hover:!scale-110 !transform"
              >
                <Star
                  size={18}
                  className={
                    priorityFilter !== null && star <= priorityFilter
                      ? 'text-amber-400 fill-current'
                      : 'text-slate-300 hover:text-amber-300'
                  }
                />
              </Button>
            ))}
            {priorityFilter !== null && (
              <span className="text-[10px] text-slate-500 ml-1">
                {priorityFilter === 1 ? 'Baja+' : priorityFilter === 2 ? 'Media+' : 'Alta'}
              </span>
            )}
          </div>
          <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-1 shrink-0 select-none">
            Etapas
          </h5>
          {activeStages.map((stage) => (
            <Button
              key={stage.id}
              variant="ghost"
              onClick={() => setStatusFilter(statusFilter === stage.id ? '' : stage.id)}
              className="!justify-start !gap-2 !text-xs !text-gray-700 !px-2 !py-1 !rounded w-full"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: stage.strcolor || '#3b82f6' }}
              />
              <span className="truncate flex-grow">{stage.strname}</span>
              {statusFilter === stage.id && (
                <span className="text-indigo-600 font-extrabold text-sm ml-auto">✓</span>
              )}
            </Button>
          ))}
          <div className="border-t border-gray-100 my-1 shrink-0" />
          <Button
            variant="ghost"
            onClick={() => {
              setShowFilters(false);
              onOpenCustomFilter();
            }}
            className="!gap-1 !text-xs !text-indigo-600 hover:!text-indigo-800 !px-2 !py-1.5 !rounded w-full !justify-start hover:!bg-indigo-50 !font-bold"
          >
            + Filtro personalizado...
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
            <UserCheck size={12} /> Contactos
          </h4>
          {contactsList.length > 0 ? (
            contactsList.map((c) => (
              <Button
                key={c.id}
                variant="ghost"
                onClick={() => setContactFilter(contactFilter === c.id ? '' : c.id)}
                className="!justify-between !text-xs sm:!text-sm !text-gray-700 !px-2 !py-1 !rounded w-full"
              >
                <span className="truncate" title={c.name}>
                  {c.name}
                </span>
                {contactFilter === c.id && (
                  <span className="text-indigo-600 font-extrabold text-sm">✓</span>
                )}
              </Button>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic px-1 py-2">Sin contactos</p>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
            <Users size={12} /> Ejecutivos
          </h4>
          {executives.map((exec) => (
            <Button
              key={exec.id}
              variant="ghost"
              onClick={() =>
                setExecutiveFilter(executiveFilter === exec.id ? '' : exec.id)
              }
              className="!justify-between !text-xs sm:!text-sm !text-gray-700 !px-2 !py-1 !rounded w-full"
            >
              <span className="truncate">{exec.username}</span>
              {executiveFilter === exec.id && (
                <span className="text-indigo-600 font-extrabold text-sm">✓</span>
              )}
            </Button>
          ))}
          <div className="border-t border-gray-100 my-1 mt-auto shrink-0" />
          <Button
            variant="ghost-danger"
            onClick={onClearFilters}
            className="gap-1.5 w-full !justify-start"
          >
            <XCircle size={12} /> Limpiar Filtros
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
            <Calendar size={12} /> Rango de Fecha
          </h4>
          <div className="flex flex-col gap-3 mt-1 pr-1">
            <Input
              type="date"
              label="Desde"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="!py-2 !rounded-xl !text-xs"
            />
            <Input
              type="date"
              label="Hasta"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="!py-2 !rounded-xl !text-xs"
            />
          </div>
        </div>
      </UnifiedSearchBar>

      <div className="flex items-center gap-2">
        <PipelineViewTabs
          activeView={viewMode}
          onChangeView={setViewMode}
          opportunitiesCount={totalOpportunitiesCount}
        />
        {viewMode === 'kanban' && (
          <StageVisibilitySelector
            stages={stages}
            visibleStageIds={visibleStageIds}
            onVisibilityChange={onVisibilityChange}
            zIndex={20}
            labelSize="sm"
            themeColor="indigo"
            align="responsive"
          />
        )}
      </div>

      {isAdmin && (
        <Button
          title="Configurar Etapas del Pipeline"
          variant="secondary"
          className="gap-2 !py-2 !px-3 text-xs"
          onClick={onOpenSettings}
        >
          <Settings2 size={15} className="text-slate-500" />
          <span className="hidden sm:inline">Etapas</span>
        </Button>
      )}

      <Button
        variant="success"
        onClick={onNewOpportunity}
        className="gap-2 !py-2 !px-4 text-xs font-bold tracking-wide shadow-2xs whitespace-nowrap"
      >
        <Plus size={15} />
        <span>Nueva Oportunidad</span>
      </Button>
    </div>
  </div>
);

export default PipelineToolbar;
