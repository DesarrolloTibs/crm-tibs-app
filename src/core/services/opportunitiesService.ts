import axiosInstance from "../core/axios/axiosInstance";
import type { Opportunity } from "../core/models/Opportunity";
import { OPPORTUNITIES } from "../global/endpoints";
import { configStore } from "../store/useConfigStore";

const buildQueryString = (params: Record<string, string | undefined>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`)
    .join('&');
  return query ? `?${query}` : '';
};

let oppsCache: Record<string, { data: Opportunity[]; timestamp: number; schema: string }> = {};
let pendingOppsPromises: Record<string, Promise<Opportunity[]>> = {};

export const clearOpportunitiesCache = () => {
  oppsCache = {};
};

/**
 * Obtiene todas las oportunidades.
 */
export const getOpportunities = async (startDate?: string, endDate?: string, showArchived?: boolean, forceRefresh = false): Promise<Opportunity[]> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const query = buildQueryString({ startDate, endDate, showArchived: showArchived !== undefined ? String(showArchived) : undefined });
  const cacheKey = `${currentSchema}:${query}`;
  const now = Date.now();

  if (!forceRefresh && oppsCache[cacheKey] && now - oppsCache[cacheKey].timestamp < 3000) {
    return oppsCache[cacheKey].data;
  }

  if (cacheKey in pendingOppsPromises) {
    return pendingOppsPromises[cacheKey];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get<Opportunity[]>(`${OPPORTUNITIES.OPPORTUNITIES}${query}`);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Opportunity[];
      oppsCache[cacheKey] = { data, timestamp: Date.now(), schema: currentSchema };
      return data;
    } finally {
      delete pendingOppsPromises[cacheKey];
    }
  })();

  pendingOppsPromises[cacheKey] = promise;
  return promise;
};

/**
 * Crea una nueva oportunidad.
 * @param opportunityData - Los datos de la oportunidad a crear.
 * @returns Una promesa que se resuelve en la oportunidad creada.
 */
export const createOpportunity = async (opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
  const {
    id: _,
    cliente: _1,
    company: _2,
    contacts: _3,
    ejecutivo: _4,
    interactions: _5,
    reminders: _6,
    createdAt: _7,
    files: _8,
    proposalDocumentPath: _9,
    ...cleanOpportunity
  } = opportunityData as any;
  const response = await axiosInstance.post<Opportunity>(OPPORTUNITIES.OPPORTUNITIES, cleanOpportunity);
  return response.data;
};

/**
 * Actualiza una oportunidad existente.
 * @param id - El ID de la oportunidad a actualizar.
 * @param opportunityData - Los datos para actualizar la oportunidad.
 * @returns Una promesa que se resuelve en la oportunidad actualizada.
 */
export const updateOpportunity = async (id: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
  const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const payload: any = {};
  const data = opportunityData as any;

  if (data.nombre_proyecto) payload.nombre_proyecto = data.nombre_proyecto;
  if (data.description !== undefined) payload.description = data.description;
  if (data.empresa !== undefined) payload.empresa = data.empresa;
  if (data.moneda) payload.moneda = data.moneda;
  if (data.priority !== undefined && data.priority !== null && !isNaN(Number(data.priority))) {
    payload.priority = Number(data.priority);
  }

  if (isUuid(data.cliente_id)) payload.cliente_id = data.cliente_id;
  if (isUuid(data.companyId)) payload.companyId = data.companyId;
  if (isUuid(data.ejecutivo_id)) payload.ejecutivo_id = data.ejecutivo_id;
  if (isUuid(data.stage_id)) payload.stage_id = data.stage_id;
  if (isUuid(data.pipeline_id)) payload.pipeline_id = data.pipeline_id;
  if (isUuid(data.linea_negocio_id)) payload.linea_negocio_id = data.linea_negocio_id;
  if (isUuid(data.tipo_entrega_id)) payload.tipo_entrega_id = data.tipo_entrega_id;
  if (isUuid(data.licenciamiento_id)) payload.licenciamiento_id = data.licenciamiento_id;

  if (data.monto_licenciamiento !== undefined && data.monto_licenciamiento !== null && !isNaN(Number(data.monto_licenciamiento))) {
    payload.monto_licenciamiento = Number(data.monto_licenciamiento);
  }
  if (data.monto_servicios !== undefined && data.monto_servicios !== null && !isNaN(Number(data.monto_servicios))) {
    payload.monto_servicios = Number(data.monto_servicios);
  }
  if (data.monto_total !== undefined && data.monto_total !== null && !isNaN(Number(data.monto_total))) {
    payload.monto_total = Number(data.monto_total);
  }
  if (data.tipoCambio !== undefined && data.tipoCambio !== null && !isNaN(Number(data.tipoCambio))) {
    payload.tipoCambio = Number(data.tipoCambio);
  }

  if (data.estimated_closure_date && typeof data.estimated_closure_date === 'string') {
    payload.estimated_closure_date = data.estimated_closure_date;
  }
  if (Array.isArray(data.contactIds)) payload.contactIds = data.contactIds.filter(isUuid);
  if (Array.isArray(data.productIds)) payload.productIds = data.productIds.filter(isUuid);
  if (Array.isArray(data.productItems)) payload.productItems = data.productItems;

  const response = await axiosInstance.patch<Opportunity>(`${OPPORTUNITIES.OPPORTUNITIES}/${id}`, payload);
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
 * Obtiene una oportunidad por su ID.
 * @param id - El ID de la oportunidad.
 * @returns Una promesa que se resuelve en la oportunidad.
 */
export const getOpportunity = async (id: string): Promise<Opportunity> => {
  const response = await axiosInstance.get<Opportunity>(`${OPPORTUNITIES.OPPORTUNITIES}/${id}`);
  return response.data;
};

/**
 * Sube un archivo para una oportunidad.
 * @param id - El ID de la oportunidad.
 * @param file - El archivo a subir.
 * @param title - El título o etiqueta del archivo.
 * @param date - La fecha asociada al archivo.
 * @returns Una promesa que se resuelve en la oportunidad actualizada.
 */
export const uploadOpportunityFile = async (
  id: string,
  file: File,
  title?: string,
  date?: string
): Promise<Opportunity> => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (date) formData.append('date', date);

  const response = await axiosInstance.post<Opportunity>(
    `${OPPORTUNITIES.OPPORTUNITIES}/${id}/files`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * Descarga un archivo específico de una oportunidad.
 * @param opportunityId - El ID de la oportunidad.
 * @param fileId - El ID del archivo.
 * @returns Una promesa que se resuelve en un objeto Blob con los datos del archivo.
 */
export const downloadOpportunityFile = async (opportunityId: string, fileId: string): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${OPPORTUNITIES.OPPORTUNITIES}/${opportunityId}/files/${fileId}/download`,
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

/**
 * Elimina un archivo específico de una oportunidad.
 * @param opportunityId - El ID de la oportunidad.
 * @param fileId - El ID del archivo.
 * @returns Una promesa que se resuelve en la oportunidad actualizada.
 */
export const deleteOpportunityFile = async (opportunityId: string, fileId: string): Promise<Opportunity> => {
  const response = await axiosInstance.delete<Opportunity>(
    `${OPPORTUNITIES.OPPORTUNITIES}/${opportunityId}/files/${fileId}`
  );
  return response.data;
};
