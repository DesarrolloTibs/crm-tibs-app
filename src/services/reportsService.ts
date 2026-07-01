import axiosInstance from "../core/axios/axiosInstance";
import { REPORTS } from "../global/endpoints";
import type { Opportunity, Stage } from "../core/models/Opportunity";
import type { Ticket, Helpdesk } from "../core/models/Ticket";
import type { Activity } from "../core/models/Activity";

export interface DashboardIndicator {
  id?: string;
  title: string;
  type: 'count' | 'sum';
  pipeline_id: string | null;
  helpdesk_id: string | null;
  stage_ids: string[];
  color: string;
  display_order?: number;
}

export interface DashboardData {
  indicators: DashboardIndicator[];
  pipelines: (any & { stages: Stage[] })[];
  helpdesks: (Helpdesk & { stages: any[] })[];
  opportunities: Opportunity[];
  tickets: Ticket[];
  activities: Activity[];
  executives: { id: string; username: string; correo: string; role: string }[];
}

/**
 * Obtiene todos los datos requeridos para compilar el Dashboard de Reportes.
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await axiosInstance.get<DashboardData>(REPORTS.DASHBOARD);
  return response.data;
};

/**
 * Obtiene la lista completa de todos los indicadores de dashboard configurados.
 */
export const getIndicators = async (): Promise<DashboardIndicator[]> => {
  const response = await axiosInstance.get<DashboardIndicator[]>(REPORTS.INDICATORS);
  return response.data;
};

/**
 * Crea un nuevo indicador de dashboard.
 */
export const createIndicator = async (data: Partial<DashboardIndicator>): Promise<DashboardIndicator> => {
  const response = await axiosInstance.post<DashboardIndicator>(REPORTS.INDICATORS, data);
  return response.data;
};

/**
 * Actualiza un indicador de dashboard existente.
 */
export const updateIndicator = async (id: string, data: Partial<DashboardIndicator>): Promise<DashboardIndicator> => {
  const response = await axiosInstance.patch<DashboardIndicator>(`${REPORTS.INDICATORS}/${id}`, data);
  return response.data;
};

/**
 * Elimina un indicador de dashboard.
 */
export const deleteIndicator = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${REPORTS.INDICATORS}/${id}`);
};
