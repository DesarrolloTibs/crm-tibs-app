import axiosInstance from "@core/axios/axiosInstance";
import type { Reminder } from '@core/models/Reminder';
import { REMINDERS } from '@/global/endpoints';

export type ReminderInput = {
  title: string;
  date: string;
  activityId?: string | null;
};

const sanitizeReminderPayload = (data: Partial<ReminderInput>): Record<string, any> => {
  const payload: Record<string, any> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.date !== undefined) payload.date = data.date;
  if (data.activityId !== undefined) payload.activityId = data.activityId || null;
  return payload;
};

// Obtener recordatorio de una actividad específica
export const getRemindersByActivity = async (activityId: string): Promise<Reminder | null> => {
  const response = await axiosInstance.get(`${REMINDERS.REMINDERS}/activity/${activityId}`);
  return response.data;
};

// Crear un nuevo recordatorio
export const createReminder = async (reminderData: ReminderInput): Promise<Reminder> => {
  const response = await axiosInstance.post(
    REMINDERS.REMINDERS,
    sanitizeReminderPayload(reminderData)
  );
  return response.data;
};

// Actualizar un recordatorio
export const updateReminder = async (id: string, reminderData: Partial<ReminderInput>): Promise<Reminder> => {
  const response = await axiosInstance.patch(
    `${REMINDERS.REMINDERS}/${id}`,
    sanitizeReminderPayload(reminderData)
  );
  return response.data;
};

// Eliminar un recordatorio
export const deleteReminder = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${REMINDERS.REMINDERS}/${id}`);
};