import React from 'react';
import { DndContext, DragOverlay, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import HelpdeskColumn from './HelpdeskColumn';
import TicketCard from './TicketCard';
import Input from '../shared/Input';
import Button from '../shared/Button';
import type { TicketStage, Ticket } from '../../core/models/Ticket';

interface Props {
  sensors: ReturnType<typeof useSensors>;
  stages: TicketStage[];
  visibleStageIds: string[];
  filteredTickets: Ticket[];
  foldedStageIds: string[];
  setFoldedStageIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeTicket: Ticket | null;
  activeStage: TicketStage | null;
  isAdmin: boolean;
  isAddingStage: boolean;
  setIsAddingStage: (v: boolean) => void;
  newStageName: string;
  setNewStageName: (v: string) => void;
  newStageMaxDays: string;
  setNewStageMaxDays: (v: string) => void;
  addStageInputRef: React.RefObject<HTMLInputElement | null>;
  onDragStart: (e: DragStartEvent) => void;
  onDragEnd: (e: DragEndEvent) => void;
  onClickTicket: (ticket: Ticket) => void;
  onEditStage: (stage: TicketStage) => void;
  onDisableStage: (stage: TicketStage) => void;
  onAddTicket: (stageId: string) => void;
  onDeleteTicket: (ticket: Ticket) => void;
  onArchiveTicket: (ticket: Ticket) => void;
  onCreateStage: (e: React.FormEvent) => void;
}

const HelpdeskKanban: React.FC<Props> = ({
  sensors, stages, visibleStageIds, filteredTickets, foldedStageIds,
  setFoldedStageIds, activeTicket, activeStage, isAdmin,
  isAddingStage, setIsAddingStage, newStageName, setNewStageName,
  newStageMaxDays, setNewStageMaxDays, addStageInputRef,
  onDragStart, onDragEnd, onClickTicket, onEditStage, onDisableStage,
  onAddTicket, onDeleteTicket, onArchiveTicket, onCreateStage,
}) => {
  const visibleActiveStages = stages.filter(s => s.blnstatus && visibleStageIds.includes(s.id));

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`flex space-x-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 ${!activeTicket && !activeStage ? 'snap-x snap-mandatory' : ''}`}>
        <SortableContext items={visibleActiveStages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
          {visibleActiveStages.map(stage => (
            <HelpdeskColumn
              key={stage.id}
              stage={stage}
              tickets={filteredTickets.filter(t => t.stage_id === stage.id)}
              onClickTicket={onClickTicket}
              stages={stages}
              onEditStage={onEditStage}
              onDisableStage={onDisableStage}
              onAddTicket={onAddTicket}
              isFolded={foldedStageIds.includes(stage.id)}
              onFoldStage={id => setFoldedStageIds(prev => [...prev, id])}
              onUnfoldStage={id => setFoldedStageIds(prev => prev.filter(fid => fid !== id))}
              onDeleteTicket={onDeleteTicket}
              onArchiveTicket={onArchiveTicket}
            />
          ))}
        </SortableContext>

        {isAdmin && (
          !isAddingStage ? (
            <div
              onClick={() => setIsAddingStage(true)}
              className="flex flex-col min-h-[500px] w-[45px] sm:w-[50px] flex-shrink-0 snap-center rounded-xl bg-slate-100/50 hover:bg-slate-200/50 border border-dashed border-gray-300 hover:border-slate-400 transition-all duration-200 cursor-pointer items-center justify-start pt-6 shadow-sm select-none"
            >
              <div className="flex items-center justify-center font-bold text-slate-500 tracking-wide text-[13px] sm:text-[14px] whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                » Agregar Etapa
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-[85vw] md:w-[330px] flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 shadow-md min-h-[220px] h-fit snap-center">
              <h3 className="font-semibold text-slate-800 text-[14px] uppercase tracking-wider mb-3">Nueva Etapa</h3>
              <form onSubmit={onCreateStage} className="flex flex-col gap-3">
                <Input label="Nombre" ref={addStageInputRef} type="text" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Nombre de la etapa..." required />
                <Input label="Límite de días (opcional)" type="number" min="0" value={newStageMaxDays} onChange={e => setNewStageMaxDays(e.target.value)} placeholder="Ej. 15 (vacío = sin límite)" />
                <div className="flex items-center gap-2 mt-1">
                  <Button type="submit" variant="indigo" className="flex-1">Añadir</Button>
                  <Button type="button" onClick={() => { setIsAddingStage(false); setNewStageName(''); setNewStageMaxDays(''); }} variant="secondary" className="flex-1">Cancelar</Button>
                </div>
              </form>
            </div>
          )
        )}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <TicketCard ticket={activeTicket} onClick={() => {}} isOverlay />
        ) : activeStage ? (
          <div className="opacity-95 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing">
            <HelpdeskColumn
              stage={activeStage}
              tickets={filteredTickets.filter(t => t.stage_id === activeStage.id)}
              onClickTicket={() => {}}
              stages={stages}
              onEditStage={() => {}}
              onDisableStage={() => {}}
              onAddTicket={() => {}}
              isOverlay
              isFolded={foldedStageIds.includes(activeStage.id)}
              onFoldStage={() => {}}
              onUnfoldStage={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default HelpdeskKanban;
