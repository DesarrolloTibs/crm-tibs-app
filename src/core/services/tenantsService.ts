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
  tokens_extra_limit?: number;
  total_tokens_limit?: number;
  total_tokens_consumed?: number;
  tokens_overage_absorbed?: number;
  has_courtesy_overage?: boolean;
  extra_percentage_used?: number;
}

export interface CourtesyOverageTenantReport {
  tenant_id: number;
  tenant_name: string;
  schema_name: string;
  plan_name: string;
  allow_extra: boolean;
  tokens_limit: number;
  tokens_used: number;
  tokens_extra_used: number;
  tokens_overage_absorbed: number;
  has_courtesy_overage: boolean;
  total_tokens_consumed: number;
  next_renewal_date: string | null;
}

export interface CourtesyOveragesReportResponse {
  total_tenants: number;
  tenants_with_courtesy_overage: number;
  total_tokens_absorbed: number;
  report: CourtesyOverageTenantReport[];
}

export interface ChannelConsumption {
  channel: 'whatsapp' | 'webchat_interno' | 'messenger' | 'instagram' | 'rag' | 'otro';
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  request_count: number;
}

export interface TopUserConsumption {
  user_id: number;
  user_name: string;
  total_tokens: number;
  request_count: number;
}

export interface TopClientConsumption {
  client_id: number;
  client_name: string;
  channel: string;
  total_tokens: number;
  request_count: number;
}

export interface ModelConsumption {
  model_name: string;
  total_tokens: number;
  request_count: number;
}

export interface DailyTimelineConsumption {
  date: string;
  total_tokens: number;
  request_count: number;
}

export interface RecentTransaction {
  id: number;
  fecha_procesamiento: string;
  accion: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  is_extra: boolean;
  user_id: number | null;
  user_name: string | null;
  client_id: number | null;
  client_name: string | null;
  conversation_id: string | null;
  channel: string;
  model_name: string | null;
  metadata: Record<string, any> | null;
}

export interface ConsumptionBreakdownResponse {
  schema_name: string;
  cycle_id?: number | null;
  cycle_info?: {
    id: number;
    plan_name: string;
    status: 'active' | 'closed' | 'superseded';
    tokens_limit: number;
    price: number;
    start_date: string;
    end_date: string;
    closed_at: string | null;
    close_reason: string | null;
    allow_extra: boolean;
  } | null;
  period: {
    start: string | null;
    end: string | null;
  };
  summary: TenantConsumptionData;
  by_channel: ChannelConsumption[];
  top_users: TopUserConsumption[];
  top_clients: TopClientConsumption[];
  by_model: ModelConsumption[];
  daily_timeline: DailyTimelineConsumption[];
  recent_transactions: RecentTransaction[];
}

export interface TenantBillingCycle {
  id: number;
  tenant_id: string | number;
  plan_id: number;
  plan_name: string;
  tokens_limit: number;
  price: number;
  billing_period_months: number;
  start_date: string;
  end_date: string;
  closed_at: string | null;
  status: 'active' | 'closed' | 'superseded';
  close_reason: string | null;
  allow_extra: boolean;
  tokens_used: number;
  tokens_extra_used: number;
  tokens_courtesy_used: number;
  total_tokens_consumed: number;
  created_at: string;
}

export interface RenewalQueueItem {
  queue_id: number;
  tenant_id: string;
  queue_position: number;
  plan_id: number;
  plan_name: string;
  tokens_limit: number;
  price: number;
  billing_period_months: number;
  projected_start_date: string;
  projected_end_date: string;
  created_at: string;
}

export interface RenewalQueueResponse {
  tenant_id: number;
  tenant_name: string;
  current_plan: any;
  current_next_renewal_date: string | null;
  is_active: boolean;
  total_queued_periods: number;
  total_queued_months: number;
  coverage_until: string | null;
  items: RenewalQueueItem[];
}

export interface UpdateTenantPlanPayload {
  planId: number;
  changeType?: 'immediate' | 'next_period';
  immediatePolicy?: 'reset_date' | 'keep_current_date';
  months?: number;
  updateQueuedPlans?: boolean;
  allowExtra?: boolean;
}

