import * as yup from 'yup';
import type { Client, ClientCategoryType } from '@core/models/Client';
import { ClientCategory } from '@core/models/Client';

export type { Client, ClientCategoryType };

/**
 * Esquema de validación Yup para alta y edición de contactos/clientes
 */
export const contactValidationSchema = yup.object().shape({
  nombre: yup
    .string()
    .trim()
    .required('El nombre del contacto es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres'),
  apellido: yup
    .string()
    .trim()
    .required('El apellido del contacto es obligatorio')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(60, 'El apellido no puede exceder 60 caracteres'),
  correo: yup
    .string()
    .trim()
    .required('El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico corporativo válido'),
  telefono: yup
    .string()
    .trim()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .matches(/^[0-9+\s().-]*$/, 'El formato de teléfono contiene caracteres no permitidos')
    .max(25, 'El teléfono no puede exceder 25 caracteres'),
  puesto: yup
    .string()
    .trim()
    .required('El cargo o puesto es obligatorio')
    .min(2, 'El puesto debe contener al menos 2 caracteres')
    .max(80, 'El puesto no puede exceder 80 caracteres'),
  category: yup
    .mixed<ClientCategoryType>()
    .oneOf(Object.values(ClientCategory) as ClientCategoryType[], 'Selecciona una categoría válida')
    .default(ClientCategory.CONTACTO),
  ejecutivo_id: yup
    .string()
    .trim()
    .required('Debes asignar un ejecutivo responsable'),
  companyId: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  empresa: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  estatus: yup
    .boolean()
    .default(true),
});

export type ContactFormData = yup.InferType<typeof contactValidationSchema>;

export type ContactStatusFilter = 'all' | 'active' | 'inactive';

export interface ContactFiltersState {
  search: string;
  status: ContactStatusFilter;
  category: ClientCategoryType | 'all';
  ejecutivoId: string | 'all';
  companyId: string | 'all';
}

export interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  withCompany: number;
  withoutCompany: number;
}
