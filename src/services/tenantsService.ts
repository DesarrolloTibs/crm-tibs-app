import axiosInstance from '../core/axios/axiosInstance';
import type { TenantPlanInfo } from '../store/useConfigStore';
import { TENANTS } from '../global/endpoints';

export interface ProvisionTenantPayload {
  tenantName: string;
  adminUsername: string;
  adminEmail: string;
  planId?: number;
  billingPeriodMonths?: number;
}

export interface ProvisionTenantResponse {
  tenantId: number;
  schemaName: string;
  adminUsername: string;
  adminEmail: string;
  tempPassword: string;
  nextRenewalDate: string;
}

export interface TenantConsumptionData {
  tenant_id: number | null;
  tenant_name: string;
  schema_name: string;
  is_active: boolean;
  allow_extra: boolean;
  logo: string | null;
  documents_used: number;
  documents_limit: number;
  tokens_used: number;
  tokens_extra_used: number;
  tokens_limit: number;
  next_renewal_date: string | null;
  plan_name: string;
  price: number;
}

export const getTenants = async (): Promise<TenantPlanInfo[]> => {
  const response = await axiosInstance.get(TENANTS.TENANTS);
  return response.data;
};

export const getTenantById = async (id: number): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.get(`${TENANTS.TENANTS}/${id}`);
  return response.data;
};

export const getMyTenantInfo = async (schemaName?: string): Promise<TenantPlanInfo | null> => {
  const response = await axiosInstance.get(`${TENANTS.TENANTS}/my-tenant`, {
    params: schemaName ? { schemaName } : {},
  });
  return response.data;
};

export const uploadTenantLogo = async (tenantId: number, file: File): Promise<TenantPlanInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`${TENANTS.TENANTS}/${tenantId}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getTenantConsumption = async (schemaName?: string): Promise<TenantConsumptionData> => {
  const response = await axiosInstance.get(`${TENANTS.TENANTS}/consumption`, {
    params: schemaName ? { schemaName } : {},
  });
  return response.data;
};

export const provisionTenant = async (payload: ProvisionTenantPayload): Promise<ProvisionTenantResponse> => {
  const response = await axiosInstance.post(`${TENANTS.TENANTS}/provision`, payload);
  return response.data;
};

export const updateTenantPlan = async (
  tenantId: number,
  planId: number,
  months: number = 1,
  allowExtra?: boolean
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}/plan`, { planId, months, allowExtra });
  return response.data;
};

export const enqueueTenantRenewal = async (
  tenantId: number,
  planId: number,
  months: number = 1
): Promise<any> => {
  const response = await axiosInstance.post(`${TENANTS.TENANTS}/${tenantId}/enqueue-renewal`, { planId, months });
  return response.data;
};

export const updateAllowExtra = async (
  tenantId: number,
  allowExtra: boolean
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}/allow-extra`, { allowExtra });
  return response.data;
};

export const updateTenant = async (
  tenantId: number,
  payload: { name?: string; is_active?: boolean; allow_extra?: boolean; logo?: string | null }
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}`, payload);
  return response.data;
};

export const deleteTenant = async (tenantId: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`${TENANTS.TENANTS}/${tenantId}`);
  return response.data;
};