export interface UpdateTenantPlanResponse {
  message?: string;
  change_type?: 'immediate' | 'next_period';
  scheduled_plan?: any;
  tenant: TenantPlanInfo;
}

export interface EnqueueRenewalPayload {
  planId?: number;
  months?: number;
  periodsCount?: number;
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
      const raw = (response.data as any)?.data ?? response.data;
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
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const getMyTenantInfo = async (schemaName?: string): Promise<TenantPlanInfo | null> => {
  const response = await axiosInstance.get(`${TENANTS.TENANTS}/my-tenant`, {
    params: schemaName ? { schemaName } : {},
  });
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const uploadTenantLogo = async (tenantId: number, file: File): Promise<TenantPlanInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`${TENANTS.TENANTS}/${tenantId}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

let consumptionCache: Record<string, { data: TenantConsumptionData; timestamp: number }> = {};
let pendingConsumptionPromises: Record<string, Promise<TenantConsumptionData>> = {};

export const clearTenantConsumptionCache = (schemaName?: string) => {
  const key = schemaName || 'default';
  delete consumptionCache[key];
};

export interface GetConsumptionOptions {
  schemaName?: string;
  tenantId?: number;
  throwOnError?: boolean;
}

export const getTenantConsumption = async (
  options?: string | GetConsumptionOptions,
  forceRefresh = false
): Promise<TenantConsumptionData> => {
  const schemaName = typeof options === 'string' ? options : options?.schemaName;
  const tenantId = typeof options === 'object' ? options?.tenantId : undefined;
  const throwOnError = typeof options === 'object' ? options?.throwOnError : false;

  const key = tenantId ? `id_${tenantId}` : (schemaName || 'default');
  const now = Date.now();

  if (!forceRefresh && consumptionCache[key] && now - consumptionCache[key].timestamp < 5000) {
    return consumptionCache[key].data;
  }

  if (key in pendingConsumptionPromises) {
    return pendingConsumptionPromises[key];
  }

  const promise = (async () => {
    try {
      const params: Record<string, any> = {};
      if (schemaName) params.schemaName = schemaName;
      if (tenantId) params.tenantId = tenantId;

      const response = await axiosInstance.get(`${TENANTS.TENANTS}/consumption`, { params });
      const raw = (response.data as any)?.data ?? response.data;
      const data = raw as TenantConsumptionData;
      consumptionCache[key] = { data, timestamp: Date.now() };
      return data;
    } catch (error: any) {
      if (consumptionCache[key]) {
        return consumptionCache[key].data;
      }
      if (throwOnError) {
        throw error;
      }
      return {
        tenant_id: tenantId ?? null,
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
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const getTenantRenewalQueue = async (tenantId: number): Promise<RenewalQueueResponse> => {
  const response = await axiosInstance.get(`${TENANTS.TENANTS}/${tenantId}/renewal-queue`);
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const updateTenantPlan = async (
  tenantId: number,
  payloadOrPlanId: UpdateTenantPlanPayload | number,
  months: number = 1,
  allowExtra?: boolean
): Promise<UpdateTenantPlanResponse> => {
  const payload: UpdateTenantPlanPayload = typeof payloadOrPlanId === 'number'
    ? { planId: payloadOrPlanId, months, allowExtra }
    : payloadOrPlanId;

  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}/plan`, payload);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  const tenantObj = raw?.tenant ?? raw;

  return {
    message: raw?.message,
    change_type: raw?.change_type,
    scheduled_plan: raw?.scheduled_plan,
    tenant: tenantObj,
  };
};

