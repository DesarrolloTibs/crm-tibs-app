import React from 'react';
import { Users, Building2 } from 'lucide-react';

export type ClientsActiveTab = 'contacts' | 'companies';

interface ClientsNavTabsProps {
  activeTab: ClientsActiveTab;
  onChangeTab: (tab: ClientsActiveTab) => void;
  contactsCount: number;
  companiesCount: number;
}

export const ClientsNavTabs: React.FC<ClientsNavTabsProps> = ({
  activeTab,
  onChangeTab,
  contactsCount,
  companiesCount,
}) => {
  return (
    <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs select-none">
      {/* Botón Contactos */}
      <button
        type="button"
        onClick={() => onChangeTab('contacts')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'contacts'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
        }`}
      >
        <Users size={15} className={activeTab === 'contacts' ? 'text-indigo-600' : 'text-slate-400'} />
        <span>Contactos</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-colors ${
            activeTab === 'contacts'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              : 'bg-slate-200/70 text-slate-600'
          }`}
        >
          {contactsCount}
        </span>
      </button>

      {/* Botón Empresas */}
      <button
        type="button"
        onClick={() => onChangeTab('companies')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'companies'
            ? 'bg-white text-violet-700 shadow-xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
        }`}
      >
        <Building2 size={15} className={activeTab === 'companies' ? 'text-violet-600' : 'text-slate-400'} />
        <span>Empresas (Cuentas)</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-colors ${
            activeTab === 'companies'
              ? 'bg-violet-50 text-violet-700 border border-violet-100'
              : 'bg-slate-200/70 text-slate-600'
          }`}
        >
          {companiesCount}
        </span>
      </button>
    </div>
  );
};
