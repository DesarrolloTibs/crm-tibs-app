import React from 'react';
import {
  Kanban as KanbanIcon, List as ListIcon, Plus, Settings2,
  Filter, Tag, Star, XCircle, FileText, FileSpreadsheet,
} from 'lucide-react';
import UnifiedSearchBar from '../shared/UnifiedSearchBar';
import type { SearchBadge } from '../shared/UnifiedSearchBar';
import StageVisibilitySelector from '../shared/StageVisibilitySelector';
import Button from '../shared/Button';
import type { TicketStage } from '../../core/models/Ticket';

interface Props {
  helpdesk: { strname?: string; strdescription?: string | null } | null;
  viewMode: 'kanban' | 'list';
  setViewMode: (v: 'kanban' | 'list') => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  priorityFilter: number | 'all';
  setPriorityFilter: (v: number | 'all') => void;
  incidenceTypeFilter: string;
  setIncidenceTypeFilter: (v: string) => void;
  archivedFilter: 'active' | 'archived' | 'all';
  setArchivedFilter: (v: 'active' | 'archived' | 'all') => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  stages: TicketStage[];
  visibleStageIds: string[];
  onVisibilityChange: (id: string) => void;
  uniqueIncidenceTypes: string[];
  isAdmin: boolean;
  searchDropdownRef: React.RefObject<HTMLDivElement | null>;
  onNewTicket: () => void;
  onOpenSettings: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  badges: SearchBadge[];
}

const HelpdeskToolbar: React.FC<Props> = ({
  viewMode, setViewMode, searchTerm, setSearchTerm,
  priorityFilter, setPriorityFilter, incidenceTypeFilter, setIncidenceTypeFilter,
  archivedFilter, setArchivedFilter, showFilters, setShowFilters,
  stages, visibleStageIds, onVisibilityChange, uniqueIncidenceTypes,
  isAdmin, searchDropdownRef, onNewTicket, onOpenSettings,
  onExportPDF, onExportCSV, badges,
}) => (
  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 flex-wrap">
    <UnifiedSearchBar
      ref={searchDropdownRef}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      placeholder={priorityFilter === 'all' && incidenceTypeFilter === 'all' ? 'Buscar ticket...' : ''}
      badges={badges}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      dropdownWidthClass="w-[340px]"
      dropdownAlign="left"
    >
      <div className="flex-1 flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
        <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
          <Filter size={11} /> Filtros
        </h4>
        <button type="button" onClick={() => setArchivedFilter(archivedFilter === 'archived' ? 'active' : 'archived')} className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer font-semibold">
          <span>Tickets Archivados</span>
          {archivedFilter === 'archived' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
        </button>
        <button type="button" onClick={() => setArchivedFilter(archivedFilter === 'all' ? 'active' : 'all')} className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer font-semibold">
          <span>Todos los Tickets</span>
          {archivedFilter === 'all' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
        </button>
        <div className="border-t border-gray-100 my-1 shrink-0" />
        <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-0.5 shrink-0 select-none">Prioridad</h5>
        <div className="flex items-center gap-0.5 px-2 py-1">
          {[1, 2, 3].map(star => (
            <button key={star} type="button" onClick={() => setPriorityFilter(priorityFilter === star ? 'all' : star)} title={star === 1 ? 'Baja' : star === 2 ? 'Media' : 'Alta'} className="p-0.5 transition-transform hover:scale-110 cursor-pointer">
              <Star size={18} className={priorityFilter !== 'all' && typeof priorityFilter === 'number' && priorityFilter > 0 && star <= priorityFilter ? 'text-amber-400 fill-current' : 'text-slate-300 hover:text-amber-300'} />
            </button>
          ))}
          {priorityFilter !== 'all' && (
            <span className="text-[10px] text-slate-500 ml-1">{priorityFilter === 0 ? 'Sin prioridad' : priorityFilter === 1 ? 'Baja' : priorityFilter === 2 ? 'Media' : 'Alta'}</span>
          )}
        </div>
        <div className="border-t border-gray-100 my-1 shrink-0" />
        <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-0.5 shrink-0 select-none">Etapas</h5>
        {stages.filter(s => s.blnstatus).map(stage => (
          <button key={stage.id} type="button" onClick={() => setShowFilters(false)} className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.strcolor || '#6366f1' }} />
            <span className="truncate">{stage.strname}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-1 border-l border-gray-100 pl-4 max-h-[300px] overflow-y-auto">
        <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
          <Tag size={11} /> Tipo de Incidencia
        </h4>
        <button type="button" onClick={() => setIncidenceTypeFilter('all')} className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
          <span>Todos</span>
          {incidenceTypeFilter === 'all' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
        </button>
        {uniqueIncidenceTypes.filter(Boolean).map(type => (
          <button key={type} type="button" onClick={() => setIncidenceTypeFilter(incidenceTypeFilter === type ? 'all' : type)} className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
            <span className="truncate">{type}</span>
            {incidenceTypeFilter === type && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
          </button>
        ))}
        <div className="border-t border-gray-100 my-1 mt-auto shrink-0" />
        <button type="button" onClick={() => { setPriorityFilter('all'); setIncidenceTypeFilter('all'); setSearchTerm(''); setArchivedFilter('active'); }} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0">
          <XCircle size={12} /> Limpiar Filtros
        </button>
      </div>
    </UnifiedSearchBar>

    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="flex border border-gray-300 rounded-lg overflow-hidden p-0.5 bg-gray-50 shadow-sm shrink-0">
        <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="Vista Kanban">
          <KanbanIcon size={14} /><span>Kanban</span>
        </button>
        <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="Vista Lista">
          <ListIcon size={14} /><span>Lista</span>
        </button>
      </div>
      {viewMode === 'kanban' && (
        <StageVisibilitySelector stages={stages} visibleStageIds={visibleStageIds} onVisibilityChange={onVisibilityChange} zIndex={50} labelSize="xs" themeColor="indigo" align="responsive" />
      )}
    </div>

    {viewMode === 'list' && (
      <>
        <Button type="button" onClick={onExportPDF} variant="secondary" className="text-red-500 border border-blue-100 hover:bg-red-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider">
          <FileText size={16} className="text-red-500 mr-2" /><span>PDF</span>
        </Button>
        <Button type="button" onClick={onExportCSV} variant="secondary" className="text-emerald-600 border border-blue-100 hover:bg-emerald-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider">
          <FileSpreadsheet size={16} className="text-emerald-600 mr-2" /><span>EXCEL</span>
        </Button>
      </>
    )}

    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Button onClick={onNewTicket} variant="success" className="flex-1 sm:flex-none">
        <Plus size={18} className="mr-2" /> Nuevo Ticket
      </Button>
      {isAdmin && (
        <Button title="Configurar Mesa de Ayuda" variant="secondary" className="shrink-0 !py-2.5 !px-3.5" onClick={onOpenSettings}>
          <Settings2 size={18} />
        </Button>
      )}
    </div>
  </div>
);

export default HelpdeskToolbar;
