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

let tenantsCache: { data: TenantPlanInfo[]; timestamp: number } | null = null;
let pendingTenantsPromise: Promise<TenantPlanInfo[]> | null = null;

export const clearTenantsCache = () => {
  tenantsCache = null;
};

export const getTenants = async (forceRefresh = false): Promise<TenantPlanInfo[]> => {
  const now = Date.now();

  if (!forceRefresh && tenantsCache && now - tenantsCache.timestamp < 5000) {
    return tenantsCache.data;
  }

  if (pendingTenantsPromise) {
    return pendingTenantsPromise;
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get(TENANTS.TENANTS);
      const raw = response.data;
      const data: TenantPlanInfo[] = Array.isArray(raw) ? raw : (raw?.data || []);
      tenantsCache = { data, timestamp: Date.now() };
      return data;
    } catch (error: any) {
      if (error?.response?.status === 429 && tenantsCache) {
        return tenantsCache.data;
      }
      throw error;
    } finally {
      pendingTenantsPromise = null;
    }
  })();

  pendingTenantsPromise = promise;
  return promise;
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

let consumptionCache: Record<string, { data: TenantConsumptionData; timestamp: number }> = {};
let pendingConsumptionPromises: Record<string, Promise<TenantConsumptionData>> = {};

export const clearTenantConsumptionCache = (schemaName?: string) => {
  const key = schemaName || 'default';
  delete consumptionCache[key];
};

export const getTenantConsumption = async (schemaName?: string, forceRefresh = false): Promise<TenantConsumptionData> => {
  const key = schemaName || 'default';
  const now = Date.now();

  if (!forceRefresh && consumptionCache[key] && now - consumptionCache[key].timestamp < 5000) {
    return consumptionCache[key].data;
  }

  if (key in pendingConsumptionPromises) {
    return pendingConsumptionPromises[key];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get(`${TENANTS.TENANTS}/consumption`, {
        params: schemaName ? { schemaName } : {},
      });
      const raw = (response.data as any)?.data ?? response.data;
      const data = raw as TenantConsumptionData;
      consumptionCache[key] = { data, timestamp: Date.now() };
      return data;
    } catch (error: any) {
      if (consumptionCache[key]) {
        return consumptionCache[key].data;
      }
      return {
        tenant_id: null,
        tenant_name: '',
        schema_name: schemaName || 'public',
        is_active: true,
        allow_extra: false,
        logo: null,
        documents_used: 0,
        documents_limit: 0,
        tokens_used: 0,
        tokens_extra_used: 0,
        tokens_limit: 300000,
        next_renewal_date: null,
        plan_name: '',
        price: 0,
      };
    } finally {
      delete pendingConsumptionPromises[key];
    }
  })();

  pendingConsumptionPromises[key] = promise;
  return promise;
};

export const provisionTenant = async (payload: ProvisionTenantPayload): Promise<ProvisionTenantResponse> => {
  const response = await axiosInstance.post(`${TENANTS.TENANTS}/provision`, payload);
  clearTenantsCache();
  return response.data;
};

export const updateTenantPlan = async (
  tenantId: number,
  planId: number,
  months: number = 1,
  allowExtra?: boolean
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}/plan`, { planId, months, allowExtra });
  clearTenantsCache();
  return response.data;
};

export const enqueueTenantRenewal = async (
  tenantId: number,
  planId: number,
  months: number = 1
): Promise<any> => {
  const response = await axiosInstance.post(`${TENANTS.TENANTS}/${tenantId}/enqueue-renewal`, { planId, months });
  clearTenantsCache();
  return response.data;
};

export const updateAllowExtra = async (
  tenantId: number,
  allowExtra: boolean
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}/allow-extra`, { allowExtra });
  clearTenantsCache();
  return response.data;
};

export const updateTenant = async (
  tenantId: number,
  payload: { name?: string; is_active?: boolean; allow_extra?: boolean; logo?: string | null }
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}`, payload);
  clearTenantsCache();
  return response.data;
};

export const deleteTenant = async (tenantId: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`${TENANTS.TENANTS}/${tenantId}`);
  clearTenantsCache();
  return response.data;
};


