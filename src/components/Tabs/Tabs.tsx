import React, { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden touch-pan-x hide-scrollbar w-full">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 px-2 sm:px-0" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button key={tab.label} onClick={() => setActiveTab(index)} className={`${ index === activeTab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-shrink-0`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-6">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs;