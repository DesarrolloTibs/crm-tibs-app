import React, { useState, useRef, useEffect } from 'react';
import type { Opportunity, Stage } from '../../core/models/Opportunity';
import { useAuth } from '../../hooks/useAuth';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, Building2, Archive, ArchiveRestore, MoreVertical, Mail, User, Clock } from 'lucide-react';
import Popover from './Popover';


interface Props {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
  isOverlay?: boolean;
  stages?: Stage[];
}

const businessLineColors: Record<string, string> = {
  'Datos': '#dbed74 #707a10',
  'Desarrollo': '#dcaeed #371450',
  'RH': '#80d3f4 #2f5367',
  'IA': '#c8e7df #1b6b65',
};

const getInitials = (name = 'N A') => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Avatar: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => {
  const [showPopover, setShowPopover] = useState(false);
  const avatarRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { ejecutivo } = opportunity;
  const imageUrl = ejecutivo?.profileImageUrl ? `${baseUrl}${ejecutivo.profileImageUrl}` : null;
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      <>
        <img
          ref={avatarRef as React.RefObject<HTMLImageElement>}
          src={imageUrl}
          alt={ejecutivo?.username || 'Avatar'}
          className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0 cursor-pointer"
          title={ejecutivo?.username || 'No asignado'}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          onError={() => setImgError(true)}
        />
        <Popover targetRef={avatarRef} show={showPopover} onClose={() => setShowPopover(false)} className="w-max max-w-xs">
          {ejecutivo && (
            <>
              <p className="font-bold text-sm text-gray-800 flex items-center gap-2"><User size={14} /> {ejecutivo.username}</p>
              <p className="text-xs text-gray-600 flex items-center gap-2 mt-1"><Mail size={14} /> {ejecutivo.email}</p>
            </>
          )}
        </Popover>
      </>
    );
  }

  return (
    <>
      <div 
        ref={avatarRef as React.RefObject<HTMLDivElement>} 
        className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold border border-slate-200 shrink-0 cursor-pointer" 
        title={ejecutivo?.username || 'No asignado'} 
        onMouseEnter={() => setShowPopover(true)} onMouseLeave={() => setShowPopover(false)}>
        {getInitials(ejecutivo?.username)}
      </div>
      <Popover targetRef={avatarRef} show={showPopover} onClose={() => setShowPopover(false)} className="w-max max-w-xs">
        {ejecutivo && (
          <>
            <p className="font-bold text-sm text-gray-800 flex items-center gap-2"><User size={14} /> {ejecutivo.username}</p>
            <p className="text-xs text-gray-600 flex items-center gap-2 mt-1"><Mail size={14} /> {ejecutivo.email}</p>
          </>
        )}
      </Popover>
    </>
  );
};

