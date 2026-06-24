import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Plus, Minimize2, Edit2, ChevronsRight, EyeOff } from 'lucide-react';

export interface KanbanStage {
  id: string;
  strname: string;
  blnstatus: boolean;
  strcolor?: string | null;
  intmaxdays?: number | null;
  display_order: number;
}

interface KanbanColumnProps<T extends KanbanStage = KanbanStage> {
  stage: T;
  stages: T[];
  itemIds: string[];
  count: number;
  onEditStage?: (stage: T) => void;
  onDisableStage?: (stage: T) => void;
  onAddItem?: (stageId: string) => void;
  isOverlay?: boolean;
  isFolded?: boolean;
  onFoldStage: (stageId: string) => void;
  onUnfoldStage: (stageId: string) => void;
  canManageStages?: boolean;
  totalAmount?: number;
  accentColorFallback?: string;
  plusButtonTitle?: string;
  children: React.ReactNode;
}

export function KanbanColumn<T extends KanbanStage = KanbanStage>({
  stage,
  stages,
  itemIds,
  count,
  onEditStage,
  onDisableStage,
  onAddItem,
  isOverlay = false,
  isFolded = false,
  onFoldStage,
  onUnfoldStage,
  canManageStages = true,
  totalAmount,
  accentColorFallback = '#3b82f6',
  plusButtonTitle = 'Añadir',
  children,
}: KanbanColumnProps<T>) {
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
      h-[75vh] md:h-[calc(100vh-180px)]
      min-h-[500px]
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
            type="button"
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
    h-[75vh] md:h-[calc(100vh-180px)]
    min-h-[500px]
    w-[85vw] md:w-[350px] flex-shrink-0 snap-center
    rounded-xl
    bg-slate-50/80 backdrop-blur-sm
    transition-all duration-200 ease-in-out
    shadow-lg
    border border-gray-200/80
    ${isDraggingStyle ? 'opacity-30 blur-[1px] border-dashed border-gray-300 shadow-none' : ''}
  `;

  const accentColor = stage.strcolor || accentColorFallback;

  return (
    <div ref={setNodeRef} style={style} className={columnStyles}>
      {/* Color accent top border */}
      <div
        className="h-1 rounded-t-xl flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      {/* Header matching Odoo-like design */}
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing px-4 pt-3 pb-3 bg-[#f9f9f9] select-none border-b border-gray-200/60"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-[14px] sm:text-[15px] tracking-wide flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span className="truncate" title={stage.strname}>{stage.strname}</span>
            {/* Count pill badge inline with title */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 leading-tight"
              style={{
                backgroundColor: `${accentColor}22`,
                color: accentColor,
                border: `1px solid ${accentColor}44`,
              }}
            >
              {count}
            </span>
          </h3>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
            {(typeof onFoldStage === 'function' || (canManageStages && (typeof onEditStage === 'function' || typeof onDisableStage === 'function'))) && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Ajustes"
                >
                  <Settings size={15} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-1 py-1.5 animate-fade-in text-left">
                    {typeof onFoldStage === 'function' && (
                      <button
                        type="button"
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
                    )}
                    {canManageStages && typeof onEditStage === 'function' && (
                      <button
                        type="button"
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
                    )}
                    {canManageStages && typeof onDisableStage === 'function' && (
                      <button
                        type="button"
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
                    )}
                  </div>
                )}
              </div>
            )}
            {onAddItem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddItem(stage.id);
                }}
                className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-650 transition-colors cursor-pointer shrink-0"
                title={plusButtonTitle}
              >
                <Plus size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Amount + progress bar row, or just progress bar */}
        {totalAmount !== undefined ? (
          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Segmented Progress Bar (full width) */}
            <div className="flex h-[5px] flex-1 rounded-full overflow-hidden bg-slate-200/60">
              {activeStages.map((s, index) => {
                const isCompletedOrCurrent = index <= currentStageIndex;
                const segmentColor = isCompletedOrCurrent ? (s.strcolor || accentColorFallback) : '#e2e8f0';
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
              $ {totalAmount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ) : (
          /* Segmented Progress Bar (full width) when no amount */
          <div className="flex h-[5px] flex-1 rounded-full overflow-hidden bg-slate-200/60 mt-2">
            {activeStages.map((s, index) => {
              const isCompletedOrCurrent = index <= currentStageIndex;
              const segmentColor = isCompletedOrCurrent ? (s.strcolor || accentColorFallback) : '#e2e8f0';
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
        )}
      </div>

      <SortableContext items={itemIds} >
        <div className="flex-1 p-2 overflow-y-auto hide-scrollbar bg-[#fafafa] flex flex-col items-center gap-2 rounded-b-xl">
          {children}
        </div>
      </SortableContext>
    </div>
  );
}

export default KanbanColumn;
