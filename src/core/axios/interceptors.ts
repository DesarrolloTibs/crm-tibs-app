import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Swal from 'sweetalert2';
import { configStore } from '../../store/useConfigStore';
import { refreshToken, logout } from '@core/services/authService';

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export function setupInterceptors(axiosInstance: AxiosInstance) {
    axiosInstance.interceptors.request.use(
        config => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // Inyectar el esquema del tenant seleccionado para llamadas del SuperAdmin
            const selectedTenant = configStore.getSelectedTenant();
            if (selectedTenant && selectedTenant.schema_name) {
                config.headers['x-tenant-schema'] = selectedTenant.schema_name;
            } else {
                config.headers['x-tenant-schema'] = 'public';
            }

            return config;
        },
        error => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        response => {
            if (response.data && typeof response.data === 'object' && 'data' in response.data && 'statusCode' in response.data && 'timestamp' in response.data) {
                response.data = response.data.data;
            }
            return response;
        },
        async error => {
            const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });

            if (error.response?.status === 401) {
                const requestUrl = originalRequest?.url || '';
                const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');
                const hasRefreshToken = !!localStorage.getItem('refresh_token');

                // Si falló el login, el propio endpoint de refresh, no hay refresh_token o ya se reintentó: cerrar sesión
                if (isAuthEndpoint || !hasRefreshToken || originalRequest?._retry) {
                    logout();
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    // Si ya hay un refresco en curso, encolar esta petición hasta que termine
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(token => {
                            if (originalRequest.headers) {
                                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                            }
                            return axiosInstance(originalRequest);
                        })
                        .catch(err => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const newToken = await refreshToken();
                    if (!newToken) {
                        processQueue(new Error('Fallo al refrescar token'), null);
                        logout();
                        return Promise.reject(error);
                    }

                    processQueue(null, newToken);
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    }
                    return axiosInstance(originalRequest);
                } catch (refreshErr) {
                    processQueue(refreshErr, null);
                    logout();
                    return Promise.reject(refreshErr);
                } finally {
                    isRefreshing = false;
                }
            } else if (error.response?.status === 402) {
                const detail = error.response?.data || {};
                const code = detail.code || 'PAYMENT_REQUIRED';
                const message = detail.message || 'La operación requiere una suscripción activa o excede los límites de tokens.';

                if (code === 'TOKENS_LIMIT_EXCEEDED') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Límite de Tokens Alcanzado',
                        html: `
                          <p class="text-slate-600 mb-3">${message}</p>
                          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs font-mono">
                            <p><strong>Consumidos:</strong> ${detail.tokens_used?.toLocaleString() || 0} tokens</p>
                            <p><strong>Límite Asignado:</strong> ${detail.tokens_limit?.toLocaleString() || 0} tokens</p>
                            <p><strong>Renovación:</strong> ${detail.next_renewal_date ? new Date(detail.next_renewal_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        `,
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#f59e0b',
                    });
                } else if (code === 'SUBSCRIPTION_EXPIRED') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Suscripción Expirada',
                        text: message,
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#ef4444',
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Plan Requerido',
                        text: message,
                        confirmButtonText: 'Entendido',
                    });
                }
            }
            return Promise.reject(error);
        }
    );
}