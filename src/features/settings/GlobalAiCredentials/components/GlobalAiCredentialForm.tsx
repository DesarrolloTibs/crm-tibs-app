import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  Server,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Shield,
} from 'lucide-react';
import Button from '../../../../components/shared/Button';
import FormField from '../../../../components/shared/FormField';
import type {
  LlmProviderItem,
  GlobalAiConfig,
  GlobalAiCredentialsFormData,
} from '../schemas/globalAiCredentials.schema';
import {
  PROVIDER_CATALOG,
  validateGlobalAiForm,
} from '../utils/globalAiCredentials.helpers';

interface GlobalAiCredentialFormProps {
  provider: LlmProviderItem;
  config: GlobalAiConfig;
  onSubmit: (formData: GlobalAiCredentialsFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export const GlobalAiCredentialForm: React.FC<GlobalAiCredentialFormProps> = ({
  provider,
  config,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const [showSecret, setShowSecret] = useState<boolean>(false);

  const [formData, setFormData] = useState<GlobalAiCredentialsFormData>({
    providerId: provider.id,
    modelName: provider.modelName || PROVIDER_CATALOG[provider.id].defaultModel,
    isDefault: provider.isDefault,

    // Gemini
    geminiApiKey: config.geminiApiKey || '',

    // OpenAI
    openaiApiKey: config.openaiApiKey || '',
    openaiEndpoint: config.openaiEndpoint || '',
    openaiApiVersion: config.openaiApiVersion || '',
    openaiEmbeddingModel: config.openaiEmbeddingModel || 'text-embedding-ada-002',

    // WatsonX
    watsonxApiKey: config.watsonxApiKey || '',
    watsonxProjectId: config.watsonxProjectId || '',
    watsonxRegion: config.watsonxRegion || 'us-south',
    watsonxEmbeddingModel: config.watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      providerId: provider.id,
      modelName: provider.modelName || PROVIDER_CATALOG[provider.id].defaultModel,
      isDefault: provider.isDefault,
      geminiApiKey: config.geminiApiKey || '',
      openaiApiKey: config.openaiApiKey || '',
      openaiEndpoint: config.openaiEndpoint || '',
      openaiApiVersion: config.openaiApiVersion || '',
      openaiEmbeddingModel: config.openaiEmbeddingModel || 'text-embedding-ada-002',
      watsonxApiKey: config.watsonxApiKey || '',
      watsonxProjectId: config.watsonxProjectId || '',
      watsonxRegion: config.watsonxRegion || 'us-south',
      watsonxEmbeddingModel: config.watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr',
    });
    setErrors({});
    setTouched({});
  }, [provider, config]);

  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleBlurField = async (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const result = await validateGlobalAiForm(formData);
    if (!result.isValid && result.errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: result.errors[fieldName] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await validateGlobalAiForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      const allTouched: Record<string, boolean> = {};
      Object.keys(result.errors).forEach((k) => {
        allTouched[k] = true;
      });
      setTouched(allTouched);
      return;
    }

    await onSubmit(formData);
  };

  const catalogMeta = PROVIDER_CATALOG[provider.id];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Provider Info Banner */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
          {provider.id === 'gemini' && <Sparkles size={20} />}
          {provider.id === 'openai' && <Cpu size={20} />}
          {provider.id === 'watsonx' && <Server size={20} />}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-slate-800 text-sm">{provider.name}</h5>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              {provider.vendor}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {catalogMeta.description}
          </p>
        </div>
      </div>

      {/* Modelo de Inferencia Principal */}
      <div className="space-y-2">
        <FormField
          id="provider-model-name"
          label={
            provider.id === 'openai' && formData.openaiEndpoint
              ? 'Nombre del Despliegue (Azure Deployment Name)'
              : 'Nombre del Modelo de Inferencia'
          }
          name="modelName"
          value={formData.modelName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, modelName: e.target.value }));
            clearFieldError('modelName');
          }}
          onBlur={() => handleBlurField('modelName')}
          placeholder={`Ej. ${catalogMeta.defaultModel}`}
          error={touched.modelName ? errors.modelName : undefined}
          className="!py-3 !rounded-xl"
        />

        {/* Sugerencias de Modelos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Sugerencias:</span>
          {catalogMeta.recommendedModels.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, modelName: m }));
                clearFieldError('modelName');
              }}
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                formData.modelName === m
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* CAMPOS ESPECÍFICOS: GOOGLE GEMINI */}
      {provider.id === 'gemini' && (
        <div className="space-y-4">
          <div className="relative">
            <FormField
              id="gemini-api-key"
              label="Google Gemini API Key"
              name="geminiApiKey"
              type={showSecret ? 'text' : 'password'}
              value={formData.geminiApiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, geminiApiKey: e.target.value }));
                clearFieldError('geminiApiKey');
              }}
              onBlur={() => handleBlurField('geminiApiKey')}
              placeholder="AIzaSy..."
              error={touched.geminiApiKey ? errors.geminiApiKey : undefined}
              className="!py-3 !pr-10 !rounded-xl font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowSecret((prev) => !prev)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 p-1"
              title={showSecret ? 'Ocultar llave' : 'Mostrar llave'}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-600 shrink-0" />
              <span>Obtén tu API key directamente desde Google AI Studio.</span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 shrink-0"
            >
              <span>Abrir Consola</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* CAMPOS ESPECÍFICOS: OPENAI / AZURE */}
      {provider.id === 'openai' && (
        <div className="space-y-4">
          <div className="relative">
            <FormField
              id="openai-api-key"
              label="OpenAI / Azure API Key"
              name="openaiApiKey"
              type={showSecret ? 'text' : 'password'}
              value={formData.openaiApiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, openaiApiKey: e.target.value }));
                clearFieldError('openaiApiKey');
              }}
              onBlur={() => handleBlurField('openaiApiKey')}
              placeholder="sk-proj-..."
              error={touched.openaiApiKey ? errors.openaiApiKey : undefined}
              className="!py-3 !pr-10 !rounded-xl font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowSecret((prev) => !prev)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 p-1"
              title={showSecret ? 'Ocultar llave' : 'Mostrar llave'}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="space-y-1">
            <FormField
              id="openai-endpoint"
              label="Endpoint de Azure OpenAI (Opcional si usas OpenAI directo)"
              name="openaiEndpoint"
              value={formData.openaiEndpoint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, openaiEndpoint: e.target.value }));
                clearFieldError('openaiEndpoint');
              }}
              onBlur={() => handleBlurField('openaiEndpoint')}
              placeholder="https://tu-recurso.cognitiveservices.azure.com/"
              error={touched.openaiEndpoint ? errors.openaiEndpoint : undefined}
              className="!py-3 !rounded-xl"
            />
            <p className="text-[11px] text-slate-400 ml-1">
              Déjalo en blanco si utilizas la API estándar de OpenAI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="openai-api-version"
              label="Versión de API (Azure)"
              name="openaiApiVersion"
              value={formData.openaiApiVersion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, openaiApiVersion: e.target.value }));
              }}
              placeholder="2024-12-01-preview"
              className="!py-3 !rounded-xl"
            />

            <FormField
              id="openai-embedding-model"
              label="Modelo / Despliegue de Embeddings"
              name="openaiEmbeddingModel"
              value={formData.openaiEmbeddingModel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, openaiEmbeddingModel: e.target.value }));
              }}
              placeholder="text-embedding-ada-002"
              className="!py-3 !rounded-xl font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* CAMPOS ESPECÍFICOS: IBM WATSONX */}
      {provider.id === 'watsonx' && (
        <div className="space-y-4">
          <div className="relative">
            <FormField
              id="watsonx-api-key"
              label="IBM Cloud API Key (WatsonX)"
              name="watsonxApiKey"
              type={showSecret ? 'text' : 'password'}
              value={formData.watsonxApiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, watsonxApiKey: e.target.value }));
                clearFieldError('watsonxApiKey');
              }}
              onBlur={() => handleBlurField('watsonxApiKey')}
              placeholder="Ingrese su API Key de IBM Cloud"
              error={touched.watsonxApiKey ? errors.watsonxApiKey : undefined}
              className="!py-3 !pr-10 !rounded-xl font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowSecret((prev) => !prev)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 p-1"
              title={showSecret ? 'Ocultar llave' : 'Mostrar llave'}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="watsonx-project-id"
              label="Project ID de WatsonX"
              name="watsonxProjectId"
              value={formData.watsonxProjectId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, watsonxProjectId: e.target.value }));
                clearFieldError('watsonxProjectId');
              }}
              onBlur={() => handleBlurField('watsonxProjectId')}
              placeholder="ID alfanumérico del proyecto"
              error={touched.watsonxProjectId ? errors.watsonxProjectId : undefined}
              className="!py-3 !rounded-xl font-mono text-xs"
            />

            <FormField
              id="watsonx-region"
              label="Región / Endpoint de WatsonX"
              name="watsonxRegion"
              value={formData.watsonxRegion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, watsonxRegion: e.target.value }));
                clearFieldError('watsonxRegion');
              }}
              onBlur={() => handleBlurField('watsonxRegion')}
              placeholder="us-south o URL completa"
              error={touched.watsonxRegion ? errors.watsonxRegion : undefined}
              className="!py-3 !rounded-xl"
            />
          </div>

          <FormField
            id="watsonx-embedding-model"
            label="Modelo de Embeddings (WatsonX)"
            name="watsonxEmbeddingModel"
            value={formData.watsonxEmbeddingModel}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFormData((prev) => ({ ...prev, watsonxEmbeddingModel: e.target.value }));
            }}
            placeholder="ibm/slate-125m-english-rtrvr"
            className="!py-3 !rounded-xl font-mono text-xs"
          />
        </div>
      )}

      {/* Switch: Activar como motor global de la plataforma */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <label
            htmlFor="set-default-toggle"
            className="text-xs font-bold text-slate-800 cursor-pointer select-none block"
          >
            Establecer como motor LLM activo en todo el CRM
          </label>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Si se activa, todas las peticiones del Agente IA y de los canales omnicanal en todos los tenants utilizarán este motor para procesar inferencias.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
          <input
            id="set-default-toggle"
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="!py-2.5 !px-4 text-xs font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="success"
          disabled={submitting}
          className="!py-2.5 !px-5 text-xs font-bold shadow-xs gap-1.5"
        >
          <Check size={15} />
          <span>{submitting ? 'Guardando Credenciales...' : 'Guardar Credenciales'}</span>
        </Button>
      </div>
    </form>
  );
};

export default GlobalAiCredentialForm;
