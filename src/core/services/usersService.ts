import axiosInstance from '../core/axios/axiosInstance';
import { USERS } from '../global/endpoints';
import type { User } from '../core/models/User';
import { configStore } from '../store/useConfigStore';

let usersCache: Record<string, { data: User[]; timestamp: number }> = {};
let pendingUsersPromises: Record<string, Promise<User[]>> = {};

export const clearUsersCache = () => {
  usersCache = {};
};

export async function getUsers(forceRefresh = false): Promise<User[]> {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && usersCache[currentSchema] && now - usersCache[currentSchema].timestamp < 3000) {
    return usersCache[currentSchema].data;
  }

  if (currentSchema in pendingUsersPromises) {
    return pendingUsersPromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get(USERS.USERS);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as User[];
      usersCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingUsersPromises[currentSchema];
    }
  })();

  pendingUsersPromises[currentSchema] = promise;
  return promise;
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
export const uploadProfileImage = async (id: string, file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<User>(
    `${USERS.USERS}/${id}/profile-image`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};