import React from 'react';

interface KpiCardProps {
  title: string;
  displayValue: string | number;
  type: 'sum' | 'count';
  activeCurrency: string;
  isSelected: boolean;
  gradient: string;
  onClick: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, displayValue, type, activeCurrency, isSelected, gradient, onClick,
}) => (
  <button
    onClick={onClick}
    className={`text-left rounded-3xl p-5 bg-gradient-to-br shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden select-none cursor-pointer group ${gradient} ${
      isSelected ? 'ring-4 ring-indigo-600/30 scale-98 shadow-md' : 'opacity-90 hover:opacity-100'
    }`}
  >
    <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300" />
    <div className="absolute right-[-10px] bottom-[-20px] w-16 h-16 rounded-full bg-white/5 group-hover:scale-115 transition-transform duration-300" />
    <div className="flex flex-col justify-between h-full relative z-10 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-wider uppercase opacity-85">{title}</span>
        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />}
      </div>
      <div className="space-y-1">
        <span className="text-2xl font-black tracking-tight block">{displayValue}</span>
        <span className="text-[9px] opacity-75 font-semibold block uppercase">
          {type === 'sum' ? `Suma de importes (${activeCurrency})` : 'Cantidad de registros'}
        </span>
      </div>
    </div>
  </button>
);

export default KpiCard;
