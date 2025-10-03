import axiosInstance from '../core/axios/axiosInstance';
import { CLIENTS } from '../global/endpoints';
import type { Client } from '../core/models/Client';

export async function getClients(): Promise<Client[]> {
    const response = await axiosInstance.get(CLIENTS.CLIENTS);
    return response.data;
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