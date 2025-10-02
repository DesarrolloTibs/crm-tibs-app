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
  const { setNodeRef } = useDroppable({ id: stage });

  const count = opportunities.length;
  const total = opportunities.reduce((acc, opp) => acc + Number(opp.monto_total), 0);

  return (
    <div ref={setNodeRef} className="bg-gray-100 p-4 rounded-md w-80">
      <h3 className="font-bold text-lg mb-4">{stage}</h3>
      <div className="flex justify-between mb-4">
        <span>{count} Oportunidades</span>
        <span>${total.toLocaleString()}</span>
      </div>
      <SortableContext items={opportunities.map(o => o.id)}>
        <div className="min-h-[600px]">
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
