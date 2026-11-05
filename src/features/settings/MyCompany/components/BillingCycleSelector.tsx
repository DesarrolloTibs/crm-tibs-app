import React from 'react';
import {
  Calendar, Clock, Sparkles, RefreshCw, Search
} from 'lucide-react';
import Badge from '@shared/components/Badge';
import Button from '@shared/components/Button';
import UnifiedSearchBar, { type SearchBadge } from '@shared/components/UnifiedSearchBar';
import type { TenantBillingCycle, TenantConsumptionData, CycleSelectOption } from '../schemas/myCompany.schema';
import { formatCycleDate } from '../utils/myCompany.helpers';

interface BillingCycleSelectorProps {
  consumption: TenantConsumptionData | null;
  billingCycles: TenantBillingCycle[];
  loadingCycles: boolean;
  selectedPeriodMode: 'active' | 'previous' | 'cycle' | 'custom';
  selectedCycleOption: CycleSelectOption;
  previousCycle: TenantBillingCycle | null;
  otherHistoricalCycles: TenantBillingCycle[];
  isHistorical: boolean;
  showPeriodFilters: boolean;
  setShowPeriodFilters: (show: boolean) => void;
  showCustomRangePicker: boolean;
  draftStartDate: string;
  setDraftStartDate: (val: string) => void;
  draftEndDate: string;
  setDraftEndDate: (val: string) => void;
  appliedStartDate: string;
  appliedEndDate: string;
  periodBadges: SearchBadge[];
  transactionSearch: string;
  setTransactionSearch: (val: string) => void;
  loading: boolean;
  onSelectActivePeriod: () => void;
  onSelectPreviousPeriod: () => void;
  onSelectSpecificCycle: (cycle: TenantBillingCycle) => void;
  onToggleCustomRangeMode: () => void;
  onApplyCustomRange: () => void;
}

