import  axiosInstance from "../core/axios/axiosInstance";
import type { Opportunity } from "../core/models/Opportunity";
import { OPPORTUNITIES } from "../global/endpoints";

/**
 * Obtiene todas las oportunidades.
 * @returns Una promesa que se resuelve en un array de oportunidades.
 */
export const getOpportunities = async (): Promise<Opportunity[]> => {
  const response = await axiosInstance.get<Opportunity[]>(OPPORTUNITIES.OPPORTUNITIES);
  return response.data;
};

/**
 * Crea una nueva oportunidad.
 * @param opportunityData - Los datos de la oportunidad a crear.
 * @returns Una promesa que se resuelve en la oportunidad creada.
 */
export const createOpportunity = async (opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
  const response = await axiosInstance.post<Opportunity>(OPPORTUNITIES.OPPORTUNITIES, opportunityData);
  return response.data;
};

/**
 * Actualiza una oportunidad existente.
 * @param id - El ID de la oportunidad a actualizar.
 * @param opportunityData - Los datos para actualizar la oportunidad.
 * @returns Una promesa que se resuelve en la oportunidad actualizada.
 */
export const updateOpportunity = async (id: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
  const response = await axiosInstance.patch<Opportunity>(`${OPPORTUNITIES.OPPORTUNITIES}/${id}`, opportunityData);
  return response.data;
};

/**
 * Elimina una oportunidad.
 * @param id - El ID de la oportunidad a eliminar.
 */
export const deleteOpportunity = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${OPPORTUNITIES.OPPORTUNITIES}/${id}`);
};

/**
 * Archiva o desarchiva una oportunidad.
 * @param id - El ID de la oportunidad.
 * @param archived - `true` para archivar, `false` para desarchivar.
 */
export const archiveOpportunity = async (id: string, archived: boolean): Promise<void> => {
  await axiosInstance.patch(`${OPPORTUNITIES.OPPORTUNITIES}/${id}/archive`, { archived });
};

/**
 * Obtiene el historial completo de oportunidades.
 * @returns Una promesa que se resuelve en un array de todas las oportunidades.
 */
export const getAllOpportunities = async (): Promise<Opportunity[]> => {
  const response = await axiosInstance.get<Opportunity[]>(`${OPPORTUNITIES.OPPORTUNITIES}/all`);
  return response.data;
};

/**
 * Sube un documento de propuesta para una oportunidad.
 * @param id - El ID de la oportunidad.
 * @param file - El archivo a subir.
 * @returns Una promesa que se resuelve en la oportunidad actualizada.
 */
export const uploadProposalDocument = async (id: string, file: File): Promise<Opportunity> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<Opportunity>(
    `${OPPORTUNITIES.OPPORTUNITIES}/${id}/proposal`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * Descarga el documento de propuesta de una oportunidad.
 * @param id - El ID de la oportunidad.
 * @returns Una promesa que se resuelve en un objeto Blob con los datos del archivo.
 */
export const downloadProposalDocument = async (id: string): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${OPPORTUNITIES.OPPORTUNITIES}/${id}/proposal/download`,
    {
      responseType: 'blob', // Esencial para manejar la respuesta como un archivo
    }
  );
  return response.data;
};
