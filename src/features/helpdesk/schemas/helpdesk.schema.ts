import * as yup from 'yup';
import {
  emptyStringToNull,
  optionalEmailField,
  optionalPhoneField,
} from '@shared/utils/yupValidation';

export const supportRegisterValidationSchema = yup.object().shape({
  contactName: yup
    .string()
    .trim()
    .required('El nombre completo es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder los 80 caracteres'),
  contactEmail: yup
    .string()
    .trim()
    .required('El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido')
    .max(100, 'El correo no puede exceder los 100 caracteres'),
  contactPhone: optionalPhoneField(25),
  companyName: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .max(120, 'La empresa no puede exceder los 120 caracteres'),
  ticketTitle: yup
    .string()
    .trim()
    .required('El título de incidencia es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede exceder los 150 caracteres'),
  incidenceType: yup
    .string()
    .trim()
    .required('Selecciona un tipo de incidencia'),
  ticketDescription: yup
    .string()
    .trim()
    .required('La descripción del problema es obligatoria')
    .min(10, 'Describe la incidencia con al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder los 2000 caracteres'),
});

export type SupportRegisterFormValues = yup.InferType<typeof supportRegisterValidationSchema>;

export const supportQueryValidationSchema = yup.object().shape({
  queryValue: yup
    .string()
    .trim()
    .required('Ingresa un correo electrónico o número de ticket')
    .max(100, 'La consulta no puede exceder los 100 caracteres')
    .test(
      'valid-email-or-ticket',
      'Ingresa un correo electrónico válido o un número de ticket',
      (val) => {
        if (!val) return true;
        if (val.includes('@')) {
          return yup.string().email().isValidSync(val);
        }
        return val.replace(/#/g, '').trim().length >= 1;
      }
    ),
});

export type SupportQueryFormValues = yup.InferType<typeof supportQueryValidationSchema>;

export const ticketDetailValidationSchema = yup.object().shape({
  strtitle: yup
    .string()
    .trim()
    .required('El asunto del ticket es obligatorio')
    .min(3, 'El asunto debe tener al menos 3 caracteres')
    .max(150, 'El asunto no puede exceder los 150 caracteres'),
  description: yup
    .string()
    .trim()
    .required('La descripción del problema es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(2000, 'La descripción no puede exceder los 2000 caracteres'),
  tipo_incidencia: yup
    .string()
    .trim()
    .required('El tipo de incidencia es obligatorio'),
  contactName: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .max(80, 'El nombre de contacto no puede exceder los 80 caracteres'),
  contactEmail: optionalEmailField(100),
  contactPhone: optionalPhoneField(25),
  isResolvedStage: yup.boolean().default(false),
  notas_resolucion: yup
    .string()
    .nullable()
    .when('isResolvedStage', {
      is: true,
      then: (schema) =>
        schema
          .transform((val) => (typeof val === 'string' ? val.trim() : val))
          .required('Las notas de resolución son obligatorias para poder resolver el ticket')
          .min(5, 'Las notas de resolución deben tener al menos 5 caracteres')
          .max(1500, 'Las notas no pueden exceder los 1500 caracteres'),
      otherwise: (schema) =>
        schema
          .notRequired()
          .transform(emptyStringToNull)
          .max(1500, 'Las notas no pueden exceder los 1500 caracteres'),
    }),
});

export interface TicketDetailFormValues {
  strtitle: string;
  description: string;
  tipo_incidencia: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isResolvedStage: boolean;
  notas_resolucion: string;
}

export const ticketResolutionValidationSchema = yup.object().shape({
  notas_resolucion: yup
    .string()
    .trim()
    .required('Las notas de resolución son obligatorias')
    .min(5, 'Describe la resolución con al menos 5 caracteres')
    .max(1500, 'Las notas no pueden exceder los 1500 caracteres'),
});

export const helpdeskStageValidationSchema = yup.object().shape({
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
  stage_type: yup.number().oneOf([0, 1]).default(0),
});

export const helpdeskSettingsValidationSchema = yup.object().shape({
  helpdeskName: yup
    .string()
    .trim()
    .required('El nombre de la mesa de ayuda es obligatorio')
    .min(2, 'El nombre de la mesa de ayuda debe tener al menos 2 caracteres')
    .max(80, 'El nombre de la mesa de ayuda no puede exceder los 80 caracteres'),
  helpdeskDescription: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .max(250, 'La descripción no puede exceder los 250 caracteres'),
  stages: yup
    .array()
    .of(helpdeskStageValidationSchema)
    .min(1, 'Debe existir al menos una etapa'),
});
