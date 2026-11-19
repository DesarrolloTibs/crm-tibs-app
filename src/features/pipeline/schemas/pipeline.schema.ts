import * as yup from 'yup';
import { emptyStringToNull } from '@shared/utils/yupValidation';

export const opportunityValidationSchema = yup.object().shape({
  nombre_proyecto: yup
    .string()
    .trim()
    .required('El nombre del proyecto es obligatorio')
    .min(3, 'El nombre del proyecto debe tener al menos 3 caracteres')
    .max(150, 'El nombre del proyecto no puede exceder los 150 caracteres'),
  description: yup
    .string()
    .trim()
    .required('La descripción de la oportunidad es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(2000, 'La descripción no puede exceder los 2000 caracteres'),
  linkType: yup
    .string()
    .oneOf(['company', 'contact'] as const)
    .required(),
  companyId: yup
    .string()
    .nullable()
    .transform(emptyStringToNull)
    .when('linkType', {
      is: 'company',
      then: (schema) => schema.required('Debes seleccionar una empresa'),
      otherwise: (schema) => schema.notRequired(),
    }),
  cliente_id: yup
    .string()
    .nullable()
    .transform(emptyStringToNull)
    .when('linkType', {
      is: 'contact',
      then: (schema) => schema.required('Debes seleccionar un contacto'),
      otherwise: (schema) => schema.notRequired(),
    }),
  ejecutivo_id: yup
    .string()
    .trim()
    .required('Debes asignar un ejecutivo responsable'),
  monto_licenciamiento: yup
    .number()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? 0 : val))
    .typeError('El monto debe ser un número válido')
    .min(0, 'El monto no puede ser negativo')
    .max(999999999.99, 'El monto excede el límite permitido'),
  monto_servicios: yup
    .number()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? 0 : val))
    .typeError('El monto debe ser un número válido')
    .min(0, 'El monto no puede ser negativo')
    .max(999999999.99, 'El monto excede el límite permitido'),
  moneda: yup
    .string()
    .oneOf(['USD', 'MXN'] as const, 'Selecciona una moneda válida')
    .required('La moneda es obligatoria'),
  tipoCambio: yup
    .number()
    .nullable()
    .when('moneda', {
      is: 'USD',
      then: (schema) =>
        schema
          .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? NaN : val))
          .typeError('El tipo de cambio debe ser un número válido')
          .required('El tipo de cambio es obligatorio para USD')
          .moreThan(0, 'El tipo de cambio debe ser mayor a 0'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export interface OpportunityFormValidationValues {
  nombre_proyecto: string;
  description: string;
  linkType: 'company' | 'contact';
  companyId: string | null;
  cliente_id: string | null;
  ejecutivo_id: string;
  monto_licenciamiento: number | string;
  monto_servicios: number | string;
  moneda: string;
  tipoCambio?: number | string | null;
}

export const pipelineStageValidationSchema = yup.object().shape({
  strname: yup
    .string()
    .trim()
    .required('El nombre de la etapa es obligatorio')
    .min(2, 'El nombre de la etapa debe tener al menos 2 caracteres')
    .max(60, 'El nombre de la etapa no puede exceder los 60 caracteres'),
  intmaxdays: yup
    .number()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? null : val))
    .nullable()
    .typeError('Los días límite deben ser un número entero')
    .integer('Los días límite deben ser un número entero')
    .min(0, 'Los días límite no pueden ser negativos')
    .max(365, 'Los días límite no pueden exceder 365 días'),
  stage_type: yup.number().oneOf([0, 1, 2]).default(0),
});

export const pipelineSettingsValidationSchema = yup.object().shape({
  pipelineName: yup
    .string()
    .trim()
    .required('El nombre del pipeline es obligatorio')
    .min(2, 'El nombre del pipeline debe tener al menos 2 caracteres')
    .max(80, 'El nombre del pipeline no puede exceder los 80 caracteres'),
  pipelineDescription: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .max(250, 'La descripción no puede exceder los 250 caracteres'),
  stages: yup
    .array()
    .of(pipelineStageValidationSchema)
    .min(1, 'Debe existir al menos una etapa'),
});

export const reminderValidationSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required('El título del recordatorio es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder los 120 caracteres'),
  date: yup
    .string()
    .trim()
    .required('La fecha y hora del recordatorio son obligatorias'),
});

export const interactionValidationSchema = yup.object().shape({
  comment: yup
    .string()
    .trim()
    .required('El comentario es obligatorio')
    .min(2, 'El comentario debe tener al menos 2 caracteres')
    .max(1500, 'El comentario no puede exceder los 1500 caracteres'),
});
