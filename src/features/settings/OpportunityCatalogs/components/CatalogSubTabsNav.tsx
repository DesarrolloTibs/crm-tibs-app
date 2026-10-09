import React from 'react';
import { Briefcase, Truck, KeyRound } from 'lucide-react';
import type { CatalogType } from '../schemas/opportunityCatalogs.schema';
import { CATALOG_SUBTABS } from '../utils/opportunityCatalogs.helpers';

interface CatalogSubTabsNavProps {
  activeSubTab: CatalogType;
  onSubTabChange: (tab: CatalogType) => void;
  getLabelName: (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', defaultName: string) => string;
}

const TAB_ICONS: Record<CatalogType, React.ReactNode> = {
  'business-lines': <Briefcase size={16} />,
  'delivery-types': <Truck size={16} />,
  'licensings': <KeyRound size={16} />,
};

export const CatalogSubTabsNav: React.FC<CatalogSubTabsNavProps> = ({
  activeSubTab,
  onSubTabChange,
  getLabelName,
}) => {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar pb-px">
        {CATALOG_SUBTABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const labelTitle = getLabelName(tab.field_key, tab.defaultName);
          const icon = TAB_ICONS[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSubTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                {icon}
              </span>
              <span>{labelTitle}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CatalogSubTabsNav;
