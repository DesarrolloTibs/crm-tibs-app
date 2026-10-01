import React from 'react';
import { Building2, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import type { CompanyStats } from '../schemas/companies.schema';

interface CompaniesStatsBannerProps {
  stats: CompanyStats;
}

export const CompaniesStatsBanner: React.FC<CompaniesStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
      {/* Total Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Empresas B2B
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">cuentas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
          <Building2 size={20} />
        </div>
      </div>

      {/* Cuentas Activas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Cuentas Activas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-700/80 font-medium">operativas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* Con Contactos Vinculados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Con Contactos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">
              {stats.withContacts}
            </span>
            <span className="text-xs text-indigo-700/80 font-medium">con nómina</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Users size={20} />
        </div>
      </div>

      {/* Cuentas Inactivas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Suspendidas / Inactivas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-600 tracking-tight">
              {stats.inactive}
            </span>
            <span className="text-xs text-slate-500 font-medium">bloqueadas</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
          <AlertCircle size={20} />
        </div>
      </div>
    </div>
  );
};
