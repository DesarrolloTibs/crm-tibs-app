import * as yup from 'yup';
import type { OpportunityCatalogOption } from '@core/models/OpportunityCatalog';

export type { OpportunityCatalogOption };

export type CatalogType = 'business-lines' | 'delivery-types' | 'licensings';

export interface CatalogSubTabDefinition {
  id: CatalogType;
  field_key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento';
  defaultName: string;
  description: string;
}

/**
 * Esquema de validación Yup para creación y edición de opciones de catálogo
 */
export const catalogOptionValidationSchema = yup.object().shape({
  strname: yup
    .string()
    .trim()
    .required('El nombre de la opción es obligatorio')
    .min(2, 'El nombre debe contener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  blnstatus: yup
    .boolean()
    .default(true),
});

export type CatalogOptionFormData = yup.InferType<typeof catalogOptionValidationSchema>;

export type CatalogOptionStatusFilter = 'all' | 'active' | 'inactive';
export type CatalogOptionUsageFilter = 'all' | 'used' | 'unused';

export interface CatalogOptionFilterState {
  search: string;
  status: CatalogOptionStatusFilter;
  usage: CatalogOptionUsageFilter;
}

export interface CatalogStats {
  total: number;
  active: number;
  inactive: number;
  inUse: number;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
