import * as yup from 'yup';
import {
  emptyStringToNull,
  optionalEmailField,
  optionalPhoneField,
  optionalHttpUrlField,
} from '@shared/utils/yupValidation';
import type { Company } from '@core/models/Company';

export type { Company };

/**
 * Esquema de validación Yup para creación y edición de Empresas / Cuentas B2B
 * Únicamente el nombre es obligatorio (*). Todos los demás campos son 100% opcionales.
 */
export const companyValidationSchema = yup.object().shape({
  nombre: yup
    .string()
    .trim()
    .required('El nombre o razón social de la empresa es obligatorio')
    .min(2, 'El nombre debe contener al menos 2 caracteres')
    .max(120, 'El nombre no puede exceder 120 caracteres'),
  correo: optionalEmailField(100, 'Ingresa un correo electrónico corporativo válido'),
  telefono: optionalPhoneField(25),
  website: optionalHttpUrlField(150),
  direccion: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .max(250, 'La dirección no puede exceder 250 caracteres'),
  ejecutivo_id: yup
    .string()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull),
  estatus: yup
    .boolean()
    .default(true),
});

export type CompanyFormData = yup.InferType<typeof companyValidationSchema>;

export type CompanyStatusFilter = 'all' | 'active' | 'inactive';

export interface CompanyFiltersState {
  search: string;
  status: CompanyStatusFilter;
  ejecutivoId: string | 'all';
}

export interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
  withContacts: number;
}
