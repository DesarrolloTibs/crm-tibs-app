import { useState, useEffect } from 'react';

export interface SelectedTenant {
  id: number;
  name: string;
  schema_name: string;
  logo?: string | null;
  allow_extra?: boolean;
}

export interface TenantPlanInfo {
  id: number;
  name: string;
  schema_name: string;
  plan_id: number | null;
  next_renewal_date: string | null;
  is_active: boolean;
  allow_extra: boolean;
  logo: string | null;
  created_at: string;
  plan?: {
    plan_id: number;
    plan_name: string;
    price: number;
    tokens_limit: number;
    billing_period_months: number;
  };
}

const getStoredTenant = (): SelectedTenant | null => {
  try {
    const raw = localStorage.getItem('selected_tenant');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let globalSelectedTenant: SelectedTenant | null = getStoredTenant();
let globalTenants: TenantPlanInfo[] = [];
const listeners: Array<() => void> = [];

export const configStore = {
  getSelectedTenant: (): SelectedTenant | null => globalSelectedTenant,
  setSelectedTenant: (tenant: SelectedTenant | null) => {
    globalSelectedTenant = tenant;
    if (tenant) {
      localStorage.setItem('selected_tenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('selected_tenant');
    }
    listeners.forEach(l => l());
  },
  getTenants: (): TenantPlanInfo[] => globalTenants,
  setTenants: (tenants: TenantPlanInfo[]) => {
    globalTenants = Array.isArray(tenants) ? tenants : [];
    listeners.forEach(l => l());
  },


  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }
};

export const useConfigStore = () => {
  const [selectedTenant, setSelectedTenantState] = useState<SelectedTenant | null>(globalSelectedTenant);
  const [tenants, setTenantsState] = useState<TenantPlanInfo[]>(globalTenants);

  useEffect(() => {
    const unsubscribe = configStore.subscribe(() => {
      setSelectedTenantState(configStore.getSelectedTenant());
      setTenantsState(configStore.getTenants());
    });
    return unsubscribe;
  }, []);

  return {
    selectedTenant,
    setSelectedTenant: configStore.setSelectedTenant,
    tenants,
    setTenants: configStore.setTenants,
  };
};
