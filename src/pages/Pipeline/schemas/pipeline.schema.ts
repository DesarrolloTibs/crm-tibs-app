import * as yup from 'yup';
import type { Opportunity, OpportunityFile, Stage, CurrencyType } from '../../../core/models/Opportunity';
import { Currency } from '../../../core/models/Opportunity';
import type { OpportunityCatalogOption } from '../../../core/models/OpportunityCatalog';
import type { OpportunityLabel } from '../../../core/models/OpportunityLabel';
import type { Client } from '../../../core/models/Client';
import type { Company } from '../../../core/models/Company';
import type { User } from '../../../core/models/User';
import type { Product } from '../../../core/models/Product';

export type {
  Opportunity,
  OpportunityFile,
  Stage,
  CurrencyType,
  OpportunityCatalogOption,
  OpportunityLabel,
  Client,
  Company,
  User,
  Product,
};
export { Currency };

export type PipelineViewMode = 'kanban' | 'list';

export interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

export interface PipelineFiltersState {
  searchTerm: string;
  contactFilter: string;
  executiveFilter: string;
  statusFilter: string;
  archivedFilter: 'active' | 'archived' | 'all';
  priorityFilter: number | null;
  startDate: string;
  endDate: string;
  isCustomFilterActive: boolean;
  customRules: FilterRule[];
  matchType: 'any' | 'all';
  includeArchived: boolean;
}

export interface PipelineStats {
  totalOpportunities: number;
  totalValueMXN: number;
  totalValueUSD: number;
  wonCount: number;
  wonValueMXN: number;
  wonValueUSD: number;
  activeCount: number;
  lostCount: number;
}

/**
 * Esquema Yup para validación declarativa de Oportunidades comerciales
 */
export const opportunityValidationSchema = yup.object().shape({
  nombre_proyecto: yup
    .string()
    .trim()
    .required('El nombre del proyecto es obligatorio')
    .min(3, 'El nombre debe contener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  description: yup
    .string()
    .trim()
    .required('La descripción del proyecto es obligatoria'),
  linkType: yup
    .string()
    .oneOf(['company', 'contact'] as const)
    .default('company'),
  companyId: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .when('linkType', {
      is: 'company',
      then: (schema) => schema.required('Por favor, selecciona una empresa vinculada'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  cliente_id: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .when('linkType', {
      is: 'contact',
      then: (schema) => schema.required('Por favor, selecciona un contacto vinculado'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  ejecutivo_id: yup
    .string()
    .trim()
    .required('Debes asignar un ejecutivo comercial a cargo'),
  moneda: yup
    .string()
    .oneOf(['MXN', 'USD'] as const)
    .default('MXN'),
  tipoCambio: yup
    .number()
    .nullable()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? null : val))
    .when('moneda', {
      is: 'USD',
      then: (schema) =>
        schema
          .required('El tipo de cambio es requerido para cotizaciones en USD')
          .positive('El tipo de cambio debe ser mayor a 0'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  monto_licenciamiento: yup
    .number()
    .nullable()
    .transform((val, orig) => (orig === '' || isNaN(val) ? 0 : val))
    .min(0, 'El monto no puede ser negativo')
    .default(0),
  monto_servicios: yup
    .number()
    .nullable()
    .transform((val, orig) => (orig === '' || isNaN(val) ? 0 : val))
    .min(0, 'El monto no puede ser negativo')
    .default(0),
  monto_total: yup
    .number()
    .nullable()
    .transform((val, orig) => (orig === '' || isNaN(val) ? 0 : val))
    .min(0, 'El monto total no puede ser negativo')
    .default(0),
  priority: yup
    .number()
    .min(0)
    .max(3)
    .default(1),
  stage_id: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  linea_negocio_id: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .test('required-linea', 'Debes seleccionar una línea de negocio', (val) => Boolean(val && val.trim())),
  tipo_entrega_id: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .test('required-entrega', 'Debes seleccionar un tipo de entrega', (val) => Boolean(val && val.trim())),
  licenciamiento_id: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  estimated_closure_date: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  createdAt: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
  empresa: yup
    .string()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr)),
});

export type OpportunityFormData = yup.InferType<typeof opportunityValidationSchema> & {
  id?: string;
  contactIds?: string[];
  productIds?: string[];
};

/**
 * Esquema Yup para validación de Etapas del Pipeline
 */
export const stageValidationSchema = yup.object().shape({
  strname: yup
    .string()
    .trim()
    .required('El nombre de la etapa es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  intmaxdays: yup
    .number()
    .nullable()
    .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? null : val))
    .min(1, 'El límite de días debe ser al menos 1')
    .notRequired(),
  stage_type: yup
    .number()
    .oneOf([0, 1, 2] as const)
    .default(0),
  blnstatus: yup
    .boolean()
    .default(true),
});
