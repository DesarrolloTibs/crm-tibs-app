import * as yup from 'yup';
import type { Plan, CreatePlanPayload } from '@core/services/plansService';

export type { Plan, CreatePlanPayload };

/**
 * Esquema de validación Yup para creación y edición de planes de suscripción
 */
export const subscriptionPlanValidationSchema = yup.object().shape({
  plan_name: yup
    .string()
    .trim()
    .required('El nombre del plan es obligatorio')
    .min(2, 'El nombre debe contener al menos 2 caracteres')
    .max(60, 'El nombre no puede exceder los 60 caracteres'),
  price: yup
    .number()
    .typeError('El precio debe ser un número válido')
    .required('El precio es obligatorio')
    .min(0, 'El precio no puede ser negativo'),
  tokens_limit: yup
    .number()
    .typeError('El límite de tokens debe ser un número entero')
    .required('El límite de tokens es obligatorio')
    .min(0, 'El límite de tokens no puede ser negativo')
    .integer('El límite de tokens debe ser un número entero'),
  billing_period_months: yup
    .number()
    .typeError('El período debe ser un número entero')
    .required('El período de facturación es obligatorio')
    .min(1, 'El período mínimo es 1 mes')
    .max(60, 'El período máximo es 60 meses')
    .integer('El período debe ser en meses enteros'),
  blnstatus: yup
    .boolean()
    .default(true),
});

export type SubscriptionPlanFormData = yup.InferType<typeof subscriptionPlanValidationSchema>;

export type SubscriptionPlanStatusFilter = 'all' | 'active' | 'inactive';

export interface SubscriptionPlanFilterState {
  search: string;
  status: SubscriptionPlanStatusFilter;
}

export interface SubscriptionPlanStats {
  total: number;
  active: number;
  inactive: number;
  avgPrice: number;
  avgTokensLimit: number;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
