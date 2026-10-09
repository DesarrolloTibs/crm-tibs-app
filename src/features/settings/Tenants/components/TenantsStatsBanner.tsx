import React from 'react';
import {
  Building2,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Zap,
} from 'lucide-react';
import type { TenantsStats } from '../schemas/tenants.schema';

interface TenantsStatsBannerProps {
  stats: TenantsStats;
}

export const TenantsStatsBanner: React.FC<TenantsStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 mb-2">
      {/* Total Organizaciones */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Inquilinos
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">tenants</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Building2 size={20} />
        </div>
      </div>

      {/* Activas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Activas
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-700/80 font-medium">operando</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* Inactivas / Expiradas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Inactivas / Expiradas
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 tracking-tight">
              {stats.inactive}
            </span>
            <span className="text-xs text-rose-700/80 font-medium">bloqueadas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
          <ShieldAlert size={20} />
        </div>
      </div>

      {/* Con Cola de Renovación */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Con Cola Activa
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {stats.withQueue}
            </span>
            <span className="text-xs text-amber-700/80 font-medium">prepago</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Clock size={20} />
        </div>
      </div>

      {/* Consumo Excedente Permitido */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Sobregiro Permitido
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600 tracking-tight">
              {stats.allowExtra}
            </span>
            <span className="text-xs text-purple-700/80 font-medium">habilitadas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
          <Zap size={20} />
        </div>
      </div>
    </div>
  );
};
