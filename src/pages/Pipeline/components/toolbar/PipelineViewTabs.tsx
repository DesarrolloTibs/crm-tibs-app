import React from 'react';
import { Kanban, List } from 'lucide-react';
import type { PipelineViewMode } from '../../schemas/pipeline.schema';

interface PipelineViewTabsProps {
  activeView: PipelineViewMode;
  onChangeView: (view: PipelineViewMode) => void;
  opportunitiesCount?: number;
}

export const PipelineViewTabs: React.FC<PipelineViewTabsProps> = ({
  activeView,
  onChangeView,
  opportunitiesCount,
}) => {
  return (
    <div className="inline-flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/60 shadow-2xs select-none">
      {/* Botón Kanban */}
      <button
        type="button"
        onClick={() => onChangeView('kanban')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
          activeView === 'kanban'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
        }`}
      >
        <Kanban
          size={14}
          className={activeView === 'kanban' ? 'text-indigo-600' : 'text-stone-400'}
        />
        <span>Kanban</span>
        {opportunitiesCount !== undefined && (
          <span
            className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeView === 'kanban'
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-stone-200/70 text-stone-600'
            }`}
          >
            {opportunitiesCount}
          </span>
        )}
      </button>

      {/* Botón Listado */}
      <button
        type="button"
        onClick={() => onChangeView('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
          activeView === 'list'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
        }`}
      >
        <List
          size={14}
          className={activeView === 'list' ? 'text-indigo-600' : 'text-stone-400'}
        />
        <span>Tabla</span>
      </button>
    </div>
  );
};

export const PipelineNavTabs = PipelineViewTabs;
export default PipelineViewTabs;
