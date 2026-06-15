import axiosInstance from '../core/axios/axiosInstance';
import { COMPANIES } from '../global/endpoints';
import type { Company } from '../core/models/Company';

export async function getCompanies(): Promise<Company[]> {
    const response = await axiosInstance.get(COMPANIES.COMPANIES);
    return response.data;
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
