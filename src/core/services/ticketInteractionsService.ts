import axiosInstance from "../core/axios/axiosInstance";
import { TICKET_INTERACTIONS } from "../global/endpoints";

export interface TicketInteraction {
  id?: string;
  comment: string;
  ticket_id: string;
  createdAt?: string; // ISO string
}

export const getTicketInteractions = async (ticketId: string): Promise<TicketInteraction[]> => {
  const response = await axiosInstance.get(`${TICKET_INTERACTIONS.TICKET_INTERACTIONS}/ticket/${ticketId}`);
  return response.data;
};

export const createTicketInteraction = async (interaction: Partial<TicketInteraction>): Promise<TicketInteraction> => {
  const response = await axiosInstance.post(TICKET_INTERACTIONS.TICKET_INTERACTIONS, interaction);
  return response.data;
};

export const deleteTicketInteraction = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${TICKET_INTERACTIONS.TICKET_INTERACTIONS}/${id}`);
};
