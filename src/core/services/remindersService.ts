import  axiosInstance from "../core/axios/axiosInstance";
import type { Reminder } from '../core/models/Reminder';
import { REMINDERS } from '../global/endpoints';



type ReminderInput = Omit<Reminder, 'id'>;

// Obtener recordatorios para una oportunidad específica
export const getRemindersByOpportunity = async (opportunityId: string): Promise<Reminder[]> => {
  const response = await axiosInstance.get(`${REMINDERS.REMINDERS}/Opportunity/${opportunityId}`);
  return response.data;
};

// Crear un nuevo recordatorio
export const createReminder = async (reminderData: ReminderInput): Promise<Reminder> => {
  const response = await axiosInstance.post(REMINDERS.REMINDERS, reminderData);
  return response.data;
};

// Actualizar un recordatorio
export const updateReminder = async (id: string, reminderData: Partial<ReminderInput>): Promise<Reminder> => {
  const response = await axiosInstance.patch(`${REMINDERS.REMINDERS}/${id}`, reminderData);
  return response.data;
};

// Eliminar un recordatorio
export const deleteReminder = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${REMINDERS.REMINDERS}/${id}`);
};