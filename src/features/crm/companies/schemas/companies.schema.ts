import * as yup from 'yup';
import type { Company } from '../../../../core/models/Company';

export type { Company };

/**
 * Esquema de validación Yup para creación y edición de Empresas / Cuentas B2B
 */
export const companyValidationSchema = yup.object().shape({
  nombre: yup
    .string()
    .trim()
    .required('El nombre o razón social de la empresa es obligatorio')
    .min(2, 'El nombre debe contener al menos 2 caracteres')
    .max(120, 'El nombre no puede exceder 120 caracteres'),
  correo: yup
    .string()
    .trim()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .email('Ingresa un correo electrónico corporativo válido'),
  telefono: yup
    .string()
    .trim()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .matches(/^[0-9+\s().-]*$/, 'El formato de teléfono contiene caracteres no permitidos')
    .max(25, 'El teléfono no puede exceder 25 caracteres'),
  website: yup
    .string()
    .trim()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .max(150, 'El sitio web no puede exceder 150 caracteres'),
  direccion: yup
    .string()
    .trim()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .max(250, 'La dirección no puede exceder 250 caracteres'),
  ejecutivo_id: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
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
