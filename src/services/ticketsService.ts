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
 * Obtiene la lista de todos los tickets (con filtro opcional de etapa y archivado).
 */
export const getTickets = async (stage_id?: string, showArchived = false): Promise<Ticket[]> => {
  const params = new URLSearchParams();
  if (stage_id) params.append('stage_id', stage_id);
  params.append('showArchived', String(showArchived));
  const response = await axiosInstance.get<Ticket[]>(`${TICKETS.TICKETS}?${params.toString()}`);
  return response.data;
};

/**
 * Archiva o desarchiva un ticket.
 */
export const archiveTicket = async (id: string, archived: boolean): Promise<void> => {
  await axiosInstance.patch(`${TICKETS.TICKETS}/${id}/archive`, { archived });
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

/**
 * Consulta pública de tickets por correo o número de ticket.
 */
export const queryTicketsPublic = async (params: { email?: string; ticketNumber?: string }): Promise<Ticket[]> => {
  const queryParams = new URLSearchParams();
  if (params.email) queryParams.append('email', params.email);
  if (params.ticketNumber) queryParams.append('ticketNumber', params.ticketNumber);
  
  const response = await axiosInstance.get<Ticket[]>(`${TICKETS.TICKETS}/public/query?${queryParams.toString()}`);
  return response.data;
};

export const getHelpdesks = async (): Promise<Helpdesk[]> => {
  const response = await axiosInstance.get<Helpdesk[]>(`${HELPDESKS.HELPDESKS}`);
  return response.data;
};
