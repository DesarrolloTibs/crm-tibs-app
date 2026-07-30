import axiosInstance from '../core/axios/axiosInstance';
import { auth } from '../global/endpoints';
import type { User } from '../core/models/User';

export async function login(email: string, password: string): Promise<User> {
    const response = await axiosInstance.post(auth.LOGIN, { email, password });
    // La API envuelve la respuesta en { data: { access_token, user, role }, statusCode, timestamp }
    const payload = response.data?.data ?? response.data;
    if (payload.access_token) {
        localStorage.setItem('token', payload.access_token);
    }
    return payload.user;
}