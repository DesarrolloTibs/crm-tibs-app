import React, { useMemo } from 'react';
import type { Opportunity, Stage } from '../../core/models/Opportunity';
import OpportunityCard from './OpportunityCard';
import KanbanColumn from '../shared/KanbanColumn';

interface Props {
  stage: Stage;
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
  stages: Stage[];
  onEditStage: (stage: Stage) => void;
  onDisableStage: (stage: Stage) => void;
  onAddOpportunity: (stageId: string) => void;
  isOverlay?: boolean;
  isFolded?: boolean;
  onFoldStage: (stageId: string) => void;
  onUnfoldStage: (stageId: string) => void;
}

const PipelineColumn: React.FC<Props> = ({ 
  stage, 
  opportunities, 
  onEdit, 
  onDelete, 
  onArchive, 
  stages,
  onEditStage,
  onDisableStage,
  onAddOpportunity,
  isOverlay = false,
  isFolded = false,
  onFoldStage,
  onUnfoldStage
}) => {
  const sortedOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => {
      const aDate = a.stage_entered_at ? new Date(a.stage_entered_at) : new Date(a.createdAt || Date.now());
      const aDays = Math.floor(Math.max(0, Date.now() - aDate.getTime()) / (1000 * 60 * 60 * 24));

      const bDate = b.stage_entered_at ? new Date(b.stage_entered_at) : new Date(b.createdAt || Date.now());
      const bDays = Math.floor(Math.max(0, Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24));

      const limit = stage.intmaxdays;
      const aIsRed = limit !== undefined && limit !== null && limit > 0 && aDays > limit;
      const bIsRed = limit !== undefined && limit !== null && limit > 0 && bDays > limit;

      if (aIsRed && !bIsRed) return -1;
      if (!aIsRed && bIsRed) return 1;

      return bDays - aDays;
    });
  }, [opportunities, stage.intmaxdays]);

  const count = opportunities.length;

  const total = useMemo(() => {
    return opportunities.reduce((acc, opp) => {
      const amount = Number(opp.monto_total) || 0;
      if (opp.moneda === 'USD') {
        const exchangeRate = opp.tipoCambio && opp.tipoCambio > 0 ? opp.tipoCambio : 1;
        return acc + (amount * exchangeRate);
      }
      return acc + amount;
    }, 0);
  }, [opportunities]);

  const sortedOpportunityIds = useMemo(() => sortedOpportunities.map(o => o.id), [sortedOpportunities]);

  return (
    <KanbanColumn
      stage={stage}
      stages={stages}
      itemIds={sortedOpportunityIds}
      count={count}
      onEditStage={onEditStage}
      onDisableStage={onDisableStage}
      onAddItem={onAddOpportunity}
      isOverlay={isOverlay}
      isFolded={isFolded}
      onFoldStage={onFoldStage}
      onUnfoldStage={onUnfoldStage}
      canManageStages={true}
      totalAmount={total}
      accentColorFallback="#3b82f6"
      plusButtonTitle="Nueva oportunidad"
    >
      {sortedOpportunities.map(opportunity => (
        <OpportunityCard 
          key={opportunity.id} 
          opportunity={opportunity}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          stages={stages}
        />
      ))}
    </KanbanColumn>
  );
};

export default PipelineColumn;
