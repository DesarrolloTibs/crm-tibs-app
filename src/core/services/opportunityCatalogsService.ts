import axiosInstance from "../core/axios/axiosInstance";
import type { OpportunityCatalogOption } from "../core/models/OpportunityCatalog";
import { OPPORTUNITY_CATALOGS } from "../global/endpoints";

type CatalogType = 'business-lines' | 'delivery-types' | 'licensings';

const getCatalogUrl = (type: CatalogType): string => {
  switch (type) {
    case 'business-lines':
      return OPPORTUNITY_CATALOGS.BUSINESS_LINES;
    case 'delivery-types':
      return OPPORTUNITY_CATALOGS.DELIVERY_TYPES;
    case 'licensings':
      return OPPORTUNITY_CATALOGS.LICENSINGS;
    default:
      throw new Error(`Catalog type "${type}" not supported`);
  }
};

export const getCatalogOptions = async (type: CatalogType): Promise<OpportunityCatalogOption[]> => {
  const response = await axiosInstance.get<OpportunityCatalogOption[]>(getCatalogUrl(type));
  return response.data;
};

export const getActiveCatalogOptions = async (type: CatalogType): Promise<OpportunityCatalogOption[]> => {
  const response = await axiosInstance.get<OpportunityCatalogOption[]>(`${getCatalogUrl(type)}/active`);
  return response.data;
};

export const createCatalogOption = async (type: CatalogType, strname: string): Promise<OpportunityCatalogOption> => {
  const response = await axiosInstance.post<OpportunityCatalogOption>(getCatalogUrl(type), { strname });
  return response.data;
};

export const updateCatalogOption = async (
  type: CatalogType,
  id: string,
  strname?: string,
  blnstatus?: boolean
): Promise<OpportunityCatalogOption> => {
  const response = await axiosInstance.patch<OpportunityCatalogOption>(`${getCatalogUrl(type)}/${id}`, {
    strname,
    blnstatus,
  });
  return response.data;
};

export const deleteCatalogOption = async (type: CatalogType, id: string): Promise<{ success: boolean }> => {
  const response = await axiosInstance.delete<{ success: boolean }>(`${getCatalogUrl(type)}/${id}`);
  return response.data;
};
