import axiosInstance from "../core/axios/axiosInstance";
import { HELPDESKS, TICKETS } from "../global/endpoints";
import type { Helpdesk, TicketStage, Ticket } from "../core/models/Ticket";

/**
 * Obtiene la mesa de ayuda principal con sus etapas.
 */
export const getMainHelpdesk = async (): Promise<Helpdesk> => {
  const response = await axiosInstance.get<Helpdesk>(`${HELPDESKS.HELPDESKS}/main`);
  return response.data;
};

/**
 * Actualiza la mesa de ayuda principal y su lista de etapas.
 */
export const updateMainHelpdesk = async (data: Partial<Helpdesk>): Promise<Helpdesk> => {
  const response = await axiosInstance.patch<Helpdesk>(`${HELPDESKS.HELPDESKS}/main`, data);
  return response.data;
};

/**
 * Obtiene las etapas activas de la mesa de ayuda principal.
 */
export const getActiveTicketStages = async (): Promise<TicketStage[]> => {
  const response = await axiosInstance.get<TicketStage[]>(`${HELPDESKS.HELPDESKS}/main/stages/active`);
  return response.data;
};

/**
 * Obtiene la lista de todos los tickets (con filtro opcional de etapa).
 */
export const getTickets = async (stage_id?: string): Promise<Ticket[]> => {
  const query = stage_id ? `?stage_id=${encodeURIComponent(stage_id)}` : '';
  const response = await axiosInstance.get<Ticket[]>(`${TICKETS.TICKETS}${query}`);
  return response.data;
};

/**
 * Obtiene un ticket por su ID.
 */
export const getTicket = async (id: string): Promise<Ticket> => {
  const response = await axiosInstance.get<Ticket>(`${TICKETS.TICKETS}/${id}`);
  return response.data;
};

/**
 * Registra un nuevo ticket (puede ser público o interno).
 */
export const createTicket = async (ticketData: Partial<Ticket> & { companyName?: string }): Promise<Ticket> => {
  const response = await axiosInstance.post<Ticket>(TICKETS.TICKETS, ticketData);
  return response.data;
};

/**
 * Actualiza un ticket existente (estado, asignación, notas, etc.).
 */
export const updateTicket = async (id: string, ticketData: Partial<Ticket>): Promise<Ticket> => {
  const response = await axiosInstance.patch<Ticket>(`${TICKETS.TICKETS}/${id}`, ticketData);
  return response.data;
};

/**
 * Elimina un ticket de la base de datos.
 */
export const deleteTicket = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${TICKETS.TICKETS}/${id}`);
};
