import * as yup from 'yup';
import type {
  OpportunityLabel,
  OpportunityFieldMeta,
  OpportunityLabelFormData,
} from '../schemas/opportunityLabels.schema';
import { createOpportunityLabelValidationSchema } from '../schemas/opportunityLabels.schema';

export const getFieldDescription = (key: string | undefined): string => {
  switch (key) {
    case 'linea_negocio':
      return 'Define el sector o línea de negocio de la oportunidad comercial.';
    case 'tipo_entrega':
      return 'Define el tipo o modalidad de entrega y etiqueta el monto de servicios.';
    case 'licenciamiento':
      return 'Define la plataforma tecnológica y etiqueta el monto de licenciamiento.';
    default:
      return 'Campo personalizable en los detalles de oportunidades.';
  }
};

export const getFieldBadge = (key: string | undefined): string => {
  switch (key) {
    case 'linea_negocio':
      return 'Clasificación';
    case 'tipo_entrega':
      return 'Servicios y Montos';
    case 'licenciamiento':
      return 'Licencias y Montos';
    default:
      return 'General';
  }
};

export const getFieldDefaultName = (key: string | undefined): string => {
  switch (key) {
    case 'linea_negocio':
      return 'Línea de Negocio';
    case 'tipo_entrega':
      return 'Tipo de Entrega';
    case 'licenciamiento':
      return 'Licenciamiento';
    default:
      return 'Campo';
  }
};

export const getFieldMeta = (key?: string): OpportunityFieldMeta => {
  return {
    key: key || '',
    defaultName: getFieldDefaultName(key),
    categoryBadge: getFieldBadge(key),
    categoryVariant: key === 'tipo_entrega' ? 'success' : key === 'licenciamiento' ? 'info' : 'primary',
    impactDescription: getFieldDescription(key),
    formSection: key === 'linea_negocio' ? 'Clasificación' : 'Detalles Financieros & Clasificación',
  };
};

/**
 * Valida si el nombre ya está duplicado con otro campo (excluyendo el que se está editando)
 */
export const isNameDuplicate = (
  name: string,
  currentLabelId: string | undefined,
  allLabels: OpportunityLabel[]
): boolean => {
  const cleanName = name.trim().toLowerCase();
  if (!cleanName) return false;
  return allLabels.some(
    (l) => l.id !== currentLabelId && l.strname?.trim().toLowerCase() === cleanName
  );
};

/**
 * Valida de forma asíncrona un objeto de formulario contra el esquema Yup dinámico
 */
export const validateOpportunityLabelForm = async (
  values: Partial<OpportunityLabelFormData>,
  existingLabels: OpportunityLabel[],
  currentLabelId?: string
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  const schema = createOpportunityLabelValidationSchema(existingLabels, currentLabelId);

  try {
    await schema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errors[error.path]) {
          errors[error.path] = error.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Error de validación inesperado' } };
  }
};