export const BillingCycleSelector: React.FC<BillingCycleSelectorProps> = ({
  consumption,
  loadingCycles,
  selectedPeriodMode,
  selectedCycleOption,
  previousCycle,
  otherHistoricalCycles,
  isHistorical,
  showPeriodFilters,
  setShowPeriodFilters,
  showCustomRangePicker,
  draftStartDate,
  setDraftStartDate,
  draftEndDate,
  setDraftEndDate,
  appliedStartDate,
  appliedEndDate,
  periodBadges,
  transactionSearch,
  setTransactionSearch,
  loading,
  onSelectActivePeriod,
  onSelectPreviousPeriod,
  onSelectSpecificCycle,
  onToggleCustomRangeMode,
  onApplyCustomRange,
}) => {
  return (
    <div className="space-y-4">
      {/* BARRA DE SELECCIÓN DE PERÍODO Y BÚSQUEDA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">
                  Período de Facturación & Búsqueda
                </h4>
                {isHistorical ? (
                  <Badge variant="purple" size="sm">
                    Histórico
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>
                    Período Actual
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte el período en curso, el ciclo anterior o filtre por rango de fechas personalizado.
              </p>
            </div>
          </div>

          {/* Buscador y Selector de Período Unificado */}
          <div className="w-full lg:w-[480px] shrink-0">
            <UnifiedSearchBar
              searchTerm={transactionSearch}
              onSearchChange={setTransactionSearch}
              placeholder="Buscar por fecha, canal, origen, acción..."
              badges={periodBadges}
              showFilters={showPeriodFilters}
              setShowFilters={setShowPeriodFilters}
              dropdownWidthClass="w-full sm:w-[480px]"
              dropdownAlign="right"
            >
              <div className="w-full flex flex-col gap-3">
                {/* Encabezado del dropdown */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Sugerencias de Período
                    </span>
                    {loadingCycles && (
                      <RefreshCw size={11} className="animate-spin text-indigo-500" />
                    )}
                    {isHistorical && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Histórico
                      </span>
                    )}
                  </div>
                  {isHistorical && (
                    <Button
                      variant="ghost-danger"
                      onClick={onSelectActivePeriod}
                      className="!text-[10px] !uppercase !tracking-wide !font-bold !py-1 !px-2"
                    >
                      Restablecer a actual
                    </Button>
                  )}
                </div>

                {/* Sugerencias de período */}
                <div className="space-y-2">
                  {/* Opción 1: Período actual "Default" */}
                  <button
                    type="button"
                    onClick={onSelectActivePeriod}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      selectedPeriodMode === 'active'
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      selectedPeriodMode === 'active' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <Sparkles size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Período actual
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Default
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ciclo de facturación en curso (tiempo real)
                        {consumption?.next_renewal_date && ` · Corte: ${formatCycleDate(consumption.next_renewal_date)}`}
                      </p>
                    </div>
                  </button>

                  {/* Opción 2: Período anterior */}
                  <button
                    type="button"
                    onClick={onSelectPreviousPeriod}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      selectedPeriodMode === 'previous'
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      selectedPeriodMode === 'previous' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Período anterior
                        </span>
                        {previousCycle && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {previousCycle.status === 'closed' ? 'Cerrado' : 'Reemplazado'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {previousCycle ? (
                          <>
                            {formatCycleDate(previousCycle.start_date)} - {formatCycleDate(previousCycle.closed_at || previousCycle.end_date)}
                            {previousCycle.plan_name && ` (${previousCycle.plan_name})`}
                          </>
                        ) : (
                          'Mes anterior inmediato'
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Opción 3: Rango de fechas personalizado */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      selectedPeriodMode === 'custom' || showCustomRangePicker
                        ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={onToggleCustomRangeMode}
                      className="w-full text-left flex items-start gap-3 cursor-pointer"
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        selectedPeriodMode === 'custom' || showCustomRangePicker ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'
                      }`}>
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            Rango de fechas
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600">
                            Personalizado
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Definir intervalo específico entre fechas
                        </p>
                      </div>
                    </button>

                    {/* Controles de fecha (opera en borrador) */}
                    {(selectedPeriodMode === 'custom' || showCustomRangePicker) && (
                      <div
                        className="mt-3 pt-3 border-t border-indigo-100/70 space-y-2.5 animate-fade-in"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white border border-slate-200 rounded-lg p-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              Desde
                            </label>
                            <input
                              type="date"
                              value={draftStartDate}
                              onChange={e => setDraftStartDate(e.target.value)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer p-0"
                            />
                          </div>
                          <div className="bg-white border border-slate-200 rounded-lg p-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              Hasta
                            </label>
                            <input
                              type="date"
                              value={draftEndDate}
                              onChange={e => setDraftEndDate(e.target.value)}
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer p-0"
                            />
                          </div>
                        </div>

                        <Button
                          variant="indigo"
                          onClick={onApplyCustomRange}
                          disabled={!draftStartDate || !draftEndDate || loading}
                          className="w-full !py-2 !text-xs !font-bold !normal-case !tracking-normal gap-1.5 shadow-xs"
                        >
                          <Search size={13} />
                          <span>Aplicar Rango de Fechas</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Otros ciclos históricos si existen */}
                {otherHistoricalCycles.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Otros ciclos históricos ({otherHistoricalCycles.length})
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {otherHistoricalCycles.map(c => {
                        const isThisSelected = selectedCycleOption.cycleId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => onSelectSpecificCycle(c)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isThisSelected
                                ? 'bg-indigo-50 font-bold text-indigo-700'
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="truncate">
                              {formatCycleDate(c.start_date)} - {formatCycleDate(c.closed_at || c.end_date)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                              {c.plan_name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </UnifiedSearchBar>
          </div>
        </div>
      </div>

      {/* INDICADOR DE MODO HISTÓRICO */}
      {isHistorical && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Clock size={18} />
            </div>
            <div className="text-xs leading-relaxed">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>Visualizando auditoría de período histórico</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold">
                  Solo Lectura
                </span>
              </div>
              <p className="text-amber-800 mt-1">
                {selectedPeriodMode === 'previous' && previousCycle && (
                  <>
                    Ciclo cerrado del <strong>{formatCycleDate(previousCycle.start_date)}</strong> al{' '}
                    <strong>{formatCycleDate(previousCycle.closed_at || previousCycle.end_date)}</strong>
                    {previousCycle.plan_name && ` (Plan: ${previousCycle.plan_name})`}
                  </>
                )}
                {selectedPeriodMode === 'cycle' && selectedCycleOption.cycle && (
                  <>
                    Ciclo del <strong>{formatCycleDate(selectedCycleOption.cycle.start_date)}</strong> al{' '}
                    <strong>{formatCycleDate(selectedCycleOption.cycle.closed_at || selectedCycleOption.cycle.end_date)}</strong>
                    {selectedCycleOption.cycle.plan_name && ` (Plan: ${selectedCycleOption.cycle.plan_name})`}
                  </>
                )}
                {selectedPeriodMode === 'custom' && (
                  <>
                    Intervalo personalizado desde <strong>{appliedStartDate || 'Inicio'}</strong> hasta{' '}
                    <strong>{appliedEndDate || 'Fin'}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={onSelectActivePeriod}
            className="!py-1.5 !px-3 !text-xs font-bold self-start sm:self-center shrink-0 bg-white hover:!bg-amber-100 !border-amber-300 text-amber-900 shadow-2xs"
          >
            Volver al período actual
          </Button>
        </div>
      )}
    </div>
  );
};
