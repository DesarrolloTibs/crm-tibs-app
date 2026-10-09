import React from 'react';
import { Brain, Link2 } from 'lucide-react';

interface AiAgentTabsNavProps {
  activeTab: 'general' | 'channels';
  onTabChange: (tab: 'general' | 'channels') => void;
  subAgentsCount: number;
  channelsCount: number;
}

export const AiAgentTabsNav: React.FC<AiAgentTabsNavProps> = ({
  activeTab,
  onTabChange,
  subAgentsCount,
  channelsCount,
}) => {
  return (
    <div className="flex gap-4 border-b border-slate-200 pb-px mb-6 w-full text-left">
      <button
        type="button"
        onClick={() => onTabChange('general')}
        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === 'general'
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
      >
        <Brain size={18} />
        <span>Configuración General & Orquestador</span>
        <span
          className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
            activeTab === 'general'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {subAgentsCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('channels')}
        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === 'channels'
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
      >
        <Link2 size={18} />
        <span>Canales de Comunicación</span>
        <span
          className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
            activeTab === 'channels'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {channelsCount}
        </span>
      </button>
    </div>
  );
};