export const enqueueTenantRenewal = async (
  tenantId: number,
  payloadOrPlanId?: EnqueueRenewalPayload | number,
  months: number = 1
): Promise<any> => {
  const payload: EnqueueRenewalPayload = typeof payloadOrPlanId === 'number'
    ? { planId: payloadOrPlanId, months }
    : (payloadOrPlanId || {});

  const response = await axiosInstance.post(`${TENANTS.TENANTS}/${tenantId}/enqueue-renewal`, payload);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const updateQueueItem = async (
  queueItemId: number,
  payload: { planId?: number; billing_period_months?: number }
): Promise<any> => {
  const response = await axiosInstance.patch(`${TENANTS.TENANTS}/renewal-queue/${queueItemId}`, payload);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const removeQueueItem = async (queueItemId: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`${TENANTS.TENANTS}/renewal-queue/${queueItemId}`);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const clearRenewalQueue = async (tenantId: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`${TENANTS.TENANTS}/${tenantId}/renewal-queue`);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

let breakdownCache: Record<string, { data: ConsumptionBreakdownResponse; timestamp: number }> = {};
let pendingBreakdownPromises: Record<string, Promise<ConsumptionBreakdownResponse>> = {};

export const clearConsumptionBreakdownCache = (key?: string) => {
  if (key) delete breakdownCache[key];
  else breakdownCache = {};
};

export interface ConsumptionBreakdownParams {
  schemaName?: string;
  tenantId?: number;
  cycleId?: number;
  startDate?: string;
  endDate?: string;
}

export const getConsumptionBreakdown = async (
  params?: ConsumptionBreakdownParams,
  forceRefresh = false
): Promise<ConsumptionBreakdownResponse> => {
  const key = `${params?.tenantId ? `id_${params.tenantId}` : (params?.schemaName || 'default')}_c${params?.cycleId || 'act'}_s${params?.startDate || 'none'}_e${params?.endDate || 'none'}`;
  const now = Date.now();

  if (!forceRefresh && breakdownCache[key] && now - breakdownCache[key].timestamp < 5000) {
    return breakdownCache[key].data;
  }

  if (key in pendingBreakdownPromises) {
    return pendingBreakdownPromises[key];
  }

  const promise = (async () => {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.schemaName) queryParams.schemaName = params.schemaName;
      if (params?.tenantId) queryParams.tenantId = params.tenantId;
      if (params?.cycleId) queryParams.cycleId = params.cycleId;
      if (params?.startDate) queryParams.startDate = params.startDate;
      if (params?.endDate) queryParams.endDate = params.endDate;

      const response = await axiosInstance.get(TENANTS.CONSUMPTION_BREAKDOWN, { params: queryParams });
      const raw = (response.data as any)?.data ?? response.data;
      const data = raw as ConsumptionBreakdownResponse;
      breakdownCache[key] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingBreakdownPromises[key];
    }
  })();

  pendingBreakdownPromises[key] = promise;
  return promise;
};

export const getBillingCycles = async (
  params?: { tenantId?: number; schemaName?: string }
): Promise<TenantBillingCycle[]> => {
  const queryParams: Record<string, any> = {};
  if (params?.tenantId) queryParams.tenantId = params.tenantId;
  if (params?.schemaName) queryParams.schemaName = params.schemaName;

  const response = await axiosInstance.get(TENANTS.BILLING_CYCLES, { params: queryParams });
  const raw = (response.data as any)?.data ?? response.data;
  return Array.isArray(raw) ? raw : [];
};

export const updateAllowExtra = async (
  tenantId: number,
  allowExtra: boolean
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}/allow-extra`, { allowExtra });
  clearTenantsCache();
  consumptionCache = {};
  breakdownCache = {};
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const getCourtesyOveragesReport = async (): Promise<CourtesyOveragesReportResponse> => {
  const response = await axiosInstance.get(TENANTS.COURTESY_OVERAGES);
  const raw = (response.data as any)?.data ?? response.data;
  return raw as CourtesyOveragesReportResponse;
};

export const updateTenant = async (
  tenantId: number,
  payload: { name?: string; is_active?: boolean; allow_extra?: boolean; logo?: string | null }
): Promise<TenantPlanInfo> => {
  const response = await axiosInstance.put(`${TENANTS.TENANTS}/${tenantId}`, payload);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};

export const deleteTenant = async (tenantId: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`${TENANTS.TENANTS}/${tenantId}`);
  clearTenantsCache();
  const raw = (response.data as any)?.data ?? response.data;
  return raw;
};
