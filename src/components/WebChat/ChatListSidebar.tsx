import React from 'react';
import {
  MessageSquare,
  Search,
  Smartphone,
  Facebook,
  Instagram,
  Globe,
  Bot,
  User,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { ChannelFilter } from '../../hooks/useConversationsSocket';
import EmptyState from '../shared/EmptyState';
import { formatSidebarDate } from '../../utils/messageUtils';

interface ChatListSidebarProps {
  conversations: any[];
  selectedConv: any | null;
  searchQuery: string;
  selectedChannelFilter: ChannelFilter;
  onSearchChange: (v: string) => void;
  onChannelChange: (v: ChannelFilter) => void;
  onSelectConv: (conv: any) => void;
  onRefresh: () => void;
  onOpenSimulator: () => void;
}

const CHANNEL_FILTERS: { id: ChannelFilter; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { id: 'all',       label: 'Todos',     icon: null,                        activeClass: 'bg-blue-600 text-white' },
  { id: 'webchat',   label: 'WebChat',   icon: <Globe size={12} />,         activeClass: 'bg-purple-600 text-white' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: <Smartphone size={12} />,    activeClass: 'bg-emerald-600 text-white' },
  { id: 'messenger', label: 'Messenger', icon: <Facebook size={12} />,      activeClass: 'bg-blue-500 text-white' },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={12} />,     activeClass: 'bg-purple-500 text-white' },
];

export const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'whatsapp':  return <span className="p-1.5 bg-emerald-500 rounded-lg text-white" title="WhatsApp"><Smartphone size={16} /></span>;
    case 'messenger': return <span className="p-1.5 bg-blue-500 rounded-lg text-white" title="Messenger"><Facebook size={16} /></span>;
    case 'instagram': return <span className="p-1.5 bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 rounded-lg text-white" title="Instagram"><Instagram size={16} /></span>;
    case 'webchat':   return <span className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg text-white" title="WebChat Público"><Globe size={16} /></span>;
    default:          return <span className="p-1.5 bg-gray-500 rounded-lg text-white"><MessageSquare size={16} /></span>;
  }
};

export const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

const ChatListSidebar: React.FC<ChatListSidebarProps> = ({
  conversations, selectedConv, searchQuery, selectedChannelFilter,
  onSearchChange, onChannelChange, onSelectConv, onRefresh, onOpenSimulator,
}) => (
  <aside className={`w-full md:w-80 border-r border-gray-150 bg-slate-50/50 shrink-0 ${selectedConv ? 'hidden md:flex flex-col' : 'flex flex-col'}`}>
    {/* Header */}
    <div className="p-4 border-b border-gray-150 flex justify-between items-center gap-2">
      <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
        <MessageSquare size={20} className="text-blue-700" /> Mensajería
      </h2>
      <div className="flex items-center gap-1">
        <button onClick={onRefresh} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Actualizar chats">
          <RefreshCw size={16} />
        </button>
        <button onClick={onOpenSimulator} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer" title="Simular Mensaje">
          <Sparkles size={12} /> Simulador
        </button>
      </div>
    </div>

    {/* Channel filter tabs */}
    <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto text-[11px] font-bold no-scrollbar">
      {CHANNEL_FILTERS.map(({ id, label, icon, activeClass }) => (
        <button
          key={id}
          onClick={() => onChannelChange(id)}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${selectedChannelFilter === id ? activeClass : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {icon}{label}
        </button>
      ))}
    </div>

    {/* Search */}
    <div className="p-3 border-b border-gray-100 bg-white">
      <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:bg-white transition-all">
        <Search size={16} className="text-gray-400 absolute left-3" />
        <input
          type="text"
          placeholder="Buscar chats o contactos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full py-2 pl-9 pr-3 text-sm bg-transparent border-0 outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
    </div>

    {/* List */}
    <div className="flex-grow overflow-y-auto no-scrollbar">
      {conversations.length === 0 ? (
        <EmptyState title="No se encontraron conversaciones" message="Intenta cambiar los filtros o el buscador." icon={<MessageSquare size={32} className="text-gray-300" />} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {conversations.map((conv) => {
            const isSelected = selectedConv && selectedConv.id === conv.id;
            return (
              <li
                key={conv.id}
                onClick={() => onSelectConv(conv)}
                className={`p-4 flex gap-3 cursor-pointer transition-all hover:bg-blue-50/50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600 pl-3' : 'border-l-4 border-transparent'}`}
              >
                <div className="w-11 h-11 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200">
                  {getInitials(conv.clientName)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center gap-1">
                    <span className="font-bold text-gray-800 text-sm truncate">{conv.clientName}</span>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {conv.lastMessage ? formatSidebarDate(conv.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate font-medium mt-1">
                    {conv.lastMessage ? conv.lastMessage.content : 'Sin mensajes'}
                  </p>
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="flex items-center gap-1.5">
                      {getChannelIcon(conv.channel)}
                      <span className="text-[10px] text-gray-400 font-bold truncate max-w-[90px]">{conv.externalId}</span>
                    </div>
                    {conv.botActive ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded uppercase border border-blue-100"><Bot size={10} /> Bot</span>
                    ) : (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded uppercase border border-amber-100"><User size={10} /> Humano</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </aside>
);

export default ChatListSidebar;
