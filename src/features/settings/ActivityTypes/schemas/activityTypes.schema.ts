import * as yup from 'yup';
import type { TypeActivity } from '../../../../core/models/Activity';

export type { TypeActivity };

/**
 * Esquema de validación Yup para creación y edición de tipos de actividad
 */
export const activityTypeValidationSchema = yup.object().shape({
  strname: yup
    .string()
    .trim()
    .required('El nombre del tipo de actividad es obligatorio')
    .min(2, 'El nombre debe contener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  blnstatus: yup
    .boolean()
    .default(true),
});

export type ActivityTypeFormData = yup.InferType<typeof activityTypeValidationSchema>;

export type ActivityTypeStatusFilter = 'all' | 'active' | 'inactive';

export interface ActivityTypeFilterState {
  search: string;
  status: ActivityTypeStatusFilter;
}

export interface ActivityTypeStats {
  total: number;
  active: number;
  inactive: number;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
