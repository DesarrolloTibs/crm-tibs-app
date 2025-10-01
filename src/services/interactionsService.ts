import  axiosInstance from "../core/axios/axiosInstance";
import type { Interaction } from '../core/models/Interaction';
import { INTERACTIONS } from '../global/endpoints';



export const getInteractionsByOpportunity = async (opportunityId: string): Promise<Interaction[]> => {
  const response = await axiosInstance.get(`${INTERACTIONS.INTERACTIONS}/opportunity/${opportunityId}`);
  return response.data;
};

export const createInteraction = async (interaction: Partial<Interaction>): Promise<Interaction> => {
  const response = await axiosInstance.post(INTERACTIONS.INTERACTIONS, interaction);
  return response.data;
};

export const deleteInteraction = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${INTERACTIONS.INTERACTIONS}/${id}`);
};