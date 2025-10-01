import axiosInstance from '../core/axios/axiosInstance';
import { ENDPOINTS } from '../global/endpoints';
import type { User } from '../core/models/User';

export async function login(email: string, password: string): Promise<User> {
    const response = await axiosInstance.post(ENDPOINTS.LOGIN, { email, password });
    // Guarda el token si lo recibes
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
    }
    return response.data.user;
}