import React, { useMemo } from 'react';
import type { Ticket, TicketStage } from '../../core/models/Ticket';
import TicketCard from './TicketCard';
import { useAuth } from '../../hooks/useAuth';
import KanbanColumn from '../shared/KanbanColumn';

interface Props {
  stage: TicketStage;
  tickets: Ticket[];
  onClickTicket: (ticket: Ticket) => void;
  stages: TicketStage[];
  onEditStage: (stage: TicketStage) => void;
  onDisableStage: (stage: TicketStage) => void;
  onAddTicket: (stageId: string) => void;
  isOverlay?: boolean;
  isFolded?: boolean;
  onFoldStage: (stageId: string) => void;
  onUnfoldStage: (stageId: string) => void;
  onDeleteTicket?: (ticket: Ticket) => void;
  onArchiveTicket?: (ticket: Ticket) => void;
}

const HelpdeskColumn: React.FC<Props> = ({ 
  stage, 
  tickets, 
  onClickTicket, 
  stages,
  onEditStage,
  onDisableStage,
  onAddTicket,
  isOverlay = false,
  isFolded = false,
  onFoldStage,
  onUnfoldStage,
  onDeleteTicket,
  onArchiveTicket
}) => {
  const { isAdmin } = useAuth();

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const aDate = a.stage_entered_at ? new Date(a.stage_entered_at) : new Date(a.fecha_apertura);
      const aDays = Math.floor(Math.max(0, Date.now() - aDate.getTime()) / (1000 * 60 * 60 * 24));

      const bDate = b.stage_entered_at ? new Date(b.stage_entered_at) : new Date(b.fecha_apertura);
      const bDays = Math.floor(Math.max(0, Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24));

      const limit = stage.intmaxdays;
      const aIsRed = limit !== undefined && limit !== null && limit > 0 && aDays > limit;
      const bIsRed = limit !== undefined && limit !== null && limit > 0 && bDays > limit;

      if (aIsRed && !bIsRed) return -1;
      if (!aIsRed && bIsRed) return 1;

      return bDays - aDays;
    });
  }, [tickets, stage.intmaxdays]);

  const count = tickets.length;
  const sortedTicketIds = useMemo(() => sortedTickets.map(t => t.id), [sortedTickets]);

  return (
    <KanbanColumn
      stage={stage}
      stages={stages}
      itemIds={sortedTicketIds}
      count={count}
      onEditStage={onEditStage}
      onDisableStage={onDisableStage}
      onAddItem={onAddTicket}
      isOverlay={isOverlay}
      isFolded={isFolded}
      onFoldStage={onFoldStage}
      onUnfoldStage={onUnfoldStage}
      canManageStages={isAdmin}
      accentColorFallback="#6366f1"
      plusButtonTitle="Nuevo Ticket"
    >
      {sortedTickets.map(ticket => (
        <TicketCard 
          key={ticket.id} 
          ticket={ticket}
          onClick={() => onClickTicket(ticket)}
          onEdit={onClickTicket}
          onDelete={onDeleteTicket}
          onArchive={onArchiveTicket}
        />
      ))}
    </KanbanColumn>
  );
};

export default HelpdeskColumn;
