import React from 'react';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SubscriptionPlanStats } from '../schemas/subscriptionPlans.schema';

interface SubscriptionPlansStatsBannerProps {
  stats: SubscriptionPlanStats;
}

export const SubscriptionPlansStatsBanner: React.FC<SubscriptionPlansStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-2">
      {/* Total Planes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Registrados
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">planes</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Layers size={20} />
        </div>
      </div>

      {/* Planes Activos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Activos en Catálogo
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-700/80 font-medium">disponibles</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* Planes Inactivos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Inactivos / Deshabilitados
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-600 tracking-tight">
              {stats.inactive}
            </span>
            <span className="text-xs text-slate-500 font-medium">restringidos</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
          <AlertCircle size={20} />
        </div>
      </div>
    </div>
  );
};
