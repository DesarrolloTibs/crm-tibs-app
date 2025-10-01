import  axiosInstance from "../core/axios/axiosInstance";
import type { Opportunity } from "../core/models/Opportunity";
import { Opportunities } from "../global/endpoints";



export const getOpportunities = async (): Promise<Opportunity[]> => {
  const response = await axiosInstance.get(Opportunities.OPPORTUNITIES, );
  return response.data;
};

export const createOpportunity = async (opportunity: Partial<Opportunity>): Promise<Opportunity> => {
  const response = await axiosInstance.post(Opportunities.OPPORTUNITIES, opportunity );
  return response.data;
};

export const updateOpportunity = async (id: string, opportunity: Partial<Opportunity>): Promise<Opportunity> => {
  const response = await axiosInstance.patch(`${Opportunities.OPPORTUNITIES}/${id}`, opportunity);
  return response.data;
};

export const deleteOpportunity = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${Opportunities.OPPORTUNITIES}/${id}`,);
};
