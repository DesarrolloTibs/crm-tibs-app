import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { DashboardIndicator } from '../../services/reportsService';
import KpiCard from './KpiCard';
import SkeletonLoader from '../shared/SkeletonLoader';
import { formatCurrency } from '../../utils/formatters';

interface KpiSectionProps {
  loading: boolean;
  indicators: DashboardIndicator[];
  kpiValues: Record<string, number>;
  activeCurrency: string;
  selectedKpiId: string | null;
  onKpiClick: (id: string | null) => void;
  getKpiBgGradient: (color: string) => string;
}

const KpiSection: React.FC<KpiSectionProps> = ({
  loading, indicators, kpiValues, activeCurrency, selectedKpiId, onKpiClick, getKpiBgGradient,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SkeletonLoader variant="card" count={5} lines={3} />
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-3xl text-center shadow-sm">
        <AlertCircle size={28} className="text-slate-400 mb-1" />
        <p className="text-sm font-bold text-slate-700">No hay indicadores configurados para este módulo</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Configúralos en Configuración &gt; Indicadores de Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {indicators.map((ind) => {
        const value = kpiValues[ind.id!] || 0;
        const displayValue = ind.type === 'sum' ? formatCurrency(value, activeCurrency) : value;
        const isSelected = selectedKpiId === ind.id;
        return (
          <KpiCard
            key={ind.id}
            title={ind.title}
            displayValue={displayValue}
            type={ind.type as 'sum' | 'count'}
            activeCurrency={activeCurrency}
            isSelected={isSelected}
            gradient={getKpiBgGradient(ind.color)}
            onClick={() => onKpiClick(isSelected ? null : ind.id!)}
          />
        );
      })}
    </div>
  );
};

export default KpiSection;
