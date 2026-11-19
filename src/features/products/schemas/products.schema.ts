import * as yup from 'yup';
import { emptyStringToNull } from '@shared/utils/yupValidation';

export const productValidationSchema = yup.object().shape({
  nombre: yup
    .string()
    .trim()
    .required('El nombre del producto es obligatorio')
    .min(2, 'El nombre debe contener al menos 2 caracteres')
    .max(120, 'El nombre no puede exceder los 120 caracteres'),
  descripcion: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .max(1000, 'La descripción no puede exceder los 1000 caracteres'),
  precioBase: yup
    .number()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? NaN : val))
    .typeError('El precio base debe ser un valor numérico válido')
    .required('El precio base es obligatorio')
    .min(0, 'El precio base no puede ser negativo')
    .max(999999999.99, 'El precio base excede el límite permitido'),
  unidadMedida: yup
    .string()
    .trim()
    .required('La unidad de medida es obligatoria')
    .min(1, 'La unidad de medida es obligatoria')
    .max(50, 'La unidad de medida no puede exceder los 50 caracteres'),
  observaciones: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .max(500, 'Las observaciones no pueden exceder los 500 caracteres'),
  status: yup.boolean().default(true),
});

export interface ProductFormValidationValues {
  nombre: string;
  descripcion: string;
  precioBase: string;
  unidadMedida: string;
  observaciones: string;
  status: boolean;
}
