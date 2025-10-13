import React, { useState, useRef, useEffect } from 'react';
import type { Opportunity, OpportunityStageType} from '../../core/models/Opportunity';
import { useAuth } from '../../hooks/useAuth';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, Building2, Archive, ArchiveRestore, MoreVertical, Mail, User } from 'lucide-react';
import Popover from './Popover';


interface Props {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
}

const stageProgress: Record<OpportunityStageType, { percent: number; color: string }> = {
  'Nuevo': { percent: 0, color: '#c0c9d8' },
  'Descubrimiento': { percent: 20, color: '#80d3f4' },
  'Estimación': { percent: 40, color: '#25b4ad' },
  'Propuesta': { percent: 60, color: '#3174b8' },
  'Negociación': { percent: 80, color: '#a7d05e' },
  'Ganada': { percent: 100, color: '#309b47' },
  'Perdida': { percent: 100, color: '#a92c56' },
  'Cancelada': { percent: 100, color: '#f68547' },
};

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

const OpportunityCard: React.FC<Props> = ({ opportunity, onEdit, onDelete, onArchive }) => {
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: opportunity.id,
    disabled: !(isAdmin || isOwner), // Deshabilita el drag si no es admin o dueño
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canDrag = isAdmin || isOwner;
  const progress = stageProgress[opportunity.etapa] || { percent: 0, color: 'bg-gray-400' };
  const tagColorString = businessLineColors[opportunity.linea_negocio] || '#f3f4f6 #1f2937'; // Default to gray-100 and gray-800
  const [tagBgColor, tagTextColor] = tagColorString.split(' ');
  const tagStyle = {
    backgroundColor: tagBgColor,
    color: tagTextColor,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white m-2 p-2 pt-2 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1 relative group w-[250px] h-[120px] touch-none ${!canDrag ? 'cursor-not-allowed' : ''}`}
      {...attributes}
    >
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
        <h4 className="font-bold text-[#000000] text-sm top-0 leading-snug truncate pr-8" title={opportunity.nombre_proyecto}>{opportunity.nombre_proyecto}</h4>
        <p className="flex items-center gap-2 font-semibold italic text-[#579bd3] text-xs truncate pt-1" title={opportunity.empresa}><Building2 size={14} /> {opportunity.empresa}</p>
        <div className="text-right flex-shrink-0 mt-0">
          <span className="text-lg font-bold text-[#2f5367]">${Number(opportunity.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
          <span className="ml-1 text-xs text-[#2f5367] font-bold">{opportunity.moneda}</span>
        </div>
        <div className="mt-0">
          <div className="bg-gray-200 rounded-full h-1 w-full relative"><div className="h-1 rounded-full transition-all duration-300" style={{ width: `${progress.percent}%`, backgroundColor: progress.color }}></div><div className="h-1 rounded-full transition-all duration-300 blur opacity-60 absolute top-0" style={{ width: `${progress.percent}%`, backgroundColor: progress.color }}></div></div>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full mt-2 inline-block" style={tagStyle}>{opportunity.linea_negocio}</span>
        </div>
      </div>
      
    </div>
  );
};

export default OpportunityCard;