const OpportunityCard: React.FC<Props> = ({ opportunity, onEdit, onDelete, onArchive, isOverlay = false, stages = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin, user: currentUser } = useAuth();

  const isOwner = currentUser?.sub === opportunity.ejecutivo_id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    disabled: !(isAdmin || isOwner) || isOverlay, // Deshabilita el drag si no es admin/dueño o si es el overlay visual
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const canDrag = (isAdmin || isOwner) && !isOverlay;
  const isDraggingStyle = isDragging && !isOverlay;

  // Calcular progreso en base a la lista de etapas activas ordenadas
  const getProgress = () => {
    const activeStages = stages.filter(s => s.blnstatus).sort((a, b) => a.display_order - b.display_order);
    const index = activeStages.findIndex(s => s.id === opportunity.stage_id);
    if (index === -1 || activeStages.length <= 1) {
      return { percent: 0, color: opportunity.stage?.strcolor || '#9ca3af' };
    }
    const percent = Math.round((index / (activeStages.length - 1)) * 100);
    return {
      percent,
      color: opportunity.stage?.strcolor || '#9ca3af'
    };
  };

  const progress = getProgress();
  const tagColorString = businessLineColors[opportunity.linea_negocio?.strname || ''] || '#f3f4f6 #1f2937'; // Default to gray-100 and gray-800
  const [tagBgColor, tagTextColor] = tagColorString.split(' ');
  const tagStyle = {
    backgroundColor: tagBgColor,
    color: tagTextColor,
  };

  const getDaysInCurrentStage = () => {
    const enteredDate = opportunity.stage_entered_at 
      ? new Date(opportunity.stage_entered_at) 
      : new Date(opportunity.createdAt || Date.now());
    const diffTime = Math.max(0, Date.now() - enteredDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = getDaysInCurrentStage();
  const stageLimit = opportunity.stage?.intmaxdays;
  const isRed = stageLimit !== undefined && stageLimit !== null && stageLimit > 0 && days > stageLimit;
  const isYellow = stageLimit !== undefined && stageLimit !== null && stageLimit > 0 && !isRed && days >= (stageLimit / 2);

  const lastTap = useRef<number>(0);

  const handleTouchStart = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      if ((isAdmin || isOwner) && !isOverlay) {
        onEdit(opportunity);
      }
    }
    lastTap.current = now;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-xl border flex flex-col justify-between transition-all relative group w-full min-w-[220px] max-w-[350px] h-[145px] touch-none ${
        isDraggingStyle
          ? 'opacity-30 blur-[1.5px] pointer-events-none shadow-none border-dashed border-gray-300'
          : isOverlay
          ? 'shadow-xl scale-[1.03] rotate-1 cursor-grabbing border-blue-200 bg-white/95 backdrop-blur-sm'
          : opportunity.archived
          ? 'border-gray-300 bg-gray-50/70 opacity-70 shadow-sm hover:shadow-md hover:-translate-y-0.5'
          : isRed
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-lg hover:-translate-y-0.5'
          : isYellow
          ? 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white shadow-sm hover:shadow-lg hover:-translate-y-0.5'
          : `bg-white border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${!canDrag ? 'cursor-not-allowed' : ''}`
      }`}
      {...attributes}
      onDoubleClick={() => {
        if ((isAdmin || isOwner) && !isOverlay) {
          onEdit(opportunity);
        }
      }}
      onTouchStart={handleTouchStart}
    >
      {opportunity.archived && (
        <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden rounded-tl-xl pointer-events-none z-20">
          <div className="absolute top-[12px] left-[-20px] w-[82px] bg-red-500 text-white text-[8px] font-black uppercase text-center py-0.5 -rotate-[45deg] shadow-sm">
            ARCHIVADA
          </div>
        </div>
      )}

      {/* Actions Menu Popover */}
      {(isAdmin || isOwner) && (
        <div className="absolute top-2.5 right-2.5 z-20" ref={menuRef}>
          <button
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical size={16} />
          </button>
          {isMenuOpen && (
            <div className="absolute top-0 right-full mr-2 flex items-center space-x-1 bg-white p-1 rounded-full shadow-lg border border-gray-100 z-30">
              {(isAdmin || isOwner) && (
                <button
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(opportunity);
                    setIsMenuOpen(false);
                  }}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
              )}
              {(isAdmin || isOwner) && (
                <button
                  className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(opportunity);
                    setIsMenuOpen(false);
                  }}
                  title={opportunity.archived ? 'Desarchivar' : 'Archivar'}
                >
                  {opportunity.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                </button>
              )}
              {isAdmin && (
                <button
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(opportunity);
                    setIsMenuOpen(false);
                  }}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Draggable and Clickable Content */}
      <div 
        {...listeners} 
        className={`${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} flex-grow flex flex-col justify-between`}
      >
        {/* Opportunity Header */}
        <div className="flex flex-col gap-0.5 pr-8">
          
          <h4 className="font-bold text-slate-900 text-sm leading-snug truncate" title={opportunity.nombre_proyecto}>
            {opportunity.nombre_proyecto}
          </h4>
        </div>

        {/* Opportunity Body / Client */}
        <div className="mt-1 flex-grow flex flex-col justify-end">
          <p className="font-semibold text-slate-800 text-xs truncate flex items-center gap-1" title={opportunity.company?.nombre || opportunity.empresa || ''}>
            <Building2 size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{opportunity.company?.nombre || opportunity.empresa || 'Sin empresa'}</span>
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-sm font-bold text-slate-700">
              ${Number(opportunity.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 0 })} <span className="text-xs font-semibold text-slate-500">{opportunity.moneda}</span>
            </span>
            <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full inline-block shrink-0" style={tagStyle}>
              {opportunity.linea_negocio?.strname || ''}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-1.5">
          <div className="bg-gray-200 rounded-full h-1 w-full relative">
            <div className="h-1 rounded-full transition-all duration-300" style={{ width: `${progress.percent}%`, backgroundColor: progress.color }}></div>
          </div>
        </div>

        {/* Opportunity Footer (Stars + Clock) */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1.5">
          {/* Stars */}
          <div className="flex gap-0.5 items-center">
            {[1, 2, 3].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= (opportunity.priority ?? 0) ? 'text-amber-400 fill-current' : 'text-slate-200'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>

          {/* Right side: Traffic Light + Avatar */}
          <div className="flex items-center gap-2">
            {/* Traffic Light */}
            {stageLimit ? (
              <div
                className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isRed 
                    ? 'text-red-600 bg-red-50 border-red-200/50' 
                    : isYellow
                    ? 'text-amber-600 bg-amber-50 border-amber-200/50'
                    : 'text-slate-400 bg-slate-50 border-slate-100/60'
                }`}
                title={`Límite de etapa: ${stageLimit} días`}
              >
                <Clock size={10} />
                {days}d / {stageLimit}d
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-100/60">
                <Clock size={10} />
                {days} {days === 1 ? 'día' : 'días'}
              </div>
            )}

            {/* User Avatar */}
            <Avatar opportunity={opportunity} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
