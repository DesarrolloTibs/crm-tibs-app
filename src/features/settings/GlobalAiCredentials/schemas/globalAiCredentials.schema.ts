import * as yup from 'yup';

export type LlmProviderId = 'gemini' | 'openai' | 'watsonx';

export type LlmStatusFilter = 'all' | 'configured' | 'pending';

/**
 * Contrato de configuración global de IA persistido en backend (/api/conversations/ai-config)
 */
export interface GlobalAiConfig {
  modelProvider?: LlmProviderId | string;
  modelName?: string;
  maxNewTokens?: number;

  // Credenciales Gemini
  geminiApiKey?: string;

  // Credenciales OpenAI / Azure
  openaiApiKey?: string;
  openaiEndpoint?: string;
  openaiApiVersion?: string;
  openaiEmbeddingModel?: string;

  // Credenciales IBM WatsonX
  watsonxApiKey?: string;
  watsonxProjectId?: string;
  watsonxRegion?: string;
  watsonxEmbeddingModel?: string;
}

/**
 * Representación de cada proveedor en la tabla TanStack
 */
export interface LlmProviderItem {
  id: LlmProviderId;
  name: string;
  vendor: string;
  description: string;
  isDefault: boolean;
  hasCredentials: boolean;
  modelName: string;
  keyMasked?: string;
  embeddingModel?: string;
  endpoint?: string;
  region?: string;
  projectId?: string;
  apiVersion?: string;
}

/**
 * Datos del formulario modal para editar credenciales de un proveedor
 */
export interface GlobalAiCredentialsFormData {
  providerId: LlmProviderId;
  modelName: string;
  isDefault: boolean;

  // Gemini
  geminiApiKey?: string;

  // OpenAI
  openaiApiKey?: string;
  openaiEndpoint?: string;
  openaiApiVersion?: string;
  openaiEmbeddingModel?: string;

  // WatsonX
  watsonxApiKey?: string;
  watsonxProjectId?: string;
  watsonxRegion?: string;
  watsonxEmbeddingModel?: string;
}

/**
 * Esquema de validación Yup para credenciales y parámetros de IA
 */
export const globalAiCredentialsValidationSchema = yup.object().shape({
  modelName: yup
    .string()
    .trim()
    .required('El nombre del modelo de inferencia es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(120, 'No puede exceder los 120 caracteres'),

  geminiApiKey: yup.string().when('providerId', {
    is: 'gemini',
    then: (schema) => schema.trim().required('La API Key de Google Gemini es obligatoria'),
    otherwise: (schema) => schema.optional(),
  }),

  openaiApiKey: yup.string().when('providerId', {
    is: 'openai',
    then: (schema) => schema.trim().required('La API Key de OpenAI / Azure es obligatoria'),
    otherwise: (schema) => schema.optional(),
  }),

  openaiEndpoint: yup.string().when('providerId', {
    is: 'openai',
    then: (schema) =>
      schema
        .trim()
        .test('is-valid-url-or-empty', 'El endpoint debe tener formato URL válido (ej. https://...)', (val) => {
          if (!val) return true;
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        }),
    otherwise: (schema) => schema.optional(),
  }),

  watsonxApiKey: yup.string().when('providerId', {
    is: 'watsonx',
    then: (schema) => schema.trim().required('La API Key de IBM Cloud (WatsonX) es obligatoria'),
    otherwise: (schema) => schema.optional(),
  }),

  watsonxProjectId: yup.string().when('providerId', {
    is: 'watsonx',
    then: (schema) => schema.trim().required('El Project ID de WatsonX es obligatorio'),
    otherwise: (schema) => schema.optional(),
  }),

  watsonxRegion: yup.string().when('providerId', {
    is: 'watsonx',
    then: (schema) => schema.trim().required('La región o endpoint de WatsonX es obligatoria'),
    otherwise: (schema) => schema.optional(),
  }),
});

/**
 * Esquema Yup para los parámetros globales del motor (inferencia rápida)
 */
export const globalAiParametersValidationSchema = yup.object().shape({
  modelProvider: yup
    .string()
    .oneOf(['gemini', 'openai', 'watsonx'], 'Selecciona un proveedor válido')
    .required('El proveedor principal es obligatorio'),
  modelName: yup
    .string()
    .trim()
    .required('El nombre del modelo es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres'),
  maxNewTokens: yup
    .number()
    .typeError('Los tokens máximos deben ser un número')
    .required('El límite de tokens es obligatorio')
    .min(100, 'El límite mínimo es de 100 tokens')
    .max(32768, 'El límite máximo recomendado es de 32,768 tokens'),
});

export interface GlobalAiParametersFormData {
  modelProvider: LlmProviderId;
  modelName: string;
  maxNewTokens: number;
}

export interface GlobalAiFilterState {
  search: string;
  status: LlmStatusFilter;
}

export interface GlobalAiStats {
  totalProviders: number;
  configuredProviders: number;
  activeProviderId: LlmProviderId;
  activeProviderName: string;
  activeModelName: string;
  maxNewTokens: number;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
