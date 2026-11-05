import * as yup from 'yup';
import type { HelpdeskCronConfig } from '@core/models/HelpdeskCronConfig';

export type { HelpdeskCronConfig };

export type CronMode = 'fixed' | 'interval';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

/**
 * Esquema de validación Yup para la configuración del cron de notificaciones
 */
export const cronConfigValidationSchema = yup.object().shape({
  cron_mode: yup
    .string()
    .oneOf(['fixed', 'interval'], 'Selecciona un modo de ejecución válido')
    .required('El modo de ejecución es obligatorio'),
  cron_time: yup
    .string()
    .nullable()
    .when('cron_mode', {
      is: 'fixed',
      then: (schema) =>
        schema
          .required('Debes especificar la hora de ejecución')
          .matches(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Formato de hora no válido (debe ser HH:MM en formato 24 hrs)'
          ),
      otherwise: (schema) => schema.nullable().default(null),
    }),
  cron_interval_hours: yup
    .number()
    .nullable()
    .when('cron_mode', {
      is: 'interval',
      then: (schema) =>
        schema
          .typeError('Las horas deben ser un valor numérico')
          .min(0, 'Las horas no pueden ser negativas')
          .max(23, 'El intervalo no puede superar 23 horas')
          .required('Las horas del intervalo son obligatorias'),
      otherwise: (schema) => schema.nullable().default(null),
    }),
  cron_interval_minutes: yup
    .number()
    .nullable()
    .when('cron_mode', {
      is: 'interval',
      then: (schema) =>
        schema
          .typeError('Los minutos deben ser un valor numérico')
          .min(0, 'Los minutos no pueden ser negativos')
          .max(59, 'Los minutos no pueden exceder 59')
          .required('Los minutos del intervalo son obligatorios'),
      otherwise: (schema) => schema.nullable().default(null),
    }),
  blnstatus: yup.boolean().default(true),
}).test('valid-interval-duration', 'Define un intervalo válido (entre 1 minuto y 23 horas 59 minutos).', function (values) {
  if (values.cron_mode === 'interval') {
    const hours = values.cron_interval_hours ?? 0;
    const minutes = values.cron_interval_minutes ?? 0;
    return hours * 60 + minutes >= 1;
  }
  return true;
});

export type CronConfigFormData = yup.InferType<typeof cronConfigValidationSchema>;
