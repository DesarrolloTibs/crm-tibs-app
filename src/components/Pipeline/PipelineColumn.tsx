import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Plus, Minimize2, Edit2, ChevronsRight, EyeOff } from 'lucide-react';
import type { Opportunity, Stage } from '../../core/models/Opportunity';
import OpportunityCard from './OpportunityCard';

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stage.id,
    disabled: isOverlay
  });

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Filtrar y ordenar etapas activas para dibujar la barra de progreso segmentada
  const activeStages = useMemo(() => {
    return stages
      .filter(s => s.blnstatus)
      .sort((a, b) => a.display_order - b.display_order);
  }, [stages]);

  const currentStageIndex = useMemo(() => {
    return activeStages.findIndex(s => s.id === stage.id);
  }, [activeStages, stage.id]);

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const isDraggingStyle = isDragging && !isOverlay;

  if (isFolded) {
    const foldedColumnStyles = `
      flex flex-col
      min-h-[850px]
      w-[45px] sm:w-[50px] flex-shrink-0 snap-center
      rounded-xl
      bg-slate-100/90 backdrop-blur-sm
      border border-gray-200/80
      transition-all duration-200 ease-in-out
      hover:bg-slate-200/50 shadow-sm
      ${isDraggingStyle ? 'opacity-30 blur-[1px] border-dashed border-gray-300 shadow-none' : ''}
    `;

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={foldedColumnStyles}
      >
        {/* Header con botón para desplegar */}
        <div className="flex flex-col items-center pt-4 pb-2 border-b border-gray-200/60 bg-slate-50/50 rounded-t-xl">
          <button
            onClick={() => onUnfoldStage(stage.id)}
            className="p-1 rounded hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer text-slate-400"
            title="Desplegar etapa"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        {/* Titulo vertical y cantidad */}
        <div 
          {...attributes}
          {...listeners}
          className="flex-grow flex items-center justify-start pt-6 pb-4 cursor-grab active:cursor-grabbing select-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          <span className="font-bold text-slate-600 tracking-wide text-[13px] sm:text-[14px] whitespace-nowrap flex items-center">
            {stage.strname}
            <span className="text-slate-400 font-extrabold ml-1.5">({count})</span>
          </span>
        </div>
      </div>
    );
  }

  const columnStyles = `
    flex flex-col
    min-h-[850px]
    w-[85vw] md:w-[300px] flex-shrink-0 snap-center
    rounded-xl
    bg-slate-50/80 backdrop-blur-sm
    transition-all duration-200 ease-in-out
    shadow-lg
    border border-gray-200/80
    ${isDraggingStyle ? 'opacity-30 blur-[1px] border-dashed border-gray-300 shadow-none' : ''}
  `;

  return (
    <div ref={setNodeRef} style={style} className={columnStyles}>
      {/* Header matching Odoo-like design */}
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing px-4 pt-4 pb-3 bg-[#f9f9f9] rounded-t-xl select-none border-b border-gray-200/60"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[15px] sm:text-base tracking-wide flex items-center">
            {stage.strname}
          </h3>
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings size={15} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-1 py-1.5 animate-fade-in text-left">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onFoldStage(stage.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Minimize2 size={13} className="text-slate-400" />
                    Plegar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEditStage(stage);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 size={13} className="text-slate-400" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDisableStage(stage);
                    }}
                    disabled={activeStages.length === 1}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 rounded transition-colors ${
                      activeStages.length === 1
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : 'text-red-600 hover:bg-red-50 cursor-pointer'
                    }`}
                    title={activeStages.length === 1 ? 'Debe haber al menos una etapa activa' : 'Deshabilitar etapa'}
                  >
                    <EyeOff size={13} className={activeStages.length === 1 ? 'text-slate-300' : 'text-red-400'} />
                    Deshabilitar
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddOpportunity(stage.id);
              }}
              className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
              title="Nueva oportunidad"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Progress Bar & Amount Row */}
        <div className="flex items-center justify-between gap-3 mt-2">
          {/* Segmented Progress Bar */}
          <div className="flex h-[6px] flex-1 rounded-full overflow-hidden bg-slate-200/60">
            {activeStages.map((s, index) => {
              const isCompletedOrCurrent = index <= currentStageIndex;
              const segmentColor = isCompletedOrCurrent ? (s.strcolor || '#3b82f6') : '#e2e8f0';
              return (
                <div
                  key={s.id}
                  className="h-full flex-1"
                  style={{
                    backgroundColor: segmentColor,
                    borderRight: index < activeStages.length - 1 ? '1.5px solid #f9f9f9' : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* Stage Total Amount */}
          <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
            $ {total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <SortableContext items={opportunities.map(o => o.id)} >
        <div className="flex-grow p-2 overflow-y-auto bg-[#fafafa] flex flex-col items-center" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {opportunities.map(opportunity => (
            <OpportunityCard 
              key={opportunity.id} 
              opportunity={opportunity}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              stages={stages}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default PipelineColumn;
