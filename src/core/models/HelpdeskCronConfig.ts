/**
 * Configuración del cron de notificaciones de la Mesa de Ayuda.
 * Determina cuándo se notifica por correo sobre tickets sin asignar en etapa inicial.
 * Relación 1:1 con Helpdesk.
 */
export interface HelpdeskCronConfig {
  id?: string;
  helpdesk_id: string;
  /** 'fixed' = hora fija del día | 'interval' = cada cierto tiempo */
  cron_mode: 'fixed' | 'interval';
  /** Hora de ejecución en formato 'HH:MM'. Solo aplica cuando cron_mode = 'fixed'. */
  cron_time: string | null;
  /** Horas del intervalo. Solo aplica cuando cron_mode = 'interval'. */
  cron_interval_hours: number | null;
  /** Minutos del intervalo. Solo aplica cuando cron_mode = 'interval'. */
  cron_interval_minutes: number | null;
  blnstatus: boolean;
  dtmcreated?: string;
  dtmlastmodified?: string;
}
