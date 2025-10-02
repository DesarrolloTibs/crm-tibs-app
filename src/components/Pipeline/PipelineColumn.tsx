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

const PipelineColumn: React.FC<Props> = ({ stage, opportunities, onEdit, onDelete, isAdmin }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const count = opportunities.length;
  const total = opportunities.reduce((acc, opp) => acc + Number(opp.monto_total), 0);

  const columnStyles = `
    flex flex-col
    w-80 max-w-sm
    min-h-[850px]
    rounded-xl
    bg-gray-100
    transition-colors duration-200 ease-in-out
    border-2 
    ${isOver ? 'bg-blue-50 border-blue-400 shadow-lg' : 'shadow-md'}
  `;

  return (
    <div ref={setNodeRef} className={columnStyles}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{stage}</h3>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{count} {count === 1 ? 'Oportunidad' : 'Oportunidades'}</span>
          <span className="font-semibold">${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <SortableContext items={opportunities.map(o => o.id)} >
        <div className="flex-grow p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
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
