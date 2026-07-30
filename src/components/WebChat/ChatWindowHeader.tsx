import React from 'react';
import { ArrowLeft, Bot, Users } from 'lucide-react';
import { getChannelIcon, getInitials } from './ChatListSidebar';

interface ChatWindowHeaderProps {
  conv: any;
  allUsers: any[];
  onBack: () => void;
  onAssignUser: (userId: string) => void;
  onToggleBot: () => void;
}

const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = ({
  conv, allUsers, onBack, onAssignUser, onToggleBot,
}) => (
  <header className="p-4 border-b border-gray-150 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
    {/* Left: back + avatar + info */}
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer mr-1" title="Volver al listado">
        <ArrowLeft size={20} />
      </button>
      <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
        {getInitials(conv.clientName)}
      </div>
      <div className="text-left">
        <h3 className="font-extrabold text-gray-800 text-base">{conv.clientName}</h3>
        <div className="flex items-center gap-2 mt-1">
          {getChannelIcon(conv.channel)}
          <span className="text-xs text-gray-500 font-bold">{conv.externalId}</span>
        </div>
      </div>
    </div>

    {/* Right: assign + bot switch */}
    <div className="flex flex-wrap items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
      {/* Executive selector */}
      <div className="flex items-center gap-2">
        <Users size={16} className="text-gray-400" />
        <select
          value={conv.assignedUserId || ''}
          onChange={(e) => onAssignUser(e.target.value)}
          className="py-1 px-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 bg-white outline-none focus:border-blue-500 transition-colors"
        >
          {!conv.assignedUserId && (
            <option value="" disabled hidden>-- Seleccionar Ejecutivo --</option>
          )}
          {allUsers.map((u: any) => (
            <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
          ))}
        </select>
      </div>

      {/* Bot toggle */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Bot size={14} className={conv.botActive ? 'text-blue-600' : 'text-gray-400'} />
          Bot IA
        </span>
        <button
          onClick={onToggleBot}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${conv.botActive ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conv.botActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  </header>
);

export default ChatWindowHeader;
