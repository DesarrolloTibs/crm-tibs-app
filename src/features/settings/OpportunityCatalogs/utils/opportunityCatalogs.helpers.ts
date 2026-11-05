import * as yup from 'yup';
import type {
  OpportunityCatalogOption,
  CatalogOptionFilterState,
  CatalogStats,
  CatalogOptionFormData,
  CatalogSubTabDefinition,
} from '../schemas/opportunityCatalogs.schema';
import { catalogOptionValidationSchema } from '../schemas/opportunityCatalogs.schema';

export const CATALOG_SUBTABS: CatalogSubTabDefinition[] = [
  {
    id: 'business-lines',
    field_key: 'linea_negocio',
    defaultName: 'Línea de Negocio',
    description: 'Unidades estratégicas de negocio para clasificar cotizaciones y oportunidades.',
  },
  {
    id: 'delivery-types',
    field_key: 'tipo_entrega',
    defaultName: 'Tipo de Entrega',
    description: 'Modalidades de prestación y ejecución del servicio o proyecto ofertado.',
  },
  {
    id: 'licensings',
    field_key: 'licenciamiento',
    defaultName: 'Licenciamiento',
    description: 'Modalidades y esquemas de licenciamiento comercial aplicables.',
  },
];

/**
 * Normaliza y filtra las opciones de catálogo según búsqueda, estado y uso
 */
export const filterCatalogOptions = (
  options: OpportunityCatalogOption[],
  filters: CatalogOptionFilterState
): OpportunityCatalogOption[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return options.filter((option) => {
    // Coincidencia por texto en nombre
    const matchesSearch =
      !normalizedSearch ||
      option.strname.toLowerCase().includes(normalizedSearch);

    // Coincidencia por estado (activo / inactivo)
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && option.blnstatus) ||
      (filters.status === 'inactive' && !option.blnstatus);

    // Coincidencia por uso en oportunidades
    const hasUsage = Boolean(option.isUsed || (option.opportunities && option.opportunities.length > 0));
    const matchesUsage =
      filters.usage === 'all' ||
      (filters.usage === 'used' && hasUsage) ||
      (filters.usage === 'unused' && !hasUsage);

    return matchesSearch && matchesStatus && matchesUsage;
  });
};

/**
 * Calcula los indicadores métricos para el banner superior
 */
export const calculateCatalogStats = (options: OpportunityCatalogOption[]): CatalogStats => {
  const total = options.length;
  const active = options.filter((opt) => opt.blnstatus).length;
  const inactive = total - active;
  const inUse = options.filter(
    (opt) => opt.isUsed || (opt.opportunities && opt.opportunities.length > 0)
  ).length;

  return {
    total,
    active,
    inactive,
    inUse,
  };
};

/**
 * Valida de forma asíncrona un objeto de formulario contra el esquema Yup
 * e impide duplicidad de nombres en el catálogo activo.
 */
export const validateCatalogOptionForm = async (
  values: Partial<CatalogOptionFormData>,
  existingOptions: OpportunityCatalogOption[] = [],
  editingId?: string
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await catalogOptionValidationSchema.validate(values, { abortEarly: false });

    // Verificación de duplicados (insensible a mayúsculas/minúsculas y espacios)
    if (values.strname) {
      const normalizedNew = values.strname.trim().toLowerCase();
      const isDuplicate = existingOptions.some((opt) => {
        if (editingId && opt.id === editingId) return false;
        return opt.strname.trim().toLowerCase() === normalizedNew;
      });

      if (isDuplicate) {
        return {
          isValid: false,
          errors: {
            strname: 'Ya existe una opción con este nombre en este catálogo.',
          },
        };
      }
    }

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
