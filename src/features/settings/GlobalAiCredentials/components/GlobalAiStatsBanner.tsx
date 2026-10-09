import React from 'react';
import { Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { GlobalAiStats } from '../schemas/globalAiCredentials.schema';

interface GlobalAiStatsBannerProps {
  stats: GlobalAiStats;
}

export const GlobalAiStatsBanner: React.FC<GlobalAiStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-2">
      {/* Motor Activo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Motor LLM Activo
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-indigo-700 tracking-tight truncate max-w-[140px]">
              {stats.activeProviderName}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5 block truncate max-w-[140px]">
            {stats.activeModelName}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Cpu size={20} />
        </div>
      </div>

      {/* Proveedores Configurados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Credenciales Listas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats.configuredProviders}
            </span>
            <span className="text-xs text-slate-500 font-medium">de {stats.totalProviders} motores</span>
          </div>
          <span className="text-[10px] text-emerald-700/80 font-medium mt-0.5 block">
            {stats.configuredProviders === stats.totalProviders ? 'Todos habilitados' : 'Disponibles para inferencia'}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* Ámbito de Seguridad */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Ámbito de Acceso
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-amber-700 tracking-tight">
              SuperAdmin
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            Aislado de inquilinos
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
          <ShieldCheck size={20} />
        </div>
      </div>
    </div>
  );
};

export default GlobalAiStatsBanner;
