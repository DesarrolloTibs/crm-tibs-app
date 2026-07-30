import React, { useState, useEffect } from 'react';
import { getAiAgentConfig, saveAiAgentConfig } from '../../services/conversationsService';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Loader from '../Loader/Loader';
import Notification from '../Modal/Notification';
import { KeyRound, Sliders, Cpu, Save, ShieldCheck } from 'lucide-react';

const PROVIDER_OPTIONS = [
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'openai', label: 'OpenAI GPT / Azure OpenAI' },
    { value: 'watsonx', label: 'IBM WatsonX' },
];

const GlobalAiCredentialsSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // LLM Provider & Model Selection
    const [modelProvider, setModelProvider] = useState('gemini');
    const [modelName, setModelName] = useState('gemini-1.5-flash');
    const [maxNewTokens, setMaxNewTokens] = useState(7000);

    // API Keys and secrets
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [openaiEndpoint, setOpenaiEndpoint] = useState('');
    const [openaiApiVersion, setOpenaiApiVersion] = useState('');
    const [openaiEmbeddingModel, setOpenaiEmbeddingModel] = useState('text-embedding-ada-002');

    const [geminiApiKey, setGeminiApiKey] = useState('');

    const [watsonxApiKey, setWatsonxApiKey] = useState('');
    const [watsonxProjectId, setWatsonxProjectId] = useState('');
    const [watsonxRegion, setWatsonxRegion] = useState('us-south');
    const [watsonxEmbeddingModel, setWatsonxEmbeddingModel] = useState('ibm/slate-125m-english-rtrvr');

    // Notification State
    const [notification, setNotification] = useState<{
        show: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
    }>({
        show: false,
        type: 'success',
        title: '',
        message: '',
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const config = await getAiAgentConfig();
                if (config) {
                    if (config.modelProvider) setModelProvider(config.modelProvider);
                    if (config.modelName) setModelName(config.modelName);
                    if (config.maxNewTokens) setMaxNewTokens(config.maxNewTokens);

                    if (config.openaiApiKey) setOpenaiApiKey(config.openaiApiKey);
                    if (config.openaiEndpoint) setOpenaiEndpoint(config.openaiEndpoint);
                    if (config.openaiApiVersion) setOpenaiApiVersion(config.openaiApiVersion);
                    if (config.openaiEmbeddingModel) setOpenaiEmbeddingModel(config.openaiEmbeddingModel);

                    if (config.geminiApiKey) setGeminiApiKey(config.geminiApiKey);

                    if (config.watsonxApiKey) setWatsonxApiKey(config.watsonxApiKey);
                    if (config.watsonxProjectId) setWatsonxProjectId(config.watsonxProjectId);
                    if (config.watsonxRegion) setWatsonxRegion(config.watsonxRegion);
                    if (config.watsonxEmbeddingModel) setWatsonxEmbeddingModel(config.watsonxEmbeddingModel);
                }
            } catch (err: any) {
                console.error('Error al cargar configuración global de IA:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await saveAiAgentConfig({
                modelProvider,
                modelName,
                maxNewTokens,
                openaiApiKey,
                openaiEndpoint,
                openaiApiVersion,
                openaiEmbeddingModel,
                geminiApiKey,
                watsonxApiKey,
                watsonxProjectId,
                watsonxRegion,
                watsonxEmbeddingModel,
            });
            setNotification({
                show: true,
                type: 'success',
                title: 'Credenciales Guardadas',
                message: 'La configuración global de proveedor y credenciales LLM se ha actualizado correctamente para todos los tenants.',
            });
        } catch (err: any) {
            console.error('Error al guardar credenciales de IA:', err);
            setNotification({
                show: true,
                type: 'error',
                title: 'Error al Guardar',
                message: err?.response?.data?.message || 'No se pudieron actualizar las credenciales globales de IA.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader />
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-6 text-left">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                    <Cpu size={220} />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                        <KeyRound size={22} className="text-blue-400" />
                    </div>
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 block">Exclusivo SuperAdministrador</span>
                        <h2 className="text-xl font-black tracking-tight">Credenciales y Proveedor de LLM Global</h2>
                    </div>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                    Define centralmente el motor de Inteligencia Artificial que ejecutará las respuestas automatizadas y llamadas RAG en toda la plataforma CRM. Esta configuración aplica para todos los esquemas de organización (tenants).
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
                    <ShieldCheck size={14} />
                    <span>Control de Acceso Global — Los administradores de tenant no tienen acceso a estas credenciales.</span>
                </div>
            </div>

            {/* Parámetros del Proveedor LLM */}
            <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                    <Sliders className="text-amber-500" size={20} />
                    <h4 className="font-bold text-gray-800 text-base">Selección de Proveedor y Modelo</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="modelProvider" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Proveedor de Modelo LLM
                        </label>
                        <Select
                            inputId="modelProvider"
                            value={PROVIDER_OPTIONS.find(opt => opt.value === modelProvider)}
                            onChange={(selected) => {
                                if (selected) {
                                    setModelProvider(selected.value);
                                    if (selected.value === 'gemini') setModelName('gemini-1.5-flash');
                                    else if (selected.value === 'openai') setModelName('gpt-4o');
                                    else if (selected.value === 'watsonx') setModelName('meta-llama/llama-3-3-70b-instruct');
                                }
                            }}
                            options={PROVIDER_OPTIONS}
                            isSearchable={false}
                        />
                    </div>
                    <div>
                        <Input
                            label={modelProvider === 'openai' && openaiEndpoint ? 'Nombre de Despliegue (Azure Deployment)' : 'Nombre del Modelo'}
                            id="modelName"
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder={modelProvider === 'openai' && openaiEndpoint ? 'Ej: gpt-4o-mini-deployment' : 'Ej: gemini-1.5-flash o gpt-4o'}
                            required
                        />
                    </div>
                </div>

                {/* Max New Tokens */}
                <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Tokens Máximos de Respuesta (max_new_tokens)
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={maxNewTokens}
                        onChange={(e) => setMaxNewTokens(parseInt(e.target.value) || 7000)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. 2048"
                    />
                    <p className="text-xs text-gray-400">Límite de tokens generados por respuesta. Auméntalo si el agente trunca respuestas (WatsonX / OpenAI / Gemini).</p>
                </div>
            </div>

            {/* Llaves de API (Credenciales) */}
            <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                    <KeyRound className="text-rose-500" size={20} />
                    <h4 className="font-bold text-gray-800 text-base">Llaves de API (Credenciales)</h4>
                </div>

                {modelProvider === 'gemini' && (
                    <Input
                        label="Google Gemini API Key"
                        id="geminiApiKey"
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="Ingrese su API Key de Google AI Studio"
                        required={modelProvider === 'gemini'}
                    />
                )}

                {modelProvider === 'openai' && (
                    <div className="space-y-4">
                        <div>
                            <Input
                                label="Endpoint (Azure OpenAI - Opcional)"
                                id="openaiEndpoint"
                                type="text"
                                value={openaiEndpoint}
                                onChange={(e) => setOpenaiEndpoint(e.target.value)}
                                placeholder="https://tu-recurso.cognitiveservices.azure.com/"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="API Key (OpenAI / Azure)"
                                id="openaiApiKey"
                                type="password"
                                value={openaiApiKey}
                                onChange={(e) => setOpenaiApiKey(e.target.value)}
                                placeholder="Ingrese su API Key"
                                required={modelProvider === 'openai'}
                            />
                            <Input
                                label="API Version (Azure OpenAI)"
                                id="openaiApiVersion"
                                type="text"
                                value={openaiApiVersion}
                                onChange={(e) => setOpenaiApiVersion(e.target.value)}
                                placeholder="2024-12-01-preview"
                            />
                        </div>
                        <div>
                            <Input
                                label="Nombre del Despliegue de Embeddings (Azure/OpenAI)"
                                id="openaiEmbeddingModel"
                                type="text"
                                value={openaiEmbeddingModel}
                                onChange={(e) => setOpenaiEmbeddingModel(e.target.value)}
                                placeholder="Ej: text-embedding-ada-002"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                                Nombre del despliegue del modelo de vectores en Azure OpenAI (por defecto: text-embedding-ada-002).
                            </span>
                        </div>
                    </div>
                )}

                {modelProvider === 'watsonx' && (
                    <div className="space-y-4">
                        <Input
                            label="IBM Cloud API Key (WatsonX)"
                            id="watsonxApiKey"
                            type="password"
                            value={watsonxApiKey}
                            onChange={(e) => setWatsonxApiKey(e.target.value)}
                            placeholder="Ingrese API Key de IBM Cloud"
                            required={modelProvider === 'watsonx'}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="ID del Proyecto de WatsonX"
                                id="watsonxProjectId"
                                type="text"
                                value={watsonxProjectId}
                                onChange={(e) => setWatsonxProjectId(e.target.value)}
                                placeholder="ID de su proyecto de WatsonX"
                                required={modelProvider === 'watsonx'}
                            />
                            <Input
                                label="Endpoint / Región de WatsonX"
                                id="watsonxRegion"
                                type="text"
                                value={watsonxRegion}
                                onChange={(e) => setWatsonxRegion(e.target.value)}
                                placeholder="https://us-south.ml.cloud.ibm.com o us-south"
                                required={modelProvider === 'watsonx'}
                            />
                        </div>
                        <div>
                            <Input
                                label="Modelo de Embeddings (WatsonX)"
                                id="watsonxEmbeddingModel"
                                type="text"
                                value={watsonxEmbeddingModel}
                                onChange={(e) => setWatsonxEmbeddingModel(e.target.value)}
                                placeholder="Ej: ibm/slate-125m-english-rtrvr"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                                Identificador del modelo de embeddings en watsonx.ai (por defecto: ibm/slate-125m-english-rtrvr).
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={saving}
                    className="flex items-center gap-2 px-6"
                >
                    <Save size={18} />
                    <span>{saving ? 'Guardando Credenciales Globales...' : 'Guardar Credenciales Globales'}</span>
                </Button>
            </div>

            {/* Notification Toast */}
            {notification.show && (
                <Notification
                    show={notification.show}
                    title={notification.title}
                    message={notification.message}
                    type={notification.type}
                    onConfirm={() => setNotification(prev => ({ ...prev, show: false }))}
                />
            )}

        </form>
    );
};

export default GlobalAiCredentialsSettings;
