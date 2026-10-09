import * as yup from 'yup';
import type { DashboardIndicator } from '../../../../services/reportsService';

export type { DashboardIndicator };

export type IndicatorModule = 'commercial' | 'support';
export type IndicatorType = 'count' | 'sum';
export type IndicatorColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';
export type ChartKey = 'abiertas' | 'ventas' | 'tickets' | 'cerrados' | 'cancelados';

export interface ChartTab {
  key: ChartKey;
  label: string;
  activeClass: string;
}

/**
 * Esquema de validación Yup para creación y edición de indicadores KPI del dashboard
 */
export const dashboardIndicatorValidationSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required('El título del indicador es obligatorio')
    .min(2, 'El título debe contener al menos 2 caracteres')
    .max(60, 'El título no puede exceder los 60 caracteres'),
  type: yup
    .string()
    .oneOf(['count', 'sum'], 'Tipo de indicador no válido')
    .default('count')
    .required('El tipo de cálculo es obligatorio'),
  color: yup
    .string()
    .oneOf(['blue', 'green', 'purple', 'orange', 'red'], 'Color no válido')
    .default('blue')
    .required('El color de la tarjeta es obligatorio'),
  stage_ids: yup
    .array()
    .of(yup.string().required())
    .default([]),
});

export type DashboardIndicatorFormData = yup.InferType<typeof dashboardIndicatorValidationSchema>;

export type IndicatorTypeFilter = 'all' | 'count' | 'sum';

export interface DashboardIndicatorFilterState {
  search: string;
  type: IndicatorTypeFilter;
  color: 'all' | string;
}

export interface DashboardIndicatorStats {
  total: number;
  countCards: number;
  sumCards: number;
  totalStagesLinked: number;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
