import type {
  Plan,
  SubscriptionPlanFilterState,
  SubscriptionPlanStats,
  SubscriptionPlanFormData,
} from '../schemas/subscriptionPlans.schema';
import { subscriptionPlanValidationSchema } from '../schemas/subscriptionPlans.schema';
import * as yup from 'yup';

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los Estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
] as const;

/**
 * Normaliza y filtra el listado de planes de suscripción según los criterios activos
 */
export const filterSubscriptionPlans = (
  plans: Plan[],
  filters: SubscriptionPlanFilterState
): Plan[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return plans.filter((plan) => {
    // Coincidencia por nombre de plan
    const matchesSearch =
      !normalizedSearch ||
      plan.plan_name.toLowerCase().includes(normalizedSearch);

    // Coincidencia por estado
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && plan.blnstatus) ||
      (filters.status === 'inactive' && !plan.blnstatus);

    return matchesSearch && matchesStatus;
  });
};

/**
 * Calcula las estadísticas métricas del catálogo de planes
 */
export const calculateSubscriptionPlanStats = (plans: Plan[]): SubscriptionPlanStats => {
  const total = plans.length;
  const active = plans.filter((p) => p.blnstatus).length;
  const inactive = total - active;

  const totalPrices = plans.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const avgPrice = total > 0 ? totalPrices / total : 0;

  const totalTokens = plans.reduce((acc, p) => acc + (Number(p.tokens_limit) || 0), 0);
  const avgTokensLimit = total > 0 ? Math.round(totalTokens / total) : 0;

  return {
    total,
    active,
    inactive,
    avgPrice,
    avgTokensLimit,
  };
};

/**
 * Valida de forma asíncrona un objeto de formulario contra el esquema Yup
 */
export const validateSubscriptionPlanForm = async (
  values: Partial<SubscriptionPlanFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await subscriptionPlanValidationSchema.validate(values, { abortEarly: false });
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
 * Formatea un monto numérico a formato de divisa USD
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price || 0);
};

/**
 * Formatea un número entero con separador de miles para límites de tokens
 */
export const formatTokens = (tokens: number): string => {
  return `${(Number(tokens) || 0).toLocaleString()} tokens`;
};

/**
 * Retorna la etiqueta legible del período de facturación (mensual, anual, etc.)
 */
export const formatBillingPeriod = (months: number): { label: string; periodType: string } => {
  const numMonths = Number(months) || 1;
  let periodType = 'Personalizado';

  if (numMonths === 1) periodType = 'Mensual';
  else if (numMonths === 2) periodType = 'Bimestral';
  else if (numMonths === 3) periodType = 'Trimestral';
  else if (numMonths === 6) periodType = 'Semestral';
  else if (numMonths === 12) periodType = 'Anual';
  else if (numMonths === 24) periodType = 'Bianual';

  return {
    label: `${numMonths} ${numMonths === 1 ? 'mes' : 'meses'}`,
    periodType,
  };
};
