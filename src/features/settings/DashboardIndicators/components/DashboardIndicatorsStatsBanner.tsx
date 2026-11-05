import React from 'react';
import { LayoutDashboard, Hash, DollarSign, Layers } from 'lucide-react';
import type { DashboardIndicatorStats } from '../schemas/dashboardIndicators.schema';

interface DashboardIndicatorsStatsBannerProps {
  stats: DashboardIndicatorStats;
}

export const DashboardIndicatorsStatsBanner: React.FC<DashboardIndicatorsStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
      {/* Total de Indicadores */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Indicadores KPI
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">tarjetas activas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <LayoutDashboard size={20} />
        </div>
      </div>

      {/* Tarjetas de Conteo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Métricas de Conteo
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600 tracking-tight">
              {stats.countCards}
            </span>
            <span className="text-xs text-sky-700/80 font-medium">volumen</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
          <Hash size={20} />
        </div>
      </div>

      {/* Tarjetas de Suma / Monto */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Métricas Financieras
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats.sumCards}
            </span>
            <span className="text-xs text-emerald-700/80 font-medium">suma de montos</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <DollarSign size={20} />
        </div>
      </div>

      {/* Etapas Monitoreadas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Etapas Monitoreadas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-600 tracking-tight">
              {stats.totalStagesLinked}
            </span>
            <span className="text-xs text-violet-700/80 font-medium">enlazadas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
          <Layers size={20} />
        </div>
      </div>
    </div>
  );
};
