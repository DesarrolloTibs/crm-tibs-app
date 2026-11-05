import type { TypeActivity, ActivityTypeFilterState, ActivityTypeStats, ActivityTypeFormData } from '../schemas/activityTypes.schema';
import { activityTypeValidationSchema } from '../schemas/activityTypes.schema';
import * as yup from 'yup';

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los Estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
] as const;

/**
 * Normaliza y filtra el listado de tipos de actividad según los criterios activos
 */
export const filterActivityTypes = (
  types: TypeActivity[],
  filters: ActivityTypeFilterState
): TypeActivity[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return types.filter((type) => {
    // Coincidencia por nombre
    const matchesSearch =
      !normalizedSearch ||
      type.strname.toLowerCase().includes(normalizedSearch);

    // Coincidencia por estado
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && type.blnstatus) ||
      (filters.status === 'inactive' && !type.blnstatus);

    return matchesSearch && matchesStatus;
  });
};

/**
 * Calcula las estadísticas globales de los tipos de actividad
 */
export const calculateActivityTypeStats = (types: TypeActivity[]): ActivityTypeStats => {
  const total = types.length;
  const active = types.filter((t) => t.blnstatus).length;
  const inactive = total - active;

  return {
    total,
    active,
    inactive,
  };
};

/**
 * Valida de forma asíncrona un objeto de formulario contra el esquema Yup
 */
export const validateActivityTypeForm = async (
  values: Partial<ActivityTypeFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await activityTypeValidationSchema.validate(values, { abortEarly: false });
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
