import React from 'react';
import { ArrowRight } from 'lucide-react';
import UnifiedSearchBar from '../shared/UnifiedSearchBar';
import Select from '../shared/Select';
import Input from '../shared/Input';
import type { SearchBadge } from '../shared/UnifiedSearchBar';
import type { DatePeriod, CurrencyFilter, ActiveTab } from '../../hooks/useDashboard';

interface DashboardFilterBarProps {
  searchDropdownRef: React.RefObject<HTMLDivElement | null>;
  activeTab: ActiveTab;
  tableSearch: string;
  onSearchChange: (v: string) => void;
  badges: SearchBadge[];
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  // Source selects
  pipelineOptions: { value: string; label: string }[];
  helpdeskOptions: { value: string; label: string }[];
  executiveOptions: { value: string; label: string }[];
  selectedPipelineId: string;
  selectedHelpdeskId: string;
  selectedExecutiveId: string;
  onPipelineChange: (v: string) => void;
  onHelpdeskChange: (v: string) => void;
  onExecutiveChange: (v: string) => void;
  isAdmin: boolean;
  // Period
  datePeriod: DatePeriod;
  startDate: string;
  endDate: string;
  onSelectPeriod: (p: DatePeriod) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  // Currency
  currencyFilter: CurrencyFilter;
  onCurrencyChange: (v: CurrencyFilter) => void;
  onReset: () => void;
}

const PERIOD_OPTS = [
  { id: 'all' as DatePeriod,     label: 'Todo',      emoji: '∞' },
  { id: 'month' as DatePeriod,   label: 'Mes',       emoji: '30d' },
  { id: 'quarter' as DatePeriod, label: 'Trimestre', emoji: '3M' },
  { id: 'year' as DatePeriod,    label: 'Año',       emoji: '12M' },
];

const CURRENCY_OPTS = [
  { value: 'consolidado' as CurrencyFilter, label: 'Pesos (MXN)', sub: 'Consolidado' },
  { value: 'USD' as CurrencyFilter,         label: 'Dólares',     sub: 'Solo USD'    },
  { value: 'MXN' as CurrencyFilter,         label: 'Pesos',       sub: 'Solo MXN'    },
];

const DashboardFilterBar: React.FC<DashboardFilterBarProps> = (props) => {
  const {
    searchDropdownRef, activeTab, tableSearch, onSearchChange, badges, showFilters, setShowFilters,
    pipelineOptions, helpdeskOptions, executiveOptions,
    selectedPipelineId, selectedHelpdeskId, selectedExecutiveId,
    onPipelineChange, onHelpdeskChange, onExecutiveChange, isAdmin,
    datePeriod, startDate, endDate, onSelectPeriod, onStartDateChange, onEndDateChange,
    currencyFilter, onCurrencyChange, onReset,
  } = props;

  return (
    <div className="flex justify-center w-full my-2">
      <UnifiedSearchBar
        ref={searchDropdownRef}
        className="relative w-full max-w-2xl"
        searchTerm={tableSearch}
        onSearchChange={onSearchChange}
        placeholder={activeTab === 'commercial' ? 'Buscar oportunidades por nombre, cliente o etapa...' : 'Buscar tickets por título, cliente o etapa...'}
        badges={badges}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        dropdownWidthClass="w-full sm:w-[680px]"
        dropdownAlign="left"
      >
        <div className="w-full flex flex-col gap-0">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros del módulo</span>
              {badges.length > 0 && <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{badges.length}</span>}
            </div>
            <button type="button" onClick={onReset} className="text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wide cursor-pointer transition-colors">
              Restablecer todo
            </button>
          </div>

          {/* Source */}
          <div className="bg-slate-50/70 rounded-2xl p-3 mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
              {activeTab === 'commercial' ? '📊 Fuente de datos' : '🎫 Mesa de datos'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeTab === 'commercial' ? (
                <Select label="Pipeline comercial" value={pipelineOptions.find(o=>o.value===selectedPipelineId)} onChange={(opt:any)=>onPipelineChange(opt?.value||'')} options={pipelineOptions} />
              ) : (
                <Select label="Mesa de Ayuda" value={helpdeskOptions.find(o=>o.value===selectedHelpdeskId)} onChange={(opt:any)=>onHelpdeskChange(opt?.value||'')} options={helpdeskOptions} />
              )}
              {isAdmin && <Select label="Ejecutivo responsable" value={executiveOptions.find(o=>o.value===selectedExecutiveId)} onChange={(opt:any)=>onExecutiveChange(opt?.value||'all')} options={executiveOptions} />}
            </div>
          </div>

          {/* Period */}
          <div className="bg-slate-50/70 rounded-2xl p-3 mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">📅 Periodo de registro</p>
            <div className="flex bg-white border border-slate-100 p-1 rounded-xl gap-1 mb-2.5 shadow-sm">
              {PERIOD_OPTS.map(opt => (
                <button key={opt.id} type="button" onClick={() => onSelectPeriod(opt.id)} className={`flex-1 flex flex-col items-center py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer gap-0.5 ${datePeriod===opt.id?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:bg-slate-100'}`}>
                  <span className="text-[9px] opacity-70">{opt.emoji}</span>{opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" label="Desde" value={startDate} onChange={e=>onStartDateChange(e.target.value)} />
              <Input type="date" label="Hasta" value={endDate} onChange={e=>onEndDateChange(e.target.value)} />
            </div>
          </div>

          {/* Currency (commercial only) */}
          {activeTab === 'commercial' && (
            <div className="bg-slate-50/70 rounded-2xl p-3 mb-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">💱 Visualización de moneda</p>
              <div className="flex gap-2">
                {CURRENCY_OPTS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => onCurrencyChange(opt.value)} className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${currencyFilter===opt.value?'bg-indigo-600 border-indigo-600 text-white shadow-sm':'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50'}`}>
                    <span className="text-[10px] font-black">{opt.label}</span>
                    <span className={`text-[9px] mt-0.5 ${currencyFilter===opt.value?'text-indigo-200':'text-slate-400'}`}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Apply */}
          <button type="button" onClick={() => setShowFilters(false)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2">
            <ArrowRight size={13} />
            Aplicar filtros{badges.length > 0 ? ` (${badges.length} activo${badges.length!==1?'s':''})` : ''}
          </button>
        </div>
      </UnifiedSearchBar>
    </div>
  );
};

export default DashboardFilterBar;
