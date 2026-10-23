import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface KanbanScrollControlsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export const KanbanScrollControls: React.FC<KanbanScrollControlsProps> = ({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
}) => {
  return (
    <>
      {canScrollLeft && (
        <button
          type="button"
          onClick={onScrollLeft}
          aria-label="Desplazar etapas a la izquierda"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-xl border border-slate-200/90 hover:bg-white hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft size={22} className="stroke-[2.5]" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={onScrollRight}
          aria-label="Desplazar etapas a la derecha"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-xl border border-slate-200/90 hover:bg-white hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </button>
      )}
    </>
  );
};

export default KanbanScrollControls;
