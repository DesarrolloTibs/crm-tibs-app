import * as yup from 'yup';
import type {
  TenantPlanInfo,
  TenantFilterState,
  TenantsStats,
  ProvisionTenantFormData,
  TenantGeneralFormData,
  TenantPlanFormData,
  TenantEnqueueFormData,
  GlobalAiProviderMeta,
} from '../schemas/tenants.schema';
import {
  provisionTenantValidationSchema,
  tenantGeneralValidationSchema,
  tenantPlanValidationSchema,
  tenantEnqueueValidationSchema,
} from '../schemas/tenants.schema';

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'with_queue', label: 'Con Cola' },
  { value: 'allow_extra', label: 'Excedente' },
  { value: 'ibm_audio', label: 'Audio IBM' },
] as const;

/**
 * Normaliza la información del proveedor global de IA retornado por GET /api/conversations/ai-config
 */
export const resolveGlobalAiProviderMeta = (
  aiConfig?: { modelProvider?: string } | null
): GlobalAiProviderMeta | null => {
  const raw = String(aiConfig?.modelProvider || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower === 'watsonx' || lower === 'ibm') {
    return {
      provider: 'ibm',
      rawProvider: raw,
      label: 'IBM WatsonX',
      isIbm: true,
      isMultimodal: false,
    };
  }
  if (lower === 'gemini') {
    return {
      provider: 'gemini',
      rawProvider: raw,
      label: 'Google Gemini (Multimodal)',
      isIbm: false,
      isMultimodal: true,
    };
  }
  if (lower === 'openai' || lower === 'azure_openai') {
    return {
      provider: 'azure_openai',
      rawProvider: raw,
      label: 'Azure OpenAI / OpenAI (Multimodal)',
      isIbm: false,
      isMultimodal: true,
    };
  }

  return {
    provider: 'unknown',
    rawProvider: raw,
    label: raw,
    isIbm: false,
    isMultimodal: false,
  };
};

/**
 * Formatea una duración en segundos a texto legible (ej. 125 -> "2m 5s")
 */
export const formatAudioDuration = (seconds?: number | null): string => {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const rem = total % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
};

/**
 * Formatea un tamaño en bytes a B / KB / MB
 */
export const formatAudioBytes = (bytes?: number | null): string => {
  const val = Math.max(0, Number(bytes || 0));
  if (val < 1024) return `${val} B`;
  if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
  return `${(val / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Resuelve etiqueta legible y variante de Badge para canales de auditoría de audio
 */
export const getAudioChannelInfo = (
  channel?: string | null
): {
  kind: 'whatsapp' | 'messenger' | 'instagram' | 'webchat' | 'other';
  label: string;
  variant: 'success' | 'info' | 'purple' | 'indigo' | 'neutral';
} => {
  const normalized = String(channel || '').toLowerCase();
  if (normalized === 'whatsapp') {
    return { kind: 'whatsapp', label: 'WhatsApp', variant: 'success' };
  }
  if (normalized === 'messenger' || normalized === 'facebook') {
    return { kind: 'messenger', label: 'Facebook Messenger', variant: 'info' };
  }
  if (normalized === 'instagram') {
    return { kind: 'instagram', label: 'Instagram Direct', variant: 'purple' };
  }
  if (normalized === 'webchat_interno' || normalized === 'webchat') {
    return {
      kind: 'webchat',
      label: normalized === 'webchat_interno' ? 'WebChat Interno' : 'WebChat',
      variant: 'indigo',
    };
  }
  return { kind: 'other', label: channel || 'Otro', variant: 'neutral' };
};

/**
 * Normaliza y filtra el listado de organizaciones según el término de búsqueda y filtro de estado
 */
export const filterTenants = (
  tenants: TenantPlanInfo[],
  filters: TenantFilterState,
  queueSummaries: Record<number, { total: number; coverageUntil: string | null }>
): TenantPlanInfo[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return tenants.filter((tenant) => {
    // Coincidencia por nombre o esquema
    const matchesSearch =
      !normalizedSearch ||
      tenant.name.toLowerCase().includes(normalizedSearch) ||
      tenant.schema_name.toLowerCase().includes(normalizedSearch) ||
      (tenant.plan?.plan_name && tenant.plan.plan_name.toLowerCase().includes(normalizedSearch));

    // Períodos en cola calculados
    const queuedCount =
      tenant.total_queued_periods ?? queueSummaries[tenant.id]?.total ?? 0;

    // Coincidencia por estado
    let matchesStatus = true;
    if (filters.status === 'active') {
      matchesStatus = tenant.is_active;
    } else if (filters.status === 'inactive') {
      matchesStatus = !tenant.is_active;
    } else if (filters.status === 'with_queue') {
      matchesStatus = queuedCount > 0;
    } else if (filters.status === 'allow_extra') {
      matchesStatus = tenant.allow_extra;
    } else if (filters.status === 'ibm_audio') {
      matchesStatus = Boolean(tenant.ibm_audio_enabled);
    }

    return matchesSearch && matchesStatus;
  });
};

/**
 * Calcula los indicadores KPI para el banner superior
 */
export const calculateTenantStats = (
  tenants: TenantPlanInfo[],
  queueSummaries: Record<number, { total: number }>
): TenantsStats => {
  const total = tenants.length;
  let active = 0;
  let inactive = 0;
  let withQueue = 0;
  let allowExtra = 0;

  tenants.forEach((t) => {
    if (t.is_active) {
      active++;
    } else {
      inactive++;
    }

    const queuedCount = t.total_queued_periods ?? queueSummaries[t.id]?.total ?? 0;
    if (queuedCount > 0) {
      withQueue++;
    }

    if (t.allow_extra) {
      allowExtra++;
    }
  });

  return {
    total,
    active,
    inactive,
    withQueue,
    allowExtra,
  };
};

/**
 * Validador asíncrono para el formulario de provisión
 */
export const validateProvisionForm = async (
  values: Partial<ProvisionTenantFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await provisionTenantValidationSchema.validate(values, { abortEarly: false });
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

/**
 * Validador asíncrono para el formulario de datos generales
 */
export const validateTenantGeneralForm = async (
  values: Partial<TenantGeneralFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await tenantGeneralValidationSchema.validate(values, { abortEarly: false });
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

/**
 * Validador asíncrono para el formulario de cambio de plan
 */
export const validateTenantPlanForm = async (
  values: Partial<TenantPlanFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await tenantPlanValidationSchema.validate(values, { abortEarly: false });
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

/**
 * Validador asíncrono para encolar renovación
 */
export const validateTenantEnqueueForm = async (
  values: Partial<TenantEnqueueFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await tenantEnqueueValidationSchema.validate(values, { abortEarly: false });
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
