import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Briefcase, Calendar, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../core/models/Notification';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    switch (type) {
      case 'opportunity_red':
        return <AlertTriangle className="text-rose-500 w-5 h-5 shrink-0" />;
      case 'opportunity_created':
      case 'opportunity_updated':
      case 'opportunity_moved':
      case 'opportunity_assigned':
        return <Briefcase className="text-indigo-600 w-5 h-5 shrink-0" />;
      case 'activity_reminder':
        return <Calendar className="text-amber-500 w-5 h-5 shrink-0" />;
      default:
        return <Info className="text-blue-500 w-5 h-5 shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botón de la campanita */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell size={24} className="text-slate-700 hover:text-indigo-600 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-10 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header del dropdown */}
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-200 hover:text-white flex items-center gap-1 transition-colors font-medium"
              >
                <CheckCheck size={14} /> Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
                <p className="text-sm font-medium">No tienes notificaciones por ahora.</p>
              </div>
            ) : (
              notifications.map((item: NotificationItem) => (
                <div
                  key={item.id}
                  onClick={() => !item.read && markAsRead(item.id)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !item.read ? 'bg-blue-50/50 font-medium' : 'bg-white opacity-85'
                  }`}
                >
                  <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm ${!item.read ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                        {item.title}
                      </p>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer del dropdown */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              CRM Friday Real-time System
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
