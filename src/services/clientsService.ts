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