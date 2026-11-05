import { useState, useEffect, useCallback, useRef } from 'react';
import { createAppSocket, safeDisconnect } from '../core/socket/socketClient';
import type { NotificationItem } from '../core/models/Notification';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@core/services/notificationsService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;
  const isInitialConnectRef = useRef<boolean>(true);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const userId = user?.id || user?.sub || (user as any)?.userId;
    if (!user || !userId) return;

    const socket = createAppSocket({
      namespace: 'notifications',
      query: { userId },
    });

    socket.on('connect', () => {
      setIsWsConnected(true);
      socket.emit('register', { userId });
      if (!isInitialConnectRef.current) {
        console.log('[Notifications WS] Reconectado. Re-sincronizando notificaciones vía REST...');
        fetchNotificationsRef.current();
      } else {
        isInitialConnectRef.current = false;
      }
    });

    socket.on('disconnect', (reason) => {
      setIsWsConnected(false);
      console.warn('Desconexión en Notifications WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      setIsWsConnected(false);
      console.warn('Error de conexión en Notifications WebSocket:', err.message);
    });

    socket.on('notification_received', (newNotification: NotificationItem) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      safeDisconnect(socket);
    };
  }, [user?.id, user?.sub]);


  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refresh: fetchNotifications,
    isWsConnected,
    isConnected: isWsConnected,
  };
};
