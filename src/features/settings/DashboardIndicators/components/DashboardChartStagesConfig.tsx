import React from 'react';
import { BarChart3, CheckCircle2, AlertCircle, CheckSquare, Square } from 'lucide-react';
import Button from '../../../../components/shared/Button';
import type { ChartTab, ChartKey, IndicatorModule } from '../schemas/dashboardIndicators.schema';

interface DashboardChartStagesConfigProps {
  activeModule: IndicatorModule;
  currentTabs: ChartTab[];
  activeChartSetting: ChartKey;
  onSelectChartTab: (tabKey: ChartKey) => void;
  activeChartIndicatorName: string;
  hasSavedIndicator: boolean;
  chartStageIds: string[];
  onToggleChartStage: (stageId: string) => void;
  onSelectAllChartStages: () => void;
  activeStages: Array<{ id: string; strname: string }>;
  onSaveChartSetting: () => Promise<void>;
  savingChart: boolean;
}

export const DashboardChartStagesConfig: React.FC<DashboardChartStagesConfigProps> = ({
  currentTabs,
  activeChartSetting,
  onSelectChartTab,
  activeChartIndicatorName,
  hasSavedIndicator,
  chartStageIds,
  onToggleChartStage,
  onSelectAllChartStages,
  activeStages,
  onSaveChartSetting,
  savingChart,
}) => {
  const allStagesSelected = activeStages.length > 0 && chartStageIds.length === activeStages.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
      {/* Cabecera de la sección */}
      <div className="flex items-start gap-3.5 mb-5 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
          <BarChart3 size={20} />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-800">
            Configuración de Etapas para Gráficos Analíticos
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecciona qué etapas del flujo operativo se contabilizan en cada gráfica de tendencias del dashboard.
          </p>
        </div>
      </div>

      {/* Selector de Pestaña de Gráfico */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl mb-5">
        {currentTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectChartTab(tab.key)}
            className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
              activeChartSetting === tab.key
                ? tab.activeClass
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Indicador de Gráfico Activo & Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Gráfico seleccionado:
          </span>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {activeChartIndicatorName}
          </span>
          {hasSavedIndicator ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <CheckCircle2 size={13} /> Sincronizado
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              Sin regla guardada (Usa todas las etapas)
            </span>
          )}
        </div>

        {activeStages.length > 0 && (
          <button
            type="button"
            onClick={onSelectAllChartStages}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            {allStagesSelected ? (
              <>
                <Square size={13} /> Deseleccionar todas
              </>
            ) : (
              <>
                <CheckSquare size={13} /> Seleccionar todas
              </>
            )}
          </button>
        )}
      </div>

      {/* Cuadrícula de Etapas */}
      <div className="mb-5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">
          Etapas incluidas en este gráfico ({chartStageIds.length} de {activeStages.length} seleccionadas)
        </label>

        {activeStages.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <AlertCircle size={16} className="shrink-0" />
            No hay etapas activas en este módulo. Crea etapas primero desde la configuración de Pipeline o Mesa de Ayuda.
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto">
            {activeStages.map((stage) => {
              const isChecked = chartStageIds.includes(stage.id);
              return (
                <label
                  key={stage.id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 font-medium'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleChartStage(stage.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                  />
                  <span className="text-xs truncate">{stage.strname}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Pie con botón de guardado y feedback explicativo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 leading-snug">
          {chartStageIds.length === 0
            ? 'ℹ️ Sin etapas marcadas: el gráfico incluirá todas las oportunidades o tickets sin discriminar etapa.'
            : `✓ ${chartStageIds.length} etapa${chartStageIds.length !== 1 ? 's' : ''} seleccionada${chartStageIds.length !== 1 ? 's' : ''} para alimentar este gráfico.`}
        </p>
        <Button
          type="button"
          onClick={onSaveChartSetting}
          disabled={savingChart}
          className="shrink-0 w-full sm:w-auto"
        >
          {savingChart ? 'Guardando...' : 'Guardar Configuración de Gráfico'}
        </Button>
      </div>
    </div>
  );
};
