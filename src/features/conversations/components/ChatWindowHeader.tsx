import React from 'react';
import { ArrowLeft, Bot, Users, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Conversation } from '@core/models/Conversation';
import Select from '@shared/components/Select';
import Button from '@shared/components/Button';
import Switch from '@shared/components/Switch';
import { getChannelIcon, getInitials } from './ChatListSidebar';
import { getWhatsAppWindowStatus } from '../utils/messageUtils';

interface ChatWindowHeaderProps {
  conv: Conversation;
  allUsers: any[];
  onBack: () => void;
  onAssignUser: (userId: string) => void;
  onToggleBot: () => void;
  onOpenTemplates?: () => void;
}

const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = ({
  conv,
  allUsers,
  onBack,
  onAssignUser,
  onToggleBot,
  onOpenTemplates,
}) => {
  const windowStatus = getWhatsAppWindowStatus(conv);

  return (
    <header className="p-4 border-b border-gray-150 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
      {/* Left: back + avatar + info + window status pill */}
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          onClick={onBack}
          className="md:hidden !p-2 !text-gray-600 mr-1"
          title="Volver al listado"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
          {getInitials(conv.clientName)}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-gray-800 text-base">{conv.clientName}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {getChannelIcon(conv.channel)}
            <span className="text-xs text-gray-500 font-bold">{conv.externalId}</span>

            {/* Pill Interactivo de Ventana WhatsApp */}
            {windowStatus.isWhatsApp && (
              <div
                className="relative group cursor-pointer"
                onClick={onOpenTemplates}
              >
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs transition-all hover:opacity-90 ${windowStatus.badgeClass}`}
                >
                  {windowStatus.isExpired ? (
                    <AlertTriangle size={12} className="text-rose-700 shrink-0" />
                  ) : windowStatus.isWarning ? (
                    <Clock size={12} className="text-amber-900 shrink-0" />
                  ) : (
                    <ShieldCheck size={12} className="text-emerald-800 shrink-0" />
                  )}
                  <span>{windowStatus.badgeText}</span>
                </span>

                {/* Tooltip explicativo */}
                <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-72 bg-gray-900/95 text-white text-[11px] leading-relaxed font-medium p-2.5 rounded-xl shadow-xl z-50 pointer-events-none backdrop-blur-xs border border-gray-700">
                  <p className="font-bold mb-1 text-gray-200">Ventana de Atención de WhatsApp:</p>
                  <p>{windowStatus.detailedExplanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: assign + bot switch */}
      <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
      {/* Executive selector */}
      <div className="flex items-center gap-2">
        <Users size={16} className="text-gray-400 shrink-0" />
        <div className="w-48 sm:w-56">
          <Select
            size="sm"
            isSearchable={allUsers.length > 6}
            placeholder="-- Seleccionar Ejecutivo --"
            value={
              allUsers
                .map((u: any) => ({ value: u.id, label: `${u.username} (${u.role})` }))
                .find((opt) => opt.value === conv.assignedUserId) || null
            }
            onChange={(selected: any) => {
              if (selected?.value) onAssignUser(selected.value);
            }}
            options={allUsers.map((u: any) => ({
              value: u.id,
              label: `${u.username} (${u.role})`,
            }))}
          />
        </div>
      </div>

      {/* Bot toggle */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Bot size={14} className={conv.botActive ? 'text-blue-600' : 'text-gray-400'} />
          Bot IA
        </span>
        <Switch
          checked={Boolean(conv.botActive)}
          onChange={() => onToggleBot()}
          color="blue"
          title={conv.botActive ? 'Desactivar Bot IA' : 'Activar Bot IA'}
        />
      </div>
    </div>
  </header>
  );
};

export default ChatWindowHeader;
