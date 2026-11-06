import axiosInstance from '@core/axios/axiosInstance';
import { COMPANIES } from '@/global/endpoints';
import type { Company } from '@core/models/Company';
import { configStore } from '@/store/useConfigStore';

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

/**
 * Sanitiza los campos de una empresa antes de enviarla a la API (POST o PATCH).
 * Los campos vacíos ("") se convierten en null.
 */
export function sanitizeCompanyPayload(company: Partial<Company>): Partial<Company> {
  const sanitized: Partial<Company> = { ...company };

  if (sanitized.nombre !== undefined) {
    sanitized.nombre = sanitized.nombre.trim();
  }
  if (sanitized.correo !== undefined) {
    sanitized.correo = typeof sanitized.correo === 'string' ? sanitized.correo.trim() || null : null;
  }
  if (sanitized.telefono !== undefined) {
    sanitized.telefono = typeof sanitized.telefono === 'string' ? sanitized.telefono.trim() || null : null;
  }
  if (sanitized.website !== undefined) {
    sanitized.website = typeof sanitized.website === 'string' ? sanitized.website.trim() || null : null;
  }
  if (sanitized.direccion !== undefined) {
    sanitized.direccion = typeof sanitized.direccion === 'string' ? sanitized.direccion.trim() || null : null;
  }
  if (sanitized.ejecutivo_id !== undefined) {
    sanitized.ejecutivo_id = sanitized.ejecutivo_id || null;
  }

  return sanitized;
}

export async function createCompany(company: Company | Partial<Company>): Promise<Company> {
    const payload = sanitizeCompanyPayload(company);
    const response = await axiosInstance.post(COMPANIES.COMPANIES, payload);
    return response.data;
}

export async function updateCompany(id: string, company: Company | Partial<Company>): Promise<Company> {
    const payload = sanitizeCompanyPayload(company);
    const response = await axiosInstance.patch(`${COMPANIES.COMPANIES}/${id}`, payload);
    return response.data;
}

export const getActiveCompanies = async (): Promise<Company[]> => {
  const response = await axiosInstance.get(`${COMPANIES.COMPANIES}/active`);
  return response.data;
};

export const updateCompanyStatus = async (id: string, estatus: boolean): Promise<void> => {
  await axiosInstance.patch(`${COMPANIES.COMPANIES}/${id}/status`, { estatus });
};
