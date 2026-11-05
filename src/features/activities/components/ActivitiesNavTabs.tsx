import React from 'react';
import { Table2, LayoutGrid } from 'lucide-react';
import type { ActivityViewMode } from '../schemas/activities.schema';

interface ActivitiesNavTabsProps {
  activeView: ActivityViewMode;
  onChangeView: (view: ActivityViewMode) => void;
  activitiesCount?: number;
}

export const ActivitiesNavTabs: React.FC<ActivitiesNavTabsProps> = ({
  activeView,
  onChangeView,
}) => {
  return (
    <div className="inline-flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/60 shadow-2xs select-none">
      {/* Botón Tabla */}
      <button
        type="button"
        onClick={() => onChangeView('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
          activeView === 'table'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
        }`}
      >
        <Table2
          size={14}
          className={activeView === 'table' ? 'text-indigo-600' : 'text-stone-400'}
        />
        <span>Tabla</span>
      </button>

      {/* Botón Calendario */}
      <button
        type="button"
        onClick={() => onChangeView('calendar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
          activeView === 'calendar'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
        }`}
      >
        <LayoutGrid
          size={14}
          className={activeView === 'calendar' ? 'text-indigo-600' : 'text-stone-400'}
        />
        <span>Calendario</span>
      </button>
    </div>
  );
};

export default ActivitiesNavTabs;
