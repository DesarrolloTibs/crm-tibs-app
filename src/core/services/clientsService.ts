import axiosInstance from '../core/axios/axiosInstance';
import { CLIENTS } from '../global/endpoints';
import type { Client } from '../core/models/Client';
import { configStore } from '../store/useConfigStore';

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

export async function createClient(client: Client): Promise<Client> {
    const response = await axiosInstance.post(CLIENTS.CLIENTS, client);
    return response.data;
}

export async function updateClient(id: string, client: Client): Promise<Client> {
    const response = await axiosInstance.patch(`${CLIENTS.CLIENTS}/${id}`, client);
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