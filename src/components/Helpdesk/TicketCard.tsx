import React from 'react';
import type { Ticket } from '../../core/models/Ticket';
import { User, Building2, Clock, AlertTriangle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  ticket: Ticket;
  onClick: () => void;
  isOverlay?: boolean;
}

const getInitials = (name = 'N A') => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const TicketCard: React.FC<Props> = ({ ticket, onClick, isOverlay = false }) => {
  const { ticket_number, strtitle, cliente, responsable, contactName, contactEmail, priority, stage_entered_at, stage } = ticket;
  const numStr = ticket_number.toString().padStart(5, '0');

  const { isAdmin, isEjecutivo, user: currentUser } = useAuth();

  const canDrag = isAdmin || (isEjecutivo && ticket.responsable_id === currentUser?.sub);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    disabled: !canDrag || isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const isDraggingStyle = isDragging && !isOverlay;

  // Customer Name and Company display
  const customerName = cliente ? `${cliente.nombre} ${cliente.apellido}` : (contactName || 'Cliente Externo');
  const companyName = cliente ? (cliente.company?.nombre || cliente.empresa) : (ticket.contactPhone ? `Tel: ${ticket.contactPhone}` : contactEmail);

  // Semáforo logic based on stage max days limit
  const getDaysInStage = () => {
    const enteredDate = stage_entered_at ? new Date(stage_entered_at) : new Date(ticket.fecha_apertura);
    const diffTime = Math.max(0, Date.now() - enteredDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = getDaysInStage();
  const limitDays = stage?.intmaxdays;

  const isRed = limitDays !== undefined && limitDays !== null && limitDays > 0 && days > limitDays;
  const isYellow = limitDays !== undefined && limitDays !== null && limitDays > 0 && !isRed && days >= (limitDays / 2);

  // Unattended alert: no responsible and created more than 24 hours ago
  const hoursSinceCreated = Math.floor(Math.max(0, Date.now() - new Date(ticket.fecha_apertura).getTime()) / (1000 * 60 * 60));
  const isUnattendedAlert = !responsable && hoursSinceCreated >= 24;

  const baseUrl = import.meta.env.VITE_BASE_URL || '';
  const avatarUrl = responsable?.profileImageUrl ? `${baseUrl}${responsable.profileImageUrl}` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (isDragging) return;
        onClick();
      }}
      className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[145px] w-full min-w-[220px] max-w-[300px] relative overflow-hidden group touch-none ${
        isDraggingStyle 
          ? 'opacity-30 blur-[1.5px] pointer-events-none shadow-none border-dashed border-gray-300' 
          : isRed 
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-white' 
          : isYellow
          ? 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white'
          : 'border-slate-200 hover:border-slate-350'
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      {...attributes}
      {...listeners}
    >
      {/* Unattended indicator */}
      {isUnattendedAlert && (
        <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-bl shadow-sm flex items-center gap-0.5 animate-pulse z-10">
          <AlertTriangle size={8} />
          Desatendido
        </div>
      )}

      {/* Ticket Header */}
      <div className="flex flex-col gap-0.5 pr-14">
        <span className="text-[10px] font-bold text-slate-400">
          #{numStr}
        </span>
        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2" title={strtitle}>
          {strtitle}
        </h4>
      </div>

      {/* User Avatar */}
      <div className="absolute top-4 right-4">
        {responsable ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={responsable.username}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
              title={`Asignado a: ${responsable.username}`}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold border border-slate-200"
              title={`Asignado a: ${responsable.username}`}
            >
              {getInitials(responsable.username)}
            </div>
          )
        ) : (
          <div
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-dashed border-slate-300"
            title="Sin responsable"
          >
            <User size={12} />
          </div>
        )}
      </div>

      {/* Ticket Body / Client */}
      <div className="mt-2 flex-grow flex flex-col justify-end">
        <p className="font-semibold text-slate-800 text-xs truncate" title={customerName}>
          {customerName}
        </p>
        {companyName && (
          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5 font-medium">
            <Building2 size={11} className="text-slate-400" />
            {companyName}
          </p>
        )}
      </div>

      {/* Ticket Footer (Stars + Clock) */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
        {/* Stars */}
        <div className="flex gap-0.5 items-center">
          {[1, 2, 3].map((star) => (
            <svg
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= (priority ?? 0) ? 'text-amber-400 fill-current' : 'text-slate-200'
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

        {/* Traffic Light */}
        {limitDays ? (
          <div
            className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              isRed 
                ? 'text-red-600 bg-red-50 border-red-200/50' 
                : isYellow
                ? 'text-amber-600 bg-amber-50 border-amber-200/50'
                : 'text-slate-400 bg-slate-50 border-slate-100/60'
            }`}
            title={`Límite de etapa: ${limitDays} días`}
          >
            <Clock size={10} />
            {days}d / {limitDays}d
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-100/60">
            <Clock size={10} />
            {days} {days === 1 ? 'día' : 'días'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketCard;
