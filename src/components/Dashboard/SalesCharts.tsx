import React from 'react';
import { BarChart3, TrendingUp, PieChart, Table as TableIcon } from 'lucide-react';
import type { ChartType } from '../../hooks/useDashboard';
import VisualChart from './VisualChart';
import SkeletonLoader from '../shared/SkeletonLoader';

interface ChartBlock {
  title: string;
  data: { label: string; value: number }[];
  chartType: ChartType;
  onTypeChange: (t: ChartType) => void;
  colorHex: string;
  colorGradId: string;
  isCurrency: boolean;
  onElementClick: (label: string) => void;
}

interface SalesChartsProps {
  loading: boolean;
  charts: [ChartBlock, ChartBlock, ChartBlock];
  activeCurrency: string;
}

const chartTypeOptions = [
  { type: 'bar' as ChartType,   icon: <BarChart3 size={13} />,   label: 'Barras' },
  { type: 'line' as ChartType,  icon: <TrendingUp size={13} />,  label: 'Líneas' },
  { type: 'pie' as ChartType,   icon: <PieChart size={13} />,    label: 'Pastel' },
  { type: 'table' as ChartType, icon: <TableIcon size={13} />,   label: 'Tabla' },
];

const ChartTypeSelector: React.FC<{ current: ChartType; onChange: (t: ChartType) => void }> = ({ current, onChange }) => (
  <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
    {chartTypeOptions.map(opt => (
      <button
        key={opt.type}
        type="button"
        onClick={() => onChange(opt.type)}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${current === opt.type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        title={opt.label}
      >
        {opt.icon}
      </button>
    ))}
  </div>
);

const SalesCharts: React.FC<SalesChartsProps> = ({ loading, charts, activeCurrency }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <SkeletonLoader variant="line" count={1} className="mb-4 h-4 w-2/3" />
            <SkeletonLoader variant="card" count={1} lines={4} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {charts.map((chart, idx) => (
        <div key={idx} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5 gap-2 flex-wrap">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">{chart.title}</h3>
            <ChartTypeSelector current={chart.chartType} onChange={chart.onTypeChange} />
          </div>
          <VisualChart
            type={chart.chartType}
            data={chart.data}
            colorHex={chart.colorHex}
            colorGradId={chart.colorGradId}
            isCurrency={chart.isCurrency}
            activeCurrency={activeCurrency}
            onElementClick={chart.onElementClick}
          />
        </div>
      ))}
    </div>
  );
};

export default SalesCharts;
