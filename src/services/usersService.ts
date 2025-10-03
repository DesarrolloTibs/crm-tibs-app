import axiosInstance from '../core/axios/axiosInstance';
import { USERS } from '../global/endpoints';
import type { User } from '../core/models/User';

export async function getUsers(): Promise<User[]> {
    const response = await axiosInstance.get(USERS.USERS);
    return response.data;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
    const response = await axiosInstance.post(USERS.USERS, user);
    return response.data;
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
    const response = await axiosInstance.patch(`${USERS.USERS}/${id}`, user);
    return response.data;
}

export async function deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`${USERS.USERS}/${id}`);
}

export const getActiveUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get(`${USERS.USERS}/active`);
  return response.data;
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<void> => {
  await axiosInstance.patch(`${USERS.USERS}/${id}/status`, { isActive });
};