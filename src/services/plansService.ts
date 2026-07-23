import axiosInstance from '../core/axios/axiosInstance';
import { PLANS } from '../global/endpoints';

export interface Plan {
  plan_id: number;
  plan_name: string;
  price: number;
  tokens_limit: number;
  billing_period_months: number;
  blnstatus: boolean;
  dtmcreated?: string;
}

export interface CreatePlanPayload {
  plan_name: string;
  price: number;
  tokens_limit: number;
  billing_period_months?: number;
  blnstatus?: boolean;
}

export const getPlans = async (): Promise<Plan[]> => {
  const response = await axiosInstance.get(PLANS.PLANS);
  return response.data;
};

export const getPlanById = async (id: number): Promise<Plan> => {
  const response = await axiosInstance.get(`${PLANS.PLANS}/${id}`);
  return response.data;
};

export const createPlan = async (data: CreatePlanPayload): Promise<Plan> => {
  const response = await axiosInstance.post(PLANS.PLANS, data);
  return response.data;
};

export const updatePlan = async (id: number, data: Partial<CreatePlanPayload>): Promise<Plan> => {
  const response = await axiosInstance.put(`${PLANS.PLANS}/${id}`, data);
  return response.data;
};

export const deletePlan = async (id: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`${PLANS.PLANS}/${id}`);
  return response.data;
};

