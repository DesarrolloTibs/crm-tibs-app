import * as yup from 'yup';
import type { Activity, TypeActivity, ActivityReminder } from '@core/models/Activity';
import type { Opportunity } from '@core/models/Opportunity';
import type { Client } from '@core/models/Client';
import type { Company } from '@core/models/Company';
import type { User } from '@core/models/User';

export type { Activity, TypeActivity, ActivityReminder, Opportunity, Client, Company, User };

export interface ActivityFormData {
  activity: string;
  typeActivityId: number | null;
  date: string;
  linkType: 'company' | 'contact';
  companyId: string | null;
  contactIds: string[];
  clientId: string | null;
  opportunityId: string | null;
  flaghistory: boolean;
  reminderEnabled: boolean;
  reminderTitle: string;
  reminderDate: string;
}

/**
 * Esquema de validación declarativo con Yup para alta y edición de actividades
 */
export const activityValidationSchema = yup.object().shape({
  activity: yup
    .string()
    .trim()
    .required('La descripción de la actividad es obligatoria')
    .min(3, 'La actividad debe contener al menos 3 caracteres')
    .max(300, 'La actividad no puede exceder 300 caracteres'),
  typeActivityId: yup
    .number()
    .nullable()
    .test('required-type', 'Debes seleccionar un tipo de actividad', (val) => val !== null && val !== undefined),
  date: yup
    .string()
    .trim()
    .required('La fecha y hora de la actividad es obligatoria'),
  linkType: yup
    .string()
    .oneOf(['company', 'contact'] as const)
    .default('company'),
  companyId: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  contactIds: yup
    .array()
    .of(yup.string().required())
    .default([]),
  clientId: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  opportunityId: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  flaghistory: yup
    .boolean()
    .default(false),
  reminderEnabled: yup
    .boolean()
    .default(false),
  reminderTitle: yup
    .string()
    .when('reminderEnabled', {
      is: true,
      then: (schema) =>
        schema
          .trim()
          .required('El título del recordatorio es obligatorio')
          .max(100, 'El título no puede exceder 100 caracteres'),
      otherwise: (schema) => schema.notRequired(),
    }),
  reminderDate: yup
    .string()
    .when('reminderEnabled', {
      is: true,
      then: (schema) => schema.required('La fecha y hora del recordatorio es obligatoria'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export type ActivityViewMode = 'calendar' | 'table';

export type ActivityDateFilter = 'all' | 'today' | 'upcoming' | 'past';

export interface ActivityFiltersState {
  search: string;
  userId: string | 'all';
  typeActivityId: string | 'all';
  date: string;
}

export interface ActivityStats {
  total: number;
  today: number;
  upcoming: number;
  withReminder: number;
  externalSynced: number;
}
