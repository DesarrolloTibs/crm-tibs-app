import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Briefcase, Calendar, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../core/models/Notification';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Hace un momento';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  };

  const getNotificationIcon = (type: string) => {
    const typeLower = (type || '').toLowerCase();

    if (typeLower === 'opportunity_red') {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }

    if (typeLower.includes('opportunity')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
          <Briefcase className="w-5 h-5" />
        </div>
      );
    }

    if (typeLower.includes('reminder') || typeLower.includes('activity')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
          <Calendar className="w-5 h-5" />
        </div>
      );
    }

    if (typeLower.includes('ticket')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <Info className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0 shadow-sm">
        <Info className="w-5 h-5" />
      </div>
    );
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      await markAsRead(item.id);
    }

    if (item.relatedId) {
      const typeLower = (item.type || '').toLowerCase();
      const titleLower = (item.title || '').toLowerCase();
      const messageLower = (item.message || '').toLowerCase();

      const isTicket = typeLower.includes('ticket') || titleLower.includes('ticket') || messageLower.includes('ticket');
      const isOpportunity = typeLower.includes('opportunity') || typeLower.includes('semaphore') || typeLower.includes('red');

      if (isTicket) {
        navigate(`/helpdesk?ticketId=${item.relatedId}`);
      } else if (isOpportunity) {
        navigate(`/pipeline?opportunityId=${item.relatedId}`);
      } else {
        // Fallback
        navigate(`/pipeline?opportunityId=${item.relatedId}`);
      }
    }

    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botón de la campanita */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell size={22} className="text-slate-700 hover:text-blue-600 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 z-10 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <>
          {/* Backdrop para cerrar en móvil */}
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header del dropdown */}
            <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-bold flex items-center gap-1 hover:underline bg-transparent border-0 cursor-pointer"
                >
                  <CheckCheck size={14} /> Marcar todas leídas
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold text-slate-500">No tienes notificaciones por ahora.</p>
                </div>
              ) : (
                notifications.map((item: NotificationItem) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex gap-3 cursor-pointer transition-all duration-200 border-b border-slate-50/60 relative group ${
                      !item.read ? 'bg-blue-50/20 hover:bg-blue-50/40 font-semibold' : 'bg-white hover:bg-slate-50/80 opacity-90'
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className={`text-xs ${!item.read ? 'text-slate-800 font-bold' : 'text-slate-600 font-medium'} truncate`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${!item.read ? 'text-slate-700' : 'text-slate-500'} line-clamp-2`}>
                        {item.message}
                      </p>
                    </div>
                    
                    {/* Botón flotante para marcar como leída individualmente */}
                    {!item.read && (
                      <div className="flex items-center ml-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Marcar como leída"
                        >
                          <CheckCheck size={14} />
                        </button>
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 group-hover:hidden"></span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer del dropdown */}
            <div className="px-3 py-2.5 bg-slate-50/50 border-t border-slate-100 text-center select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Billy Sales & Services
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
