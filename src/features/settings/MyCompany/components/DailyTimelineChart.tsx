import React, { useMemo } from 'react';
import { TrendingUp, Calendar, X, Check } from 'lucide-react';
import Badge from '../../../../components/shared/Badge';
import EmptyState from '../../../../components/shared/EmptyState';
import type { DailyTimelineConsumption } from '../schemas/myCompany.schema';
import {
  formatNumber,
  formatTokensCompact,
  formatShortDate,
} from '../utils/myCompany.helpers';

interface DailyTimelineChartProps {
  dailyTimeline?: DailyTimelineConsumption[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onClearDateFilter?: () => void;
}

export const DailyTimelineChart: React.FC<DailyTimelineChartProps> = ({
  dailyTimeline = [],
  selectedDate = null,
  onSelectDate,
  onClearDateFilter,
}) => {
  const maxDailyTokens = useMemo(() => {
    if (!dailyTimeline.length) return 1;
    return Math.max(...dailyTimeline.map(d => d.total_tokens || 0), 1);
  }, [dailyTimeline]);

  // Información del día seleccionado actualmente
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate || !dailyTimeline.length) return null;
    return dailyTimeline.find(d => d.date === selectedDate) || null;
  }, [selectedDate, dailyTimeline]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={18} />
            Actividad Diaria del Asistente
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo del volumen de consultas y respuestas. Haz clic en un día para filtrar el historial de interacciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chip de día seleccionado con acción para quitar selección */}
          {selectedDate && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl text-xs">
              <span className="text-indigo-900 font-semibold flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-600" />
                Día: <strong className="text-indigo-700 capitalize">{formatShortDate(selectedDate)}</strong>
                {selectedDayInfo && (
                  <span className="text-[11px] font-mono text-indigo-700 font-bold bg-white/90 px-1.5 py-0.5 rounded border border-indigo-200">
                    {formatNumber(selectedDayInfo.total_tokens)} recursos
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearDateFilter?.();
                }}
                className="ml-0.5 text-indigo-600 hover:text-indigo-900 p-0.5 rounded-full hover:bg-indigo-200/60 transition-colors cursor-pointer"
                title="Quitar filtro de día (ver todos)"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Si hay un día seleccionado, mostrar el total exacto del día seleccionado; si no, el día pico del período */}
          {selectedDayInfo ? (
            <span className="text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              Total de este día:{' '}
              <strong className="text-indigo-700 font-mono font-bold">
                {formatNumber(selectedDayInfo.total_tokens)} recursos
              </strong>{' '}
              <span className="text-slate-400">({selectedDayInfo.request_count} reqs)</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              Día de Mayor Actividad:{' '}
              <strong className="text-slate-800 font-mono font-bold">
                {formatTokensCompact(maxDailyTokens)} recursos
              </strong>
            </span>
          )}
        </div>
      </div>

      {!dailyTimeline.length ? (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8 text-slate-400" />}
          title="Sin actividad diaria"
          message="No hay registros diarios en el período seleccionado."
          className="py-10"
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {dailyTimeline.map((d: DailyTimelineConsumption) => {
              const heightPct = Math.round(((d.total_tokens || 0) / maxDailyTokens) * 100);
              const isPeak = d.total_tokens === maxDailyTokens && maxDailyTokens > 0;
              const isSelected = selectedDate === d.date;

              return (
                <div
                  key={d.date}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDate?.(d.date)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDate?.(d.date);
                    }
                  }}
                  title={
                    isSelected
                      ? `Haz clic para deseleccionar ${formatShortDate(d.date)} y ver todos los días`
                      : `Haz clic para filtrar interacciones del ${formatShortDate(d.date)}: ${formatNumber(d.total_tokens)} recursos (${d.request_count} reqs)`
                  }
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none relative group ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/80 shadow-md -translate-y-0.5'
                      : isPeak
                      ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-200 hover:border-purple-400 hover:shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/40 hover:border-indigo-300 hover:shadow-xs'
                  } ${selectedDate && !isSelected ? 'opacity-65 hover:opacity-100' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold capitalize transition-colors ${
                      isSelected ? 'text-indigo-900' : 'text-slate-700'
                    }`}>
                      {formatShortDate(d.date)}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSelected ? (
                        <Badge variant="indigo" size="sm" className="!px-1.5 !py-0 gap-0.5">
                          <Check size={10} />
                          <span>Filtro</span>
                        </Badge>
                      ) : isPeak ? (
                        <Badge variant="purple" size="sm">
                          Pico
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="my-2 h-14 flex items-end">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${
                        isSelected
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm'
                          : isPeak
                          ? 'bg-gradient-to-t from-purple-600 to-indigo-500 shadow-sm'
                          : 'bg-gradient-to-t from-indigo-500 to-sky-400 group-hover:from-indigo-600 group-hover:to-sky-500'
                      }`}
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    />
                  </div>

                  <div className={`pt-1 border-t transition-colors ${
                    isSelected ? 'border-indigo-200' : 'border-slate-200/50'
                  }`}>
                    <div
                      className={`text-xs font-black font-mono truncate ${
                        isSelected ? 'text-indigo-950 font-bold' : 'text-slate-900'
                      }`}
                      title={`${formatNumber(d.total_tokens)} recursos exactos`}
                    >
                      {d.total_tokens < 10000 ? formatNumber(d.total_tokens) : formatTokensCompact(d.total_tokens)}
                    </div>
                    <div className={`text-[10px] font-mono ${
                      isSelected ? 'text-indigo-600 font-semibold' : 'text-slate-400'
                    }`}>
                      {formatNumber(d.request_count)} reqs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guía visual de uso interactivo */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
            <span>
              💡 Haz clic sobre cualquier tarjeta de día para ver sus interacciones en el historial inferior.
            </span>
            {selectedDate && (
              <button
                type="button"
                onClick={onClearDateFilter}
                className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
              >
                Quitar selección y mostrar todo el período
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

