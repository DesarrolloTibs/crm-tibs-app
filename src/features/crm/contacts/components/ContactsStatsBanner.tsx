import React from 'react';
import { Users, UserCheck, Building, UserMinus } from 'lucide-react';
import type { ContactStats } from '../schemas/contacts.schema';

interface ContactsStatsBannerProps {
  stats: ContactStats;
}

export const ContactsStatsBanner: React.FC<ContactsStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
      {/* Total Contactos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Contactos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">registrados</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Users size={20} />
        </div>
      </div>

      {/* Contactos Activos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Contactos Activos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-700/80 font-medium">disponibles</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <UserCheck size={20} />
        </div>
      </div>

      {/* Con Empresa Asignada */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Cuentas B2B / Empresa
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-600 tracking-tight">
              {stats.withCompany}
            </span>
            <span className="text-xs text-violet-700/80 font-medium">vinculados</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
          <Building size={20} />
        </div>
      </div>

      {/* Independientes / Sin Empresa */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Independientes
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-600 tracking-tight">
              {stats.withoutCompany}
            </span>
            <span className="text-xs text-slate-500 font-medium">sin cuenta B2B</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
          <UserMinus size={20} />
        </div>
      </div>
    </div>
  );
};
