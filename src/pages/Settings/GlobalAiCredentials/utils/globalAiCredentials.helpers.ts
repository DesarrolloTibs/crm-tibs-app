import * as yup from 'yup';
import type {
  GlobalAiConfig,
  LlmProviderItem,
  LlmProviderId,
  GlobalAiFilterState,
  GlobalAiStats,
  GlobalAiCredentialsFormData,
  GlobalAiParametersFormData,
} from '../schemas/globalAiCredentials.schema';
import {
  globalAiCredentialsValidationSchema,
  globalAiParametersValidationSchema,
} from '../schemas/globalAiCredentials.schema';

export const PROVIDER_CATALOG: Record<
  LlmProviderId,
  {
    name: string;
    vendor: string;
    description: string;
    defaultModel: string;
    recommendedModels: string[];
    defaultEmbedding?: string;
  }
> = {
  gemini: {
    name: 'Google Gemini',
    vendor: 'Google AI Studio',
    description: 'Modelos multimodales de última generación (Flash & Pro) con alto throughput y ventana de contexto extendida.',
    defaultModel: 'gemini-1.5-flash',
    recommendedModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  },
  openai: {
    name: 'OpenAI GPT / Azure OpenAI',
    vendor: 'Microsoft Azure & OpenAI',
    description: 'Familia GPT-4o e inferencia de alta precisión para razonamiento comercial profundo y embeddings con Ada-002.',
    defaultModel: 'gpt-4o',
    recommendedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultEmbedding: 'text-embedding-ada-002',
  },
  watsonx: {
    name: 'IBM WatsonX',
    vendor: 'IBM Cloud watsonx.ai',
    description: 'Modelos empresariales de código abierto (Llama 3.3, Granite) y embeddings con Slate-125m para soberanía corporativa.',
    defaultModel: 'meta-llama/llama-3-3-70b-instruct',
    recommendedModels: [
      'meta-llama/llama-3-3-70b-instruct',
      'ibm/granite-13b-chat-v2',
      'meta-llama/llama-3-8b-instruct',
    ],
    defaultEmbedding: 'ibm/slate-125m-english-rtrvr',
  },
};

/**
 * Enmascara una llave de API para proteger la seguridad en pantalla
 */
export const maskApiKey = (key?: string): string => {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 6) return '••••••••';
  return `••••••••${trimmed.slice(-4)}`;
};

/**
 * Transforma el objeto global de configuración a filas tabulares TanStack Table
 */
export const buildProviderRows = (config: GlobalAiConfig): LlmProviderItem[] => {
  const activeProvider = (config.modelProvider || 'gemini') as LlmProviderId;

  const providers: LlmProviderId[] = ['gemini', 'openai', 'watsonx'];

  return providers.map((id) => {
    const meta = PROVIDER_CATALOG[id];
    const isDefault = activeProvider === id;

    if (id === 'gemini') {
      const hasKey = Boolean(config.geminiApiKey?.trim());
      return {
        id,
        name: meta.name,
        vendor: meta.vendor,
        description: meta.description,
        isDefault,
        hasCredentials: hasKey,
        modelName: isDefault ? (config.modelName || meta.defaultModel) : meta.defaultModel,
        keyMasked: maskApiKey(config.geminiApiKey),
      };
    }

    if (id === 'openai') {
      const hasKey = Boolean(config.openaiApiKey?.trim());
      return {
        id,
        name: meta.name,
        vendor: meta.vendor,
        description: meta.description,
        isDefault,
        hasCredentials: hasKey,
        modelName: isDefault ? (config.modelName || meta.defaultModel) : meta.defaultModel,
        keyMasked: maskApiKey(config.openaiApiKey),
        endpoint: config.openaiEndpoint,
        apiVersion: config.openaiApiVersion,
        embeddingModel: config.openaiEmbeddingModel || meta.defaultEmbedding,
      };
    }

    // watsonx
    const hasKey = Boolean(
      config.watsonxApiKey?.trim() && config.watsonxProjectId?.trim()
    );
    return {
      id,
      name: meta.name,
      vendor: meta.vendor,
      description: meta.description,
      isDefault,
      hasCredentials: hasKey,
      modelName: isDefault ? (config.modelName || meta.defaultModel) : meta.defaultModel,
      keyMasked: maskApiKey(config.watsonxApiKey),
      projectId: config.watsonxProjectId,
      region: config.watsonxRegion || 'us-south',
      embeddingModel: config.watsonxEmbeddingModel || meta.defaultEmbedding,
    };
  });
};

/**
 * Filtra el listado de proveedores según la búsqueda de texto y estado de credenciales
 */
export const filterProviders = (
  providers: LlmProviderItem[],
  filters: GlobalAiFilterState
): LlmProviderItem[] => {
  const term = filters.search.trim().toLowerCase();

  return providers.filter((item) => {
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.vendor.toLowerCase().includes(term) ||
      item.modelName.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term);

    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'configured' && item.hasCredentials) ||
      (filters.status === 'pending' && !item.hasCredentials);

    return matchesSearch && matchesStatus;
  });
};

/**
 * Calcula las métricas para el banner superior
 */
export const calculateGlobalAiStats = (config: GlobalAiConfig): GlobalAiStats => {
  const activeId = (config.modelProvider || 'gemini') as LlmProviderId;
  const activeMeta = PROVIDER_CATALOG[activeId] || PROVIDER_CATALOG.gemini;

  const rows = buildProviderRows(config);
  const configured = rows.filter((r) => r.hasCredentials).length;

  return {
    totalProviders: rows.length,
    configuredProviders: configured,
    activeProviderId: activeId,
    activeProviderName: activeMeta.name,
    activeModelName: config.modelName || activeMeta.defaultModel,
    maxNewTokens: config.maxNewTokens || 7000,
  };
};

/**
 * Validador asíncrono Yup para formulario de credenciales
 */
export const validateGlobalAiForm = async (
  values: Partial<GlobalAiCredentialsFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await globalAiCredentialsValidationSchema.validate(values, { abortEarly: false });
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
 * Validador asíncrono Yup para parámetros globales
 */
export const validateGlobalAiParameters = async (
  values: Partial<GlobalAiParametersFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await globalAiParametersValidationSchema.validate(values, { abortEarly: false });
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
