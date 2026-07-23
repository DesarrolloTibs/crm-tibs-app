import type { AxiosInstance } from 'axios';
import Swal from 'sweetalert2';
import { configStore } from '../../store/useConfigStore';

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
            }

            return config;
        },
        error => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        response => response,
        error => {
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } else if (error.response?.status === 402) {
                const detail = error.response?.data || {};
                const code = detail.code || 'PAYMENT_REQUIRED';
                const message = detail.message || 'La operación requiere una suscripción activa o excede los límites de tokens.';

                if (code === 'TOKENS_LIMIT_EXCEEDED') {
                    Swal.fire({
                        icon: 'warning',
                        title: '⚠️ Límite de Tokens Alcanzado',
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
                        title: '🚫 Suscripción Expirada',
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