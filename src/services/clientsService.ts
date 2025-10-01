import axiosInstance from '../core/axios/axiosInstance';
import { ENDPOINTS } from '../global/endpoints';
import type { Client } from '../core/models/Client';

export async function getClients(): Promise<Client[]> {
    const response = await axiosInstance.get(ENDPOINTS.CLIENTS);
    return response.data;
}

export async function createClient(client: Client): Promise<Client> {
    const response = await axiosInstance.post(ENDPOINTS.CLIENTS, client);
    return response.data;
}

export async function updateClient(id: string, client: Client): Promise<Client> {
    const response = await axiosInstance.patch(`${ENDPOINTS.CLIENTS}/${id}`, client);
    return response.data;
}

export async function deleteClient(id: string): Promise<void> {
    await axiosInstance.delete(`${ENDPOINTS.CLIENTS}/${id}`);
}