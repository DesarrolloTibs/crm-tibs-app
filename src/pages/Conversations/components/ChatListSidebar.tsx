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
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ChannelFilter, Conversation } from '../schemas/conversations.schema';
import EmptyState from '../../../components/shared/EmptyState';
import Badge from '../../../components/shared/Badge';
import {
  formatSidebarDate,
  getWhatsAppWindowStatus,
  renderDeliveryStatusIcon,
} from '../utils/conversations.messages';
import { getInitials } from '../utils/conversations.helpers';

interface ChatListSidebarProps {
  conversations: Conversation[];
  selectedConv: Conversation | null;
  searchQuery: string;
  selectedChannelFilter: ChannelFilter;
  unreadMap?: Record<string, number>;
  onSearchChange: (v: string) => void;
  onChannelChange: (v: ChannelFilter) => void;
  onSelectConv: (conv: Conversation) => void;
  onRefresh: () => void;
}

interface ChannelFilterItem {
  id: ChannelFilter;
  label: string;
  shortLabel: string;
  icon: (active: boolean) => React.ReactNode;
  activeClass: string;
}

const CHANNEL_FILTERS: ChannelFilterItem[] = [
  {
    id: 'all',
    label: 'Todos los canales',
    shortLabel: 'Todos',
    icon: (active) => <MessageSquare size={14} className={active ? 'text-white' : 'text-slate-600'} />,
    activeClass: 'bg-blue-600 text-white shadow-xs',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    icon: (active) => <Smartphone size={14} className={active ? 'text-white' : 'text-emerald-600'} />,
    activeClass: 'bg-emerald-600 text-white shadow-xs',
  },
  {
    id: 'messenger',
    label: 'Facebook Messenger',
    shortLabel: 'Messenger',
    icon: (active) => <Facebook size={14} className={active ? 'text-white' : 'text-blue-600'} />,
    activeClass: 'bg-blue-600 text-white shadow-xs',
  },
  {
    id: 'instagram',
    label: 'Instagram Direct',
    shortLabel: 'Instagram',
    icon: (active) => <Instagram size={14} className={active ? 'text-white' : 'text-rose-600'} />,
    activeClass: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs',
  },
  {
    id: 'webchat',
    label: 'WebChat Asistente',
    shortLabel: 'WebChat',
    icon: (active) => <Globe size={14} className={active ? 'text-white' : 'text-purple-600'} />,
    activeClass: 'bg-purple-600 text-white shadow-xs',
  },
];

export const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'whatsapp':
      return (
        <span
          className="inline-flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full text-white ring-2 ring-white shrink-0 shadow-2xs"
          title="WhatsApp"
        >
          <Smartphone size={12} />
        </span>
      );
    case 'messenger':
    case 'facebook':
      return (
        <span
          className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white ring-2 ring-white shrink-0 shadow-2xs"
          title="Facebook Messenger"
        >
          <Facebook size={12} />
        </span>
      );
    case 'instagram':
      return (
        <span
          className="inline-flex items-center justify-center w-5 h-5 bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 rounded-full text-white ring-2 ring-white shrink-0 shadow-2xs"
          title="Instagram"
        >
          <Instagram size={12} />
        </span>
      );
    case 'webchat':
      return (
        <span
          className="inline-flex items-center justify-center w-5 h-5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full text-white ring-2 ring-white shrink-0 shadow-2xs"
          title="WebChat"
        >
          <Globe size={12} />
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center justify-center w-5 h-5 bg-slate-500 rounded-full text-white ring-2 ring-white shrink-0 shadow-2xs"
          title="Mensajería"
        >
          <MessageSquare size={12} />
        </span>
      );
  }
};

export const ChatListSidebar: React.FC<ChatListSidebarProps> = ({
  conversations,
  selectedConv,
  searchQuery,
  selectedChannelFilter,
  unreadMap = {},
  onSearchChange,
  onChannelChange,
  onSelectConv,
  onRefresh,
}) => {
  const totalUnread = Object.values(unreadMap).reduce((acc, curr) => acc + (curr || 0), 0);

  const getChannelUnread = (channelId: ChannelFilter) => {
    if (channelId === 'all') return totalUnread;
    return conversations
      .filter((c) => {
        if (channelId === 'messenger') return c.channel === 'messenger' || c.channel === 'facebook';
        return c.channel === channelId;
      })
      .reduce((acc, c) => acc + (unreadMap[c.id] || 0), 0);
  };

  return (
    <aside
      className={`w-full md:w-[320px] lg:w-[340px] xl:w-[360px] md:min-w-[320px] md:max-w-[360px] shrink-0 border-r border-slate-200 bg-slate-50/40 ${
        selectedConv ? 'hidden md:flex flex-col' : 'flex flex-col'
      }`}
    >
      {/* Cabecera del sidebar con contador global llamativo */}
      <div className="p-3.5 border-b border-slate-200 flex justify-between items-center gap-2 bg-white">
        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <MessageSquare size={17} className="text-blue-600" />
          <span>Bandeja de Chats</span>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[11px] font-black rounded-full shadow-xs animate-pulse">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Selector de filtros de canal super compacto (altura h-8, sin desborde ni cortes) */}
      <div className="px-2.5 py-2 bg-white border-b border-slate-100">
        <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-100 rounded-lg">
          {CHANNEL_FILTERS.map(({ id, label, shortLabel, icon, activeClass }) => {
            const chUnread = getChannelUnread(id);
            const isFilterActive = selectedChannelFilter === id;
            return (
              <button
                key={id}
                onClick={() => onChannelChange(id)}
                title={`${label}${chUnread > 0 ? ` • ${chUnread} sin leer` : ''}`}
                className={`relative flex items-center justify-center gap-1 h-7 rounded-md transition-all text-[11px] font-bold cursor-pointer ${
                  isFilterActive
                    ? `${activeClass} shadow-2xs scale-[1.02]`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {/* Ícono representativo */}
                <span className="shrink-0">
                  {icon(isFilterActive)}
                </span>

                {/* Texto corto */}
                <span className="truncate max-w-[32px] sm:max-w-none">
                  {shortLabel === 'Todos' ? 'Todo' : shortLabel === 'WhatsApp' ? 'WA' : shortLabel === 'Messenger' ? 'FB' : shortLabel === 'Instagram' ? 'IG' : 'Web'}
                </span>

                {/* Badge de mensajes no leídos del canal */}
                {chUnread > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[15px] h-3.5 px-0.5 flex items-center justify-center text-[8px] font-black rounded-full shadow-2xs ring-1 ring-white animate-pulse ${
                      isFilterActive ? 'bg-white text-slate-900' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {chUnread > 99 ? '99+' : chUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Buscador reactivo */}
      <div className="p-2.5 border-b border-slate-100 bg-white">
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:bg-white transition-all">
          <Search size={14} className="text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Buscar por contacto o mensaje..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Lista scrolleable de conversaciones */}
      <div className="flex-grow overflow-y-auto divide-y divide-slate-100 hide-scrollbar no-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-slate-300" />}
              title="Sin conversaciones"
              message={
                searchQuery || selectedChannelFilter !== 'all'
                  ? 'No hay chats que coincidan con los filtros aplicados.'
                  : 'Aún no se han recibido interacciones por este canal.'
              }
            />
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedConv?.id === conv.id;
            const unreadCount = unreadMap[conv.id] || 0;
            const windowStatus = getWhatsAppWindowStatus(conv);

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConv(conv)}
                className={`p-3 transition-all cursor-pointer border-l-4 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-2xs'
                    : unreadCount > 0
                    ? 'bg-blue-50/30 hover:bg-blue-50/50 border-blue-500'
                    : 'bg-white hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar con insignia de canal superpuesta y punto de no leídos */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200 shadow-2xs">
                      {getInitials(conv.clientName)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                      {getChannelIcon(conv.channel)}
                    </div>
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full shadow-xs ring-1 ring-rose-200"
                        title={`${unreadCount} mensaje(s) pendiente(s)`}
                      />
                    )}
                  </div>

                  {/* Datos del contacto y último mensaje */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <h3
                        className={`text-xs truncate ${
                          unreadCount > 0
                            ? 'font-black text-slate-900'
                            : isSelected
                            ? 'font-bold text-blue-950'
                            : 'font-semibold text-slate-800'
                        }`}
                      >
                        {conv.clientName}
                      </h3>
                      <div className="flex flex-col items-end shrink-0 gap-1 ml-2">
                        <span
                          className={`text-[10px] ${
                            unreadCount > 0 ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {formatSidebarDate(conv.lastMessage?.createdAt || conv.updatedAt || conv.createdAt)}
                        </span>

                        {/* Badge de mensajes no leídos destacado y bien visible */}
                        {unreadCount > 0 && (
                          <span
                            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-[11px] font-black rounded-full shadow-sm ring-2 ring-white animate-pulse"
                            title={`${unreadCount} mensajes sin leer`}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview de último mensaje con delivery status tick */}
                    <div className="flex items-center gap-1 text-[11px] truncate mb-1.5">
                      {conv.lastMessage && conv.lastMessage.sender !== 'contact' && (
                        <span className="shrink-0">{renderDeliveryStatusIcon(conv.lastMessage.status)}</span>
                      )}
                      <span
                        className={`truncate ${
                          unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'
                        }`}
                      >
                        {conv.lastMessage?.content || 'Sin mensajes recientes'}
                      </span>
                    </div>

                    {/* Badges y estados de ventana de 23h / Bot IA */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Estado del Bot IA */}
                      {conv.botActive ? (
                        <Badge variant="info" className="!text-[9px] !px-1.5 !py-0 flex items-center gap-1">
                          <Bot size={10} /> Bot IA
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="!text-[9px] !px-1.5 !py-0 flex items-center gap-1 text-slate-600">
                          <User size={10} /> Asesor
                        </Badge>
                      )}

                      {/* Pill de Ventana WhatsApp */}
                      {windowStatus.isWhatsApp && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[9px] font-bold border ${windowStatus.badgeClass}`}
                          title={windowStatus.detailedExplanation}
                        >
                          {windowStatus.isExpired ? (
                            <AlertTriangle size={9} className="text-rose-600 shrink-0" />
                          ) : windowStatus.isWarning ? (
                            <Clock size={9} className="text-amber-700 shrink-0 animate-pulse" />
                          ) : (
                            <ShieldCheck size={9} className="text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate max-w-[85px]">{windowStatus.badgeText}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatListSidebar;
