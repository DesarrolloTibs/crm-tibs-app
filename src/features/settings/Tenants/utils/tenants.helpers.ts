import * as yup from 'yup';
import type {
  TenantPlanInfo,
  TenantFilterState,
  TenantsStats,
  ProvisionTenantFormData,
  TenantGeneralFormData,
  TenantPlanFormData,
  TenantEnqueueFormData,
} from '../schemas/tenants.schema';
import {
  provisionTenantValidationSchema,
  tenantGeneralValidationSchema,
  tenantPlanValidationSchema,
  tenantEnqueueValidationSchema,
} from '../schemas/tenants.schema';

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'with_queue', label: 'Con Cola' },
  { value: 'allow_extra', label: 'Excedente' },
] as const;

/**
 * Normaliza y filtra el listado de organizaciones según el término de búsqueda y filtro de estado
 */
export const filterTenants = (
  tenants: TenantPlanInfo[],
  filters: TenantFilterState,
  queueSummaries: Record<number, { total: number; coverageUntil: string | null }>
): TenantPlanInfo[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return tenants.filter((tenant) => {
    // Coincidencia por nombre o esquema
    const matchesSearch =
      !normalizedSearch ||
      tenant.name.toLowerCase().includes(normalizedSearch) ||
      tenant.schema_name.toLowerCase().includes(normalizedSearch) ||
      (tenant.plan?.plan_name && tenant.plan.plan_name.toLowerCase().includes(normalizedSearch));

    // Períodos en cola calculados
    const queuedCount =
      tenant.total_queued_periods ?? queueSummaries[tenant.id]?.total ?? 0;

    // Coincidencia por estado
    let matchesStatus = true;
    if (filters.status === 'active') {
      matchesStatus = tenant.is_active;
    } else if (filters.status === 'inactive') {
      matchesStatus = !tenant.is_active;
    } else if (filters.status === 'with_queue') {
      matchesStatus = queuedCount > 0;
    } else if (filters.status === 'allow_extra') {
      matchesStatus = tenant.allow_extra;
    }

    return matchesSearch && matchesStatus;
  });
};

/**
 * Calcula los indicadores KPI para el banner superior
 */
export const calculateTenantStats = (
  tenants: TenantPlanInfo[],
  queueSummaries: Record<number, { total: number }>
): TenantsStats => {
  const total = tenants.length;
  let active = 0;
  let inactive = 0;
  let withQueue = 0;
  let allowExtra = 0;

  tenants.forEach((t) => {
    if (t.is_active) {
      active++;
    } else {
      inactive++;
    }

    const queuedCount = t.total_queued_periods ?? queueSummaries[t.id]?.total ?? 0;
    if (queuedCount > 0) {
      withQueue++;
    }

    if (t.allow_extra) {
      allowExtra++;
    }
  });

  return {
    total,
    active,
    inactive,
    withQueue,
    allowExtra,
  };
};

/**
 * Validador asíncrono para el formulario de provisión
 */
export const validateProvisionForm = async (
  values: Partial<ProvisionTenantFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await provisionTenantValidationSchema.validate(values, { abortEarly: false });
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

/**
 * Validador asíncrono para el formulario de datos generales
 */
export const validateTenantGeneralForm = async (
  values: Partial<TenantGeneralFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await tenantGeneralValidationSchema.validate(values, { abortEarly: false });
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

/**
 * Validador asíncrono para el formulario de cambio de plan
 */
export const validateTenantPlanForm = async (
  values: Partial<TenantPlanFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await tenantPlanValidationSchema.validate(values, { abortEarly: false });
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

/**
 * Validador asíncrono para encolar renovación
 */
export const validateTenantEnqueueForm = async (
  values: Partial<TenantEnqueueFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await tenantEnqueueValidationSchema.validate(values, { abortEarly: false });
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
