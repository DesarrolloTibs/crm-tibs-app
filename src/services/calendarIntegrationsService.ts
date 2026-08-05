import axiosInstance from '../core/axios/axiosInstance';

export interface CalendarIntegrationStatus {
  connected: boolean;
  provider?: 'google' | 'outlook' | 'icloud';
  email?: string;
  createdAt?: string;
  disabled?: boolean;
}

/**
   Obtiene el estado de conexión del calendario del usuario firmado.
 */
export async function getCalendarIntegrationStatus(): Promise<CalendarIntegrationStatus> {
  const response = await axiosInstance.get('/api/calendar-integrations/status');
  return response.data;
}

/**
   Obtiene la URL de autorización para el flujo OAuth2 de Google o Outlook.
 */
export async function getCalendarAuthUrl(provider: 'google' | 'outlook'): Promise<string> {
  const response = await axiosInstance.get('/api/calendar-integrations/auth-url', {
    params: { provider },
  });
  return response.data.authUrl;
}

/**
   Conecta una cuenta de iCloud CalDAV.
 */
export async function connectICloudCalendar(email: string, appPassword: string): Promise<{ success: boolean; email: string }> {
  const response = await axiosInstance.post('/api/calendar-integrations/connect-icloud', {
    email,
    appPassword,
  });
  return response.data;
}

/**
   Remueve la integración de calendario activa.
 */
export async function disconnectCalendar(): Promise<{ success: boolean }> {
  const response = await axiosInstance.delete('/api/calendar-integrations/disconnect');
  return response.data;
}
