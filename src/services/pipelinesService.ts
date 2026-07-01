import axiosInstance from "../core/axios/axiosInstance";
import { PIPELINES } from "../global/endpoints";
import type { Stage } from "../core/models/Opportunity";

export interface Pipeline {
  id: string;
  strname: string;
  strdescription: string | null;
  blnstatus: boolean;
  stages: Stage[];
}

export const getMainPipeline = async (): Promise<Pipeline> => {
  const response = await axiosInstance.get<Pipeline>(`${PIPELINES.PIPELINES}/main`);
  return response.data;
};

export const getActiveStages = async (): Promise<Stage[]> => {
  const response = await axiosInstance.get<Stage[]>(`${PIPELINES.PIPELINES}/main/stages/active`);
  return response.data;
};

export const updateMainPipeline = async (data: Partial<Pipeline>): Promise<Pipeline> => {
  const response = await axiosInstance.patch<Pipeline>(`${PIPELINES.PIPELINES}/main`, data);
  return response.data;
};

export const getPipelines = async (): Promise<Pipeline[]> => {
  const response = await axiosInstance.get<Pipeline[]>(`${PIPELINES.PIPELINES}`);
  return response.data;
};
