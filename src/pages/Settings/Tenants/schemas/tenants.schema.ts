import * as yup from 'yup';
import type { TenantPlanInfo } from '../../../../store/useConfigStore';
import type { Plan } from '../../../../services/plansService';
import type {
  ProvisionTenantPayload,
  RenewalQueueResponse,
  RenewalQueueItem,
  UpdateTenantPlanPayload,
} from '../../../../services/tenantsService';

export type {
  TenantPlanInfo,
  TenantPlanInfo as Tenant,
  Plan,
  ProvisionTenantPayload,
  RenewalQueueResponse,
  RenewalQueueItem,
  UpdateTenantPlanPayload,
};

/**
 * Esquema Yup para provisión de nueva organización
 */
export const provisionTenantValidationSchema = yup.object().shape({
  tenantName: yup
    .string()
    .trim()
    .required('El nombre de la organización es obligatorio')
    .min(2, 'Debe contener al menos 2 caracteres')
    .max(100, 'No puede exceder los 100 caracteres'),
  adminUsername: yup
    .string()
    .trim()
    .required('El nombre de usuario administrador es obligatorio')
    .min(3, 'El username debe contener al menos 3 caracteres')
    .max(50, 'El username no puede exceder los 50 caracteres')
    .matches(/^[a-zA-Z0-9_.-]+$/, 'Solo se permiten letras, números, puntos, guiones y guiones bajos'),
  adminEmail: yup
    .string()
    .trim()
    .required('El correo electrónico es obligatorio')
    .email('Debe ser un correo electrónico válido')
    .max(100, 'El email no puede exceder los 100 caracteres'),
  planId: yup
    .number()
    .nullable()
    .optional(),
  billingPeriodMonths: yup
    .number()
    .default(1),
});

export type ProvisionTenantFormData = yup.InferType<typeof provisionTenantValidationSchema>;

/**
 * Esquema Yup para actualización de datos generales de la organización
 */
export const tenantGeneralValidationSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('El nombre de la organización es obligatorio')
    .min(2, 'Debe contener al menos 2 caracteres')
    .max(100, 'No puede exceder los 100 caracteres'),
  is_active: yup
    .boolean()
    .default(true),
  allow_extra: yup
    .boolean()
    .default(false),
});

export type TenantGeneralFormData = yup.InferType<typeof tenantGeneralValidationSchema>;

/**
 * Esquema Yup para cambio y asignación de plan
 */
export const tenantPlanValidationSchema = yup.object().shape({
  planId: yup
    .number()
    .required('Debes seleccionar un plan'),
  planApplicationMode: yup
    .string()
    .oneOf(['immediate_keep', 'immediate_reset', 'next_period'] as const)
    .default('immediate_keep'),
  updateQueuedPlans: yup
    .boolean()
    .default(false),
  assignAllowExtra: yup
    .boolean()
    .default(false),
});

export type TenantPlanFormData = yup.InferType<typeof tenantPlanValidationSchema>;

/**
 * Esquema Yup para encolar períodos de renovación prepagada
 */
export const tenantEnqueueValidationSchema = yup.object().shape({
  planId: yup
    .number()
    .required('Debes seleccionar un plan a encolar'),
  periodsCount: yup
    .number()
    .required('La cantidad de períodos es obligatoria')
    .min(1, 'Debe encolar al menos 1 período')
    .max(60, 'El límite máximo es de 60 períodos'),
});

export type TenantEnqueueFormData = yup.InferType<typeof tenantEnqueueValidationSchema>;

/**
 * Filtros de estado disponibles para la tabla
 */
export type TenantStatusFilter = 'all' | 'active' | 'inactive' | 'with_queue' | 'allow_extra';

export interface TenantFilterState {
  search: string;
  status: TenantStatusFilter;
}

/**
 * Indicadores KPI para el banner superior
 */
export interface TenantsStats {
  total: number;
  active: number;
  inactive: number;
  withQueue: number;
  allowExtra: number;
}

/**
 * Estado para la notificación compartida del sistema
 */
export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
