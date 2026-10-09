import axiosInstance from "../core/axios/axiosInstance";
import type { NotificationItem } from '../core/models/Notification';
import { NOTIFICATIONS } from '../global/endpoints';

export const getMyNotifications = async (): Promise<NotificationItem[]> => {
  const response = await axiosInstance.get(NOTIFICATIONS.NOTIFICATIONS);
  return Array.isArray(response.data) ? response.data : (response.data?.data || []);
};


export const markNotificationAsRead = async (id: string): Promise<void> => {
  await axiosInstance.patch(`${NOTIFICATIONS.NOTIFICATIONS}/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await axiosInstance.patch(`${NOTIFICATIONS.NOTIFICATIONS}/read-all`);
};
