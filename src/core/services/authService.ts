import axios from 'axios';
import axiosInstance from '../core/axios/axiosInstance';
import { auth } from '../global/endpoints';
import type { User } from '../core/models/User';

// Canal de difusión para sincronización en tiempo real entre ventanas/pestañas de la PWA
export const authChannel =
    typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel('crm_tibs_auth')
        : null;

export function broadcastAuthEvent(type: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESHED', payload?: any) {
    try {
        authChannel?.postMessage({ type, payload });
    } catch (e) {
        console.warn('No se pudo emitir evento de auth en BroadcastChannel', e);
    }
}

export async function login(email: string, password: string): Promise<User> {
    const response = await axiosInstance.post(auth.LOGIN, { email, password });
    // La API envuelve la respuesta en { data: { access_token, refresh_token, user, role }, statusCode, timestamp }
    const payload = response.data?.data ?? response.data;
    if (payload.access_token) {
        localStorage.setItem('token', payload.access_token);
    }
    if (payload.refresh_token) {
        localStorage.setItem('refresh_token', payload.refresh_token);
    }
    broadcastAuthEvent('LOGIN', { token: payload.access_token });
    return payload.user;
}

export async function refreshToken(): Promise<string | null> {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) return null;

    try {
        // Petición limpia directa sin pasar por los interceptores para evitar bucle de reintento
        const response = await axios.post(auth.REFRESH, {
            refresh_token: storedRefreshToken,
        });

        const payload = response.data?.data ?? response.data;
        if (payload.access_token) {
            localStorage.setItem('token', payload.access_token);
        }
        if (payload.refresh_token) {
            localStorage.setItem('refresh_token', payload.refresh_token);
        }

        broadcastAuthEvent('TOKEN_REFRESHED', { token: payload.access_token });
        return payload.access_token || null;
    } catch (error) {
        console.warn('Error al renovar token de sesión en authService:', error);
        return null;
    }
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    broadcastAuthEvent('LOGOUT');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}