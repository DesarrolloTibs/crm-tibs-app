import * as yup from 'yup';
import type { OpportunityLabel } from '../../../../core/models/OpportunityLabel';

export type { OpportunityLabel };

export type OpportunityFieldKey = 'linea_negocio' | 'tipo_entrega' | 'licenciamiento' | string;

export interface OpportunityFieldMeta {
  key: OpportunityFieldKey;
  defaultName: string;
  categoryBadge: string;
  categoryVariant: 'primary' | 'success' | 'warning' | 'neutral' | 'info';
  impactDescription: string;
  formSection: string;
}

/**
 * Esquema de validación Yup para edición y sincronización de etiquetas de catálogo
 */
export const createOpportunityLabelValidationSchema = (
  existingLabels: OpportunityLabel[],
  currentLabelId?: string
) =>
  yup.object().shape({
    strname: yup
      .string()
      .trim()
      .required('El nombre de la etiqueta no puede estar vacío')
      .min(2, 'El nombre debe contener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder los 100 caracteres')
      .test(
        'unique-name',
        'El nombre de la etiqueta ya está siendo utilizado por otro campo.',
        (value) => {
          if (!value) return true;
          const clean = value.trim().toLowerCase();
          return !existingLabels.some(
            (l) => l.id !== currentLabelId && l.strname?.trim().toLowerCase() === clean
          );
        }
      ),
  });

export interface OpportunityLabelFormData {
  strname: string;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
