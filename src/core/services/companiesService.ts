import axiosInstance from '../core/axios/axiosInstance';
import { COMPANIES } from '../global/endpoints';
import type { Company } from '../core/models/Company';
import { configStore } from '../store/useConfigStore';

let companiesCache: Record<string, { data: Company[]; timestamp: number }> = {};
let pendingCompaniesPromises: Record<string, Promise<Company[]>> = {};

export const clearCompaniesCache = () => {
  companiesCache = {};
};

export async function getCompanies(forceRefresh = false): Promise<Company[]> {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && companiesCache[currentSchema] && now - companiesCache[currentSchema].timestamp < 3000) {
    return companiesCache[currentSchema].data;
  }

  if (currentSchema in pendingCompaniesPromises) {
    return pendingCompaniesPromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get(COMPANIES.COMPANIES);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Company[];
      companiesCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingCompaniesPromises[currentSchema];
    }
  })();

  pendingCompaniesPromises[currentSchema] = promise;
  return promise;
}

export async function createCompany(company: Company): Promise<Company> {
    const response = await axiosInstance.post(COMPANIES.COMPANIES, company);
    return response.data;
}

export async function updateCompany(id: string, company: Company): Promise<Company> {
    const response = await axiosInstance.patch(`${COMPANIES.COMPANIES}/${id}`, company);
    return response.data;
}

export const getActiveCompanies = async (): Promise<Company[]> => {
  const response = await axiosInstance.get(`${COMPANIES.COMPANIES}/active`);
  return response.data;
};

export const updateCompanyStatus = async (id: string, estatus: boolean): Promise<void> => {
  await axiosInstance.patch(`${COMPANIES.COMPANIES}/${id}/status`, { estatus });
};
