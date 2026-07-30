import React from 'react';
import OpportunityCatalogSettings from '../OpportunityLabel/OpportunityCatalogSettings';

type CatalogSubTab = 'business-lines' | 'delivery-types' | 'licensings';

interface CatalogSubTabsPanelProps {
  activeSubTab: CatalogSubTab;
  onSubTabChange: (id: CatalogSubTab) => void;
  getLabelName: (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', def: string) => string;
}

const CatalogSubTabsPanel: React.FC<CatalogSubTabsPanelProps> = ({
  activeSubTab,
  onSubTabChange,
  getLabelName,
}) => {
  const subTabs: { id: CatalogSubTab; key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento'; def: string; catalog: CatalogSubTab }[] = [
    { id: 'business-lines', key: 'linea_negocio', def: 'Línea de Negocio', catalog: 'business-lines' },
    { id: 'delivery-types', key: 'tipo_entrega', def: 'Tipo de Entrega', catalog: 'delivery-types' },
    { id: 'licensings', key: 'licenciamiento', def: 'Licenciamiento', catalog: 'licensings' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="border-b border-gray-150">
        <nav className="flex -mb-px space-x-6 overflow-x-auto no-scrollbar">
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={`pb-4 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getLabelName(tab.key, tab.def)}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="animate-fade-in" key={activeSubTab}>
        <OpportunityCatalogSettings
          catalogType={subTabs.find(t => t.id === activeSubTab)!.catalog}
          catalogTitle={getLabelName(subTabs.find(t => t.id === activeSubTab)!.key, subTabs.find(t => t.id === activeSubTab)!.def)}
        />
      </div>
    </div>
  );
};

export default CatalogSubTabsPanel;
