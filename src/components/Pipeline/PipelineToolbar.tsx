import React from 'react';
import { Plus, Users, XCircle, Filter, ChevronUp, ChevronDown, Settings2, Star, Kanban as KanbanIcon, List as ListIcon, FileText, FileSpreadsheet, Calendar, UserCheck } from 'lucide-react';
import UnifiedSearchBar from '../shared/UnifiedSearchBar';
import type { SearchBadge } from '../shared/UnifiedSearchBar';
import StageVisibilitySelector from '../shared/StageVisibilitySelector';
import Button from '../shared/Button';
import Input from '../shared/Input';
import type { Stage } from '../../core/models/Opportunity';

interface Executive { id: string; username: string; }
interface ContactItem { id: string; name: string; }

interface Props {
  pipelineName: string;
  pipelineDescription: string;
  viewMode: 'kanban' | 'list';
  setViewMode: (v: 'kanban' | 'list') => void;
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
  onExportPDF: () => void;
  onExportCSV: () => void;
  badges: SearchBadge[];
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
}

const PipelineToolbar: React.FC<Props> = ({
  pipelineName, pipelineDescription, viewMode, setViewMode,
  searchTerm, setSearchTerm, contactFilter, setContactFilter, contactsList,
  executiveFilter, setExecutiveFilter,
  statusFilter, setStatusFilter, archivedFilter, setArchivedFilter,
  priorityFilter, setPriorityFilter, showFilters, setShowFilters,
  showToolbar, setShowToolbar, stages, activeStages, visibleStageIds,
  onVisibilityChange, executives, isAdmin, searchDropdownRef,
  onNewOpportunity, onOpenSettings, onOpenCustomFilter, onClearFilters,
  onExportPDF, onExportCSV, badges,
  startDate, setStartDate, endDate, setEndDate,
}) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
    <div className="flex justify-between items-start w-full md:w-auto">
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{pipelineName}</h1>
        {pipelineDescription && <p className="text-sm text-gray-500 mt-0.5">{pipelineDescription}</p>}
      </div>
      <button className="md:hidden p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-full transition-colors" onClick={() => setShowToolbar(!showToolbar)}>
        {showToolbar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>

    <div className={`${showToolbar ? 'flex' : 'hidden'} md:flex flex-col sm:flex-row w-full md:w-auto gap-3`}>
      <UnifiedSearchBar
        ref={searchDropdownRef}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder={!executiveFilter && !statusFilter && priorityFilter === null && archivedFilter === 'active' && !startDate && !endDate && !contactFilter ? 'Buscar...' : ''}
        badges={badges}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        dropdownWidthClass="w-[720px]"
      >
        <div className="flex-1 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none"><Filter size={12} /> Filtros</h4>
          <button type="button" onClick={() => setArchivedFilter(archivedFilter==='archived'?'active':'archived')} className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
            <span>Oportunidades Archivadas</span>{archivedFilter==='archived' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
          </button>
          <button type="button" onClick={() => setArchivedFilter(archivedFilter==='all'?'active':'all')} className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
            <span>Todas las Oportunidades</span>{archivedFilter==='all' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
          </button>
          <div className="border-t border-gray-100 my-1 shrink-0" />
          <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-1 shrink-0 select-none">Prioridad</h5>
          <div className="flex items-center gap-0.5 px-2 py-1">
            {[1,2,3].map(star => (
              <button key={star} type="button" onClick={() => setPriorityFilter(priorityFilter===star?null:star)} title={star===1?'Baja o mayor':star===2?'Media o mayor':'Alta'} className="p-0.5 transition-transform hover:scale-110 cursor-pointer">
                <Star size={18} className={priorityFilter!==null && star<=priorityFilter?'text-amber-400 fill-current':'text-slate-300 hover:text-amber-300'} />
              </button>
            ))}
            {priorityFilter!==null && <span className="text-[10px] text-slate-500 ml-1">{priorityFilter===1?'Baja+':priorityFilter===2?'Media+':'Alta'}</span>}
          </div>
          <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-1 shrink-0 select-none">Etapas</h5>
          {activeStages.map(stage => (
            <button key={stage.id} type="button" onClick={() => setStatusFilter(statusFilter===stage.id?'':stage.id)} className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.strcolor||'#3b82f6' }} />
              <span className="truncate flex-grow">{stage.strname}</span>
              {statusFilter===stage.id && <span className="text-indigo-600 font-extrabold text-sm ml-auto">✓</span>}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1 shrink-0" />
          <button type="button" onClick={() => { setShowFilters(false); onOpenCustomFilter(); }} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1.5 rounded w-full text-left hover:bg-indigo-50 transition-colors cursor-pointer shrink-0 font-bold">+ Filtro personalizado...</button>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none"><UserCheck size={12} /> Contactos</h4>
          {contactsList.length > 0 ? (
            contactsList.map(c => (
              <button key={c.id} type="button" onClick={() => setContactFilter(contactFilter===c.id?'':c.id)} className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
                <span className="truncate" title={c.name}>{c.name}</span>{contactFilter===c.id && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic px-1 py-2">Sin contactos</p>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none"><Users size={12} /> Ejecutivos</h4>
          {executives.map(exec => (
            <button key={exec.id} type="button" onClick={() => setExecutiveFilter(executiveFilter===exec.id?'':exec.id)} className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer">
              <span className="truncate">{exec.username}</span>{executiveFilter===exec.id && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1 mt-auto shrink-0" />
          <button type="button" onClick={onClearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0"><XCircle size={12} /> Limpiar Filtros</button>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none"><Calendar size={12} /> Rango de Fecha</h4>
          <div className="flex flex-col gap-3 mt-1 pr-1">
            <Input type="date" label="Desde" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="!py-2 !rounded-xl !text-xs" />
            <Input type="date" label="Hasta" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="!py-2 !rounded-xl !text-xs" />
          </div>
        </div>
      </UnifiedSearchBar>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden p-0.5 bg-gray-50 shadow-sm shrink-0">
          <button type="button" onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${viewMode==='kanban'?'bg-white text-blue-600 shadow-sm':'text-slate-500 hover:text-slate-700'}`} title="Vista Kanban">
            <KanbanIcon size={14} /><span>Kanban</span>
          </button>
          <button type="button" onClick={() => setViewMode('list')} className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${viewMode==='list'?'bg-white text-blue-600 shadow-sm':'text-slate-500 hover:text-slate-700'}`} title="Vista Lista">
            <ListIcon size={14} /><span>Lista</span>
          </button>
        </div>
        {viewMode==='kanban' && <StageVisibilitySelector stages={stages} visibleStageIds={visibleStageIds} onVisibilityChange={onVisibilityChange} zIndex={20} labelSize="sm" themeColor="blue" align="left" />}
      </div>

      {viewMode==='list' && (
        <>
          <Button type="button" onClick={onExportPDF} variant="secondary" className="text-red-500 border border-blue-100 hover:bg-red-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider">
            <FileText size={16} className="text-red-500 mr-2" /><span>PDF</span>
          </Button>
          <Button type="button" onClick={onExportCSV} variant="secondary" className="text-emerald-600 border border-blue-100 hover:bg-emerald-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider">
            <FileSpreadsheet size={16} className="text-emerald-600 mr-2" /><span>EXCEL</span>
          </Button>
        </>
      )}

      <Button variant="success" className="w-full sm:w-auto h-[38px] py-0 px-4 whitespace-nowrap" onClick={onNewOpportunity}>
        <Plus size={18} className="mr-2" /> Nueva Oportunidad
      </Button>
      {isAdmin && (
        <Button title="Configurar Pipeline" variant="secondary" className="w-full sm:w-auto h-[38px] py-0 px-3 whitespace-nowrap flex items-center justify-center" onClick={onOpenSettings}>
          <Settings2 size={18} className="sm:mr-2" /><span className="hidden sm:inline"></span>
        </Button>
      )}
    </div>
  </div>
);

export default PipelineToolbar;
