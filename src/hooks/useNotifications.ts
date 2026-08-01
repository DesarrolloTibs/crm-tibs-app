import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { NotificationItem } from '../core/models/Notification';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationsService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const userId = user?.id || user?.sub || (user as any)?.userId;
    if (!user || !userId) return;

    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
    const socket: Socket = io(baseUrl, {
      query: { userId },
      transports: ['polling'],
    });

    socket.on('connect', () => {
      socket.emit('register', { userId });
    });

    socket.on('notification_received', (newNotification: NotificationItem) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socket.disconnect();
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
  };
};
