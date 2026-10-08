import React from 'react';
import { ArrowLeft, Bot, Users, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Conversation } from '../schemas/conversations.schema';
import { getChannelIcon } from './ChatListSidebar';
import { getInitials } from '../utils/conversations.helpers';
import { getWhatsAppWindowStatus } from '../utils/conversations.messages';

interface ChatWindowHeaderProps {
  conv: Conversation;
  allUsers: any[];
  onBack: () => void;
  onAssignUser: (userId: string) => void;
  onToggleBot: () => void;
  onOpenTemplates?: () => void;
}

export const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = ({
  conv,
  allUsers,
  onBack,
  onAssignUser,
  onToggleBot,
  onOpenTemplates,
}) => {
  const windowStatus = getWhatsAppWindowStatus(conv);

  return (
    <header className="p-3.5 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-2xs">
      {/* Izquierda: Volver (móvil) + Avatar + Información del contacto + Pill de Ventana */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mr-0.5"
          title="Volver a lista de chats"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          {getInitials(conv.clientName)}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm">{conv.clientName}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {getChannelIcon(conv.channel)}
            <span className="text-[11px] text-slate-500 font-bold">{conv.externalId}</span>

            {/* Pill Interactivo de Ventana WhatsApp */}
            {windowStatus.isWhatsApp && (
              <div
                className="relative group cursor-pointer"
                onClick={onOpenTemplates}
              >
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs transition-all hover:opacity-90 ${windowStatus.badgeClass}`}
                >
                  {windowStatus.isExpired ? (
                    <AlertTriangle size={11} className="text-rose-700 shrink-0" />
                  ) : windowStatus.isWarning ? (
                    <Clock size={11} className="text-amber-900 shrink-0 animate-pulse" />
                  ) : (
                    <ShieldCheck size={11} className="text-emerald-800 shrink-0" />
                  )}
                  <span>{windowStatus.badgeText}</span>
                </span>

                {/* Tooltip explicativo */}
                <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-72 bg-slate-900/95 text-white text-[11px] leading-relaxed font-medium p-2.5 rounded-xl shadow-xl z-50 pointer-events-none backdrop-blur-xs border border-slate-700">
                  <p className="font-bold mb-1 text-slate-200">Ventana de Atención de WhatsApp:</p>
                  <p>{windowStatus.detailedExplanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Derecha: Asignación de Asesor + Switch del Bot IA */}
      <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
        {/* Selector de Asesor Responsable */}
        <div className="flex items-center gap-1.5">
          <Users size={15} className="text-slate-400" />
          <select
            value={conv.assignedUserId || ''}
            onChange={(e) => onAssignUser(e.target.value)}
            className="py-1 px-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {!conv.assignedUserId && (
              <option value="" disabled hidden>-- Asignar Ejecutivo --</option>
            )}
            {allUsers.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.username} {u.role ? `(${u.role})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Switch de Bot IA */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Bot size={14} className={conv.botActive ? 'text-indigo-600' : 'text-slate-400'} />
            Bot IA
          </span>
          <button
            onClick={onToggleBot}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              conv.botActive ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
            title={conv.botActive ? 'Desactivar Bot IA (Atención Humana)' : 'Activar Bot IA (Respuesta Automática)'}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                conv.botActive ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChatWindowHeader;
