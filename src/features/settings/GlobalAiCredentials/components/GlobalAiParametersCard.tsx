import React, { useState, useEffect } from 'react';
import { Sliders, Save, Sparkles } from 'lucide-react';
import Button from '@shared/components/Button';
import FormField from '@shared/components/FormField';
import Select from '@shared/components/Select';
import type {
  GlobalAiConfig,
  GlobalAiParametersFormData,
  LlmProviderId,
} from '../schemas/globalAiCredentials.schema';
import {
  PROVIDER_CATALOG,
  validateGlobalAiParameters,
} from '../utils/globalAiCredentials.helpers';

interface GlobalAiParametersCardProps {
  config: GlobalAiConfig;
  onSaveParameters: (data: GlobalAiParametersFormData) => Promise<void>;
  saving: boolean;
}

const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI GPT / Azure OpenAI' },
  { value: 'watsonx', label: 'IBM WatsonX' },
];

export const GlobalAiParametersCard: React.FC<GlobalAiParametersCardProps> = ({
  config,
  onSaveParameters,
  saving,
}) => {
  const [formData, setFormData] = useState<GlobalAiParametersFormData>({
    modelProvider: (config.modelProvider || 'gemini') as LlmProviderId,
    modelName: config.modelName || 'gemini-1.5-flash',
    maxNewTokens: config.maxNewTokens || 7000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      modelProvider: (config.modelProvider || 'gemini') as LlmProviderId,
      modelName: config.modelName || PROVIDER_CATALOG[config.modelProvider as LlmProviderId]?.defaultModel || 'gemini-1.5-flash',
      maxNewTokens: config.maxNewTokens || 7000,
    });
  }, [config]);

  const handleProviderChange = (selected: { value: string; label: string } | null) => {
    if (!selected) return;
    const providerId = selected.value as LlmProviderId;
    const defaultModel = PROVIDER_CATALOG[providerId]?.defaultModel || '';
    setFormData((prev) => ({
      ...prev,
      modelProvider: providerId,
      modelName: defaultModel,
    }));
    if (errors.modelName) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.modelName;
        return next;
      });
    }
  };

  const handleSelectModelSuggestion = (suggestedModel: string) => {
    setFormData((prev) => ({ ...prev, modelName: suggestedModel }));
    if (errors.modelName) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.modelName;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await validateGlobalAiParameters(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      setTouched({ modelName: true, maxNewTokens: true });
      return;
    }

    await onSaveParameters(formData);
  };

  const currentCatalog = PROVIDER_CATALOG[formData.modelProvider] || PROVIDER_CATALOG.gemini;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sliders size={16} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              Motor Global de Inferencia & Parámetros Rápidos
            </h4>
            <p className="text-[11px] text-slate-400">
              Define el proveedor activo y el límite de respuesta utilizado para procesar interacciones en todos los tenants.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          className="!py-2 !px-4 !text-xs !font-bold gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Save size={14} />
          <span>{saving ? 'Guardando Ajustes...' : 'Guardar Ajustes'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Proveedor Principal */}
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
            Proveedor Activo
          </label>
          <Select
            value={PROVIDER_OPTIONS.find((opt) => opt.value === formData.modelProvider)}
            onChange={handleProviderChange}
            options={PROVIDER_OPTIONS}
            isSearchable={false}
          />
        </div>

        {/* Modelo de Inferencia */}
        <div className="space-y-1">
          <FormField
            id="global-model-name"
            label="Nombre del Modelo"
            name="modelName"
            value={formData.modelName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFormData((prev) => ({ ...prev, modelName: e.target.value }));
              if (errors.modelName) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.modelName;
                  return next;
                });
              }
            }}
            placeholder="Ej. gemini-1.5-flash, gpt-4o"
            error={touched.modelName ? errors.modelName : undefined}
            inputPrefix={<Sparkles size={14} className="text-slate-400" />}
            className="!py-2.5 !text-xs"
          />

          {/* Model Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Sugerencias:</span>
            {currentCatalog.recommendedModels.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectModelSuggestion(m)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                  formData.modelName === m
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Max New Tokens */}
        <div>
          <FormField
            id="global-max-tokens"
            label="Límite Max New Tokens"
            name="maxNewTokens"
            type="number"
            min={100}
            max={32768}
            step={100}
            value={formData.maxNewTokens}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = parseInt(e.target.value, 10);
              setFormData((prev) => ({
                ...prev,
                maxNewTokens: isNaN(val) ? 0 : val,
              }));
              if (errors.maxNewTokens) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.maxNewTokens;
                  return next;
                });
              }
            }}
            placeholder="7000"
            error={touched.maxNewTokens ? errors.maxNewTokens : undefined}
            className="!py-2.5 !text-xs font-mono"
          />
          <p className="text-[10px] text-slate-400 mt-1 ml-1">
            Límite de generación de respuesta por turno para evitar truncado.
          </p>
        </div>
      </div>
    </form>
  );
};

export default GlobalAiParametersCard;
