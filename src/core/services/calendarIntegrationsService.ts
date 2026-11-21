import axiosInstance from '@core/axios/axiosInstance';

export interface CalendarIntegrationStatus {
  connected: boolean;
  provider?: 'google' | 'outlook' | 'icloud';
  email?: string;
  createdAt?: string;
  disabled?: boolean;
}

const baseUrl = import.meta.env.VITE_BASE_URL || '';

/**
   Obtiene el estado de conexión del calendario del usuario firmado.
 */
export async function getCalendarIntegrationStatus(): Promise<CalendarIntegrationStatus> {
  const response = await axiosInstance.get(`${baseUrl}/api/calendar-integrations/status`);
  return response.data;
}

/**
   Obtiene la URL de autorización para el flujo OAuth2 de Google o Outlook.
 */
export async function getCalendarAuthUrl(provider: 'google' | 'outlook'): Promise<string> {
  const response = await axiosInstance.get(`${baseUrl}/api/calendar-integrations/auth-url`, {
    params: { provider, t: Date.now() },
  });
  return response.data.authUrl;
}

/**
   Remueve la integración de calendario activa.
 */
export async function disconnectCalendar(): Promise<{ success: boolean }> {
  const response = await axiosInstance.delete(`${baseUrl}/api/calendar-integrations/disconnect`);
  return response.data;
}
