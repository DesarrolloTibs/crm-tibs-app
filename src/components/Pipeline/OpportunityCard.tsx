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

  if (imageUrl) {
    return (
      <>
        <img
          ref={avatarRef as React.RefObject<HTMLImageElement>}
          src={imageUrl}
          alt={ejecutivo?.username || 'Avatar'}
          className="w-7 h-7 rounded-full object-cover cursor-pointer"
          title={ejecutivo?.username || 'No asignado'}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
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
        className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold cursor-pointer" 
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
  const tagColorString = businessLineColors[opportunity.linea_negocio] || '#f3f4f6 #1f2937'; // Default to gray-100 and gray-800
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`m-2 p-2 pt-2 rounded-xl border flex flex-col justify-between transition-all relative group w-[250px] h-[130px] touch-none ${
        isDraggingStyle
          ? 'opacity-30 blur-[1.5px] pointer-events-none shadow-none border-dashed border-gray-300'
          : isOverlay
          ? 'shadow-xl scale-[1.03] rotate-1 cursor-grabbing border-blue-200 bg-white/95 backdrop-blur-sm'
          : opportunity.archived
          ? 'border-gray-300 bg-gray-50/70 opacity-70 shadow-sm hover:shadow-md hover:-translate-y-1'
          : isRed
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-lg hover:-translate-y-1'
          : isYellow
          ? 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white shadow-sm hover:shadow-lg hover:-translate-y-1'
          : `bg-white border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 ${!canDrag ? 'cursor-not-allowed' : ''}`
      }`}
      {...attributes}
      onDoubleClick={() => {
        if ((isAdmin || isOwner) && !isOverlay) {
          onEdit(opportunity);
        }
      }}
    >
      {opportunity.archived && (
        <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden rounded-tl-xl pointer-events-none z-20">
          <div className="absolute top-[12px] left-[-20px] w-[82px] bg-red-500 text-white text-[8px] font-black uppercase text-center py-0.5 -rotate-[45deg] shadow-sm">
            ARCHIVADA
          </div>
        </div>
      )}
      {/* Action buttons are outside the draggable area */}
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
        {(isAdmin || isOwner) && (
          <button
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical size={16} />
          </button>
        )}
        {isMenuOpen && (
          <div className="absolute top-0 right-full mr-2 flex items-center space-x-1 bg-white p-1 rounded-full shadow-lg border border-gray-100">
            {(isAdmin || isOwner) && (
              <button
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer"
                onClick={() => { onEdit(opportunity); setIsMenuOpen(false); }}
                title="Editar"
              >
                <Edit size={16} />
              </button>
            )}
            {(isAdmin || isOwner) && (
              <button
                className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full cursor-pointer"
                onClick={() => { onArchive(opportunity); setIsMenuOpen(false); }}
                title={opportunity.archived ? 'Desarchivar' : 'Archivar'}
              >
                {opportunity.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              </button>
            )}
            {isAdmin && (
              <button
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full cursor-pointer"
                onClick={() => { onDelete(opportunity); setIsMenuOpen(false); }}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Avatar is outside the draggable area */}
      <div className="absolute bottom-1.5 right-2 z-10">
        <Avatar opportunity={opportunity} />
      </div>

      {/* This div is the main content and the draggable handle */}
      <div {...listeners} className={`${canDrag ? 'cursor-grab' : 'cursor-default'} flex-grow flex flex-col h-full`}>
        <h4 className={`font-bold text-[#000000] text-sm top-0 leading-snug truncate pr-8 ${opportunity.archived ? 'pl-7' : ''}`} title={opportunity.nombre_proyecto}>{opportunity.nombre_proyecto}</h4>
        <p className="flex items-center gap-2 font-semibold italic text-[#579bd3] text-xs truncate pt-1" title={opportunity.company?.nombre || opportunity.empresa || ''}><Building2 size={14} /> {opportunity.company?.nombre || opportunity.empresa || 'Sin empresa'}</p>
        <div className="text-right flex-shrink-0 mt-0">
          <span className="text-lg font-bold text-[#2f5367]">${Number(opportunity.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
          <span className="ml-1 text-xs text-[#2f5367] font-bold">{opportunity.moneda}</span>
        </div>
        <div className="mt-0">
          <div className="bg-gray-200 rounded-full h-1 w-full relative"><div className="h-1 rounded-full transition-all duration-300" style={{ width: `${progress.percent}%`, backgroundColor: progress.color }}></div><div className="h-1 rounded-full transition-all duration-300 blur opacity-60 absolute top-0" style={{ width: `${progress.percent}%`, backgroundColor: progress.color }}></div></div>
          <div className="flex flex-col items-start gap-0.5 mt-1">
            <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full inline-block" style={tagStyle}>
              {opportunity.linea_negocio}
            </span>
            <span 
              className={`text-[8px] font-bold flex items-center gap-1 shrink-0 ${
                isRed 
                  ? 'text-red-500 bg-red-50/70 px-1 py-0.5 rounded border border-red-200/50' 
                  : isYellow
                  ? 'text-amber-600 bg-amber-50/70 px-1 py-0.5 rounded border border-amber-200/50'
                  : 'text-gray-400 bg-gray-50/50 px-1 py-0.5 rounded border border-gray-100/40'
              }`}
              title={stageLimit ? `Límite de la etapa: ${stageLimit} días` : 'Sin límite de días en esta etapa'}
            >
              <Clock size={9} />
              {days === 1 ? '1 día' : `${days} días`}
              {stageLimit ? ` / ${stageLimit}d` : ''}
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default OpportunityCard;
