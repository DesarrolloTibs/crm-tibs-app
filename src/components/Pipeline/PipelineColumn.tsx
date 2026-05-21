import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { Opportunity, OpportunityStageType } from '../../core/models/Opportunity';
import OpportunityCard from './OpportunityCard';

interface Props {
  stage: OpportunityStageType;
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
}

const stageColors: Record<OpportunityStageType, string> = {
  'Nuevo': '#c0c9d8',
  'Descubrimiento': '#80d3f4',
  'Estimación': '#25b4ad',
  'Propuesta': '#3174b8',
  'Negociación': '#a7d05e',
  'Ganada': '#309b47',
  'Perdida': '#a92c56',
  'Cancelada': '#f68547',
  'Standby': '#921e82ff',
};


const PipelineColumn: React.FC<Props> = ({ stage, opportunities, onEdit, onDelete, onArchive }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const count = opportunities.length;
  const total = opportunities.reduce((acc, opp) => {
    const amount = Number(opp.monto_total) || 0;
    if (opp.moneda === 'USD') {
      // Si la moneda es USD, convierte a MXN usando el tipo de cambio.
      // Si tipoCambio no está definido o es 0, se usa 1 para no afectar el monto.
      const exchangeRate = opp.tipoCambio && opp.tipoCambio > 0 ? opp.tipoCambio : 1;
      return acc + (amount * exchangeRate);
    }
    return acc + amount; // Si es MXN, se suma directamente.
  }, 0);
  const borderColor = stageColors[stage] || '#9ca3af'; // Fallback to gray-400

  const columnStyles = `
    flex flex-col
    min-h-[850px]
    w-[85vw] md:w-[300px] flex-shrink-0 snap-center
    rounded-xl
    bg-slate-50/80 backdrop-blur-sm
    transition-colors duration-200 ease-in-out
    shadow-lg
    border border-gray-200/80
    ${isOver ? 'ring-2 ring-blue-500' : ''}
  `;

  return (
    <div ref={setNodeRef} className={columnStyles}>
      {/* Header with color bar */}
      <div className="p-4 bg-[#f9f9f9]">
        <h3 className="font-bold text-lg text-gray-800 border-l-4 pl-3 mb-3" style={{ borderColor }}>{stage}</h3>
        <div className="flex justify-between text-sm text-[#6f757d]">
          <span>{count} {count === 1 ? 'Oportunidad' : 'Oportunidades'}</span>
          <span className="font-bold text-[#6f757d]">${total.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN</span>
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-[1px] bg-[#d6d6d6] w-[90%] mx-auto"></div>

      <SortableContext items={opportunities.map(o => o.id)} >
        <div className="flex-grow p-2 overflow-y-auto bg-[#fafafa]" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {opportunities.map(opportunity => (
            <OpportunityCard 
              key={opportunity.id} 
              opportunity={opportunity}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default PipelineColumn;
