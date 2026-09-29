import * as yup from 'yup';
import type { CronMode, CronConfigFormData } from '../schemas/automaticNotifications.schema';
import { cronConfigValidationSchema } from '../schemas/automaticNotifications.schema';

/**
 * Genera el texto dinámico de previsualización para el usuario en lenguaje amigable
 */
export const getPreviewText = (
  mode: CronMode,
  fixedTime: string,
  intervalHours: number,
  intervalMinutes: number
): string => {
  if (mode === 'fixed') {
    if (!fixedTime) return 'Selecciona una hora de ejecución.';
    const [h, m] = fixedTime.split(':');
    const hora = parseInt(h, 10);
    const min = parseInt(m, 10);
    const period = hora >= 12 ? 'p.m.' : 'a.m.';
    const h12 = hora === 0 ? 12 : hora > 12 ? hora - 12 : hora;
    const minStr = min === 0 ? '' : ` y ${min} minutos`;
    return `El correo se envía todos los días a las ${h12}${minStr} ${period} (${fixedTime} hrs).`;
  }
  const hText = intervalHours > 0 ? `${intervalHours} hora${intervalHours !== 1 ? 's' : ''}` : '';
  const mText = intervalMinutes > 0 ? `${intervalMinutes} minuto${intervalMinutes !== 1 ? 's' : ''}` : '';
  const parts = [hText, mText].filter(Boolean).join(' y ');
  if (!parts) return 'Define al menos 1 minuto de intervalo.';
  return `El correo se envía cada ${parts}.`;
};

/**
 * Evalúa si el intervalo ingresado cumple con el mínimo de 1 minuto y máximo de 23h 59m
 */
export const isValidInterval = (
  mode: CronMode,
  intervalHours: number,
  intervalMinutes: number
): boolean => {
  if (mode === 'interval') {
    return (
      (intervalHours > 0 || intervalMinutes > 0) &&
      intervalMinutes <= 59 &&
      intervalHours <= 23
    );
  }
  return true;
};

/**
 * Valida de forma asíncrona un objeto de configuración contra el esquema Yup
 */
export const validateCronConfigForm = async (
  values: Partial<CronConfigFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await cronConfigValidationSchema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errors[error.path]) {
          errors[error.path] = error.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Error de validación inesperado' } };
  }
};
