import axiosInstance from "../core/axios/axiosInstance";
import { REPORTS } from "../global/endpoints";
import { configStore } from "../store/useConfigStore";
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

let dashboardDataCache: { data: DashboardData; timestamp: number; schema: string } | null = null;
let pendingDashboardPromise: Promise<DashboardData> | null = null;

export const clearDashboardCache = () => {
  dashboardDataCache = null;
};

/**
 * Obtiene todos los datos requeridos para compilar el Dashboard de Reportes.
 */
export const getDashboardData = async (forceRefresh = false): Promise<DashboardData> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && dashboardDataCache && dashboardDataCache.schema === currentSchema && now - dashboardDataCache.timestamp < 3000) {
    return dashboardDataCache.data;
  }

  if (pendingDashboardPromise) {
    return pendingDashboardPromise;
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get(REPORTS.DASHBOARD);
      const raw = response.data?.data ?? response.data;
      const data = raw as DashboardData;
      dashboardDataCache = { data, timestamp: Date.now(), schema: currentSchema };
      return data;
    } finally {
      pendingDashboardPromise = null;
    }
  })();

  pendingDashboardPromise = promise;
  return promise;
};

/**
 * Obtiene la lista completa de todos los indicadores de dashboard configurados.
 */
export const getIndicators = async (): Promise<DashboardIndicator[]> => {
  const response = await axiosInstance.get<DashboardIndicator[]>(REPORTS.INDICATORS);
  return Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
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
