import React, { useState } from 'react';

export interface Tab {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
  activeIndex?: number;
  onTabChange?: (index: number) => void;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultIndex = 0,
  activeIndex,
  onTabChange,
}) => {
  const [internalActive, setInternalActive] = useState(defaultIndex);
  const isControlled = activeIndex !== undefined;
  const currentTab = isControlled ? activeIndex : internalActive;

  const handleTabClick = (index: number) => {
    if (!isControlled) setInternalActive(index);
    onTabChange?.(index);
  };

  return (
    <div>
      <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden touch-pan-x w-full">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 px-2 sm:px-0" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => handleTabClick(index)}
              className={`${
                index === currentTab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-shrink-0 flex items-center gap-1.5`}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-6">{tabs[currentTab]?.content}</div>
    </div>
  );
};

export default Tabs;
