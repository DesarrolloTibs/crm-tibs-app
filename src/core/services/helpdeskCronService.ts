import axiosInstance from '../core/axios/axiosInstance';
import { HELPDESK_CRON } from '../global/endpoints';
import type { HelpdeskCronConfig } from '../core/models/HelpdeskCronConfig';

/**
 * Obtiene la configuración del cron de notificaciones de la Mesa de Ayuda principal.
 */
export const getHelpdeskCronConfig = async (): Promise<HelpdeskCronConfig> => {
  const response = await axiosInstance.get<HelpdeskCronConfig>(HELPDESK_CRON.CRON_CONFIG);
  return response.data;
};

/**
 * Guarda (crea o actualiza) la configuración del cron de la Mesa de Ayuda.
 */
export const saveHelpdeskCronConfig = async (
  data: Partial<HelpdeskCronConfig>
): Promise<HelpdeskCronConfig> => {
  const response = await axiosInstance.patch<HelpdeskCronConfig>(
    HELPDESK_CRON.CRON_CONFIG,
    data
  );
  return response.data;
};
