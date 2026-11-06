import axiosInstance from '@core/axios/axiosInstance';
import { CLIENTS } from '@/global/endpoints';
import type { Client } from '@core/models/Client';
import { configStore } from '@/store/useConfigStore';

let clientsCache: Record<string, { data: Client[]; timestamp: number }> = {};
let pendingClientsPromises: Record<string, Promise<Client[]>> = {};

export const clearClientsCache = () => {
  clientsCache = {};
};

export async function getClients(forceRefresh = false): Promise<Client[]> {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && clientsCache[currentSchema] && now - clientsCache[currentSchema].timestamp < 3000) {
    return clientsCache[currentSchema].data;
  }

  if (currentSchema in pendingClientsPromises) {
    return pendingClientsPromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get(CLIENTS.CLIENTS);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Client[];
      clientsCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingClientsPromises[currentSchema];
    }
  })();

  pendingClientsPromises[currentSchema] = promise;
  return promise;
}

/**
 * Sanitiza los campos de un contacto antes de enviarlo a la API (POST o PATCH).
 * Los campos vacíos ("") se convierten en null.
 */
export function sanitizeClientPayload(client: Partial<Client>): Partial<Client> {
  const sanitized: Partial<Client> = { ...client };

  if (sanitized.nombre !== undefined) {
    sanitized.nombre = sanitized.nombre.trim();
  }
  if (sanitized.apellido !== undefined) {
    sanitized.apellido = typeof sanitized.apellido === 'string' ? sanitized.apellido.trim() || null : null;
  }
  if (sanitized.correo !== undefined) {
    sanitized.correo = typeof sanitized.correo === 'string' ? sanitized.correo.trim() || null : null;
  }
  if (sanitized.telefono !== undefined) {
    sanitized.telefono = typeof sanitized.telefono === 'string' ? sanitized.telefono.trim() || null : null;
  }
  if (sanitized.puesto !== undefined) {
    sanitized.puesto = typeof sanitized.puesto === 'string' ? sanitized.puesto.trim() || null : null;
  }
  if (sanitized.empresa !== undefined) {
    sanitized.empresa = typeof sanitized.empresa === 'string' ? sanitized.empresa.trim() || null : null;
  }
  if (sanitized.companyId !== undefined) {
    sanitized.companyId = sanitized.companyId || null;
  }
  if (sanitized.ejecutivo_id !== undefined) {
    sanitized.ejecutivo_id = sanitized.ejecutivo_id || null;
  }

  return sanitized;
}

export async function createClient(client: Client | Partial<Client>): Promise<Client> {
    const payload = sanitizeClientPayload(client);
    const response = await axiosInstance.post(CLIENTS.CLIENTS, payload);
    return response.data;
}

export async function updateClient(id: string, client: Client | Partial<Client>): Promise<Client> {
    const payload = sanitizeClientPayload(client);
    const response = await axiosInstance.patch(`${CLIENTS.CLIENTS}/${id}`, payload);
    return response.data;
}

export async function deleteClient(id: string): Promise<void> {
    await axiosInstance.delete(`${CLIENTS.CLIENTS}/${id}`);
}

export const getActiveClients = async (): Promise<Client[]> => {
  const response = await axiosInstance.get(`${CLIENTS.CLIENTS}/active`);
  return response.data;
};

/**
 * Actualiza el estado de un cliente (activo/inactivo).
 * @param id - El ID del cliente a actualizar.
 * @param estatus - `true` para activar, `false` para desactivar.
 */
export const updateClientStatus = async (id: string, estatus: boolean): Promise<void> => {
  await axiosInstance.patch(`${CLIENTS.CLIENTS}/${id}/status`, { estatus });
};
