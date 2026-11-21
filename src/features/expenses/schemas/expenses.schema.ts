import * as yup from 'yup';
import { hasAtMostTwoDecimals } from '@shared/utils/yupValidation';

export const expenseValidationSchema = yup.object().shape({
  associationType: yup
    .string()
    .oneOf(['client', 'opportunity'] as const)
    .required(),
  client_id: yup
    .string()
    .nullable()
    .when('associationType', {
      is: 'client',
      then: (schema) => schema.required('Debes seleccionar un cliente'),
      otherwise: (schema) => schema.notRequired(),
    }),
  opportunity_id: yup
    .string()
    .nullable()
    .when('associationType', {
      is: 'opportunity',
      then: (schema) => schema.required('Debes seleccionar una oportunidad'),
      otherwise: (schema) => schema.notRequired(),
    }),
  fecha: yup
    .string()
    .trim()
    .required('La fecha del gasto es obligatoria'),
  monto: yup
    .number()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? NaN : val))
    .typeError('El monto debe ser un número válido')
    .required('El monto es obligatorio')
    .moreThan(0, 'El monto debe ser mayor a $0.00')
    .max(999999999.99, 'El monto excede el límite permitido')
    .test(
      'max-decimals',
      'El monto puede tener como máximo 2 decimales',
      hasAtMostTwoDecimals
    ),
  concepto: yup
    .string()
    .trim()
    .required('El concepto del gasto es obligatorio')
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(250, 'El concepto no puede exceder los 250 caracteres'),
});

export interface ExpenseFormValues {
  associationType: 'client' | 'opportunity';
  client_id: string | null;
  opportunity_id: string | null;
  fecha: string;
  monto: number | string;
  concepto: string;
}
