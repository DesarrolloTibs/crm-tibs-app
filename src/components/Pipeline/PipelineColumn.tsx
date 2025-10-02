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
  isAdmin: boolean;
}

const stageColors: Record<OpportunityStageType, string> = {
  'Nuevo': 'border-gray-400',
  'Descubrimiento': 'border-blue-400',
  'Estimación': 'border-blue-500',
  'Propuesta': 'border-indigo-500',
  'Negociación': 'border-purple-500',
  'Ganada': 'border-green-500',
  'Perdida': 'border-red-500',
  'Cancelada': 'border-red-500',
};

const PipelineColumn: React.FC<Props> = ({ stage, opportunities, onEdit, onDelete, isAdmin }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const count = opportunities.length;
  const total = opportunities.reduce((acc, opp) => acc + Number(opp.monto_total), 0);
  const borderColor = stageColors[stage] || 'border-gray-400';

  const columnStyles = `
    flex flex-col
    min-h-[850px]
    w-[300px] flex-shrink-0
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
      <div className="p-4 border-b border-gray-200">
        <h3 className={`font-bold text-lg text-gray-800 border-l-4 pl-3 mb-3 ${borderColor}`}>{stage}</h3>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{count} {count === 1 ? 'Oportunidad' : 'Oportunidades'}</span>
          <span className="font-semibold">${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <SortableContext items={opportunities.map(o => o.id)} >
        <div className="flex-grow p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {opportunities.map(opportunity => (
            <OpportunityCard 
              key={opportunity.id} 
              opportunity={opportunity}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default PipelineColumn;
