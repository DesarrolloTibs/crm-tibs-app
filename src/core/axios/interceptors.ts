import type { AxiosInstance } from 'axios';

export function setupInterceptors(axiosInstance: AxiosInstance) {
    axiosInstance.interceptors.request.use(
        config => {
            // Ejemplo: agregar token si existe
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        error => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        response => response,
        error => {
            // Manejo global de errores
            if (error.response?.status === 401) {
                // Redirigir o limpiar sesión
            }
            return Promise.reject(error);
        }
    );
}