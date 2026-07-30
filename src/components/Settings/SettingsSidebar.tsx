import React from 'react';

interface SettingOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SettingSection {
  title: string;
  options: SettingOption[];
}

interface SettingsSidebarProps {
  sections: SettingSection[];
  activeTab: string;
  onSelect: (id: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ sections, activeTab, onSelect }) => (
  <aside className="hidden lg:flex w-full lg:w-64 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 flex-col gap-4 lg:gap-6 shrink-0">
    {sections.map((section, idx) => (
      <div key={idx} className="flex flex-col gap-1.5">
        <span className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 select-none">
          {section.title}
        </span>
        <ul className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar">
          {section.options.map(option => {
            const isActive = activeTab === option.id;
            return (
              <li key={option.id} className="w-auto lg:w-full shrink-0">
                <button
                  onClick={() => onSelect(option.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border-l-2 border-blue-600 pl-2.5'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
                  }`}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </aside>
);

export default SettingsSidebar;
