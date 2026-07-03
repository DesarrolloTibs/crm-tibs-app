import React, { useState, useEffect } from 'react';
import { getAiAgentConfig, saveAiAgentConfig } from '../../services/conversationsService';
import { getUsers } from '../../services/usersService';
import Button from '../shared/Button';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Select from '../shared/Select';
import Loader from '../Loader/Loader';
import Notification from '../Modal/Notification';
import { Brain, Settings2, Sliders, KeyRound, UserCheck } from 'lucide-react';

const PROVIDER_OPTIONS = [
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'openai', label: 'OpenAI GPT' },
    { value: 'watsonx', label: 'IBM WatsonX' },
];

const REMINDER_OFFSET_OPTIONS = [
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes (Default)' },
    { value: 120, label: '2 horas antes' },
    { value: 180, label: '3 horas antes' },
    { value: 1440, label: '24 horas antes' },
];

const AiAgentSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    // Config states
    const [isActive, setIsActive] = useState(true);
    const [context, setContext] = useState('');
    const [defaultReplies, setDefaultReplies] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [modelProvider, setModelProvider] = useState('gemini');
    const [modelName, setModelName] = useState('gemini-1.5-flash');

    // API Keys and secrets
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [openaiEndpoint, setOpenaiEndpoint] = useState('');
    const [openaiApiVersion, setOpenaiApiVersion] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [watsonxApiKey, setWatsonxApiKey] = useState('');
    const [watsonxProjectId, setWatsonxProjectId] = useState('');
    const [watsonxRegion, setWatsonxRegion] = useState('us-south');

    // Reminder and assignment
    const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState(60);
    const [defaultUserId, setDefaultUserId] = useState('');

    // Notification state — estándar de la aplicación
    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });

    const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

    const showNotification = (
        type: 'success' | 'error' | 'warning' | 'confirmation',
        title: string,
        message: string,
    ) => {
        setNotification({ show: true, type, title, message, onConfirm: hideNotification, onCancel: hideNotification });
    };

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const [config, allUsers] = await Promise.all([
                    getAiAgentConfig(),
                    getUsers()
                ]);

                setUsers(allUsers);
                setIsActive(config.isActive);
                setContext(config.context || '');
                setDefaultReplies(config.defaultReplies || '');
                setTemperature(config.temperature);
                setModelProvider(config.modelProvider);
                setModelName(config.modelName);
                setOpenaiApiKey(config.openaiApiKey || '');
                setOpenaiEndpoint(config.openaiEndpoint || '');
                setOpenaiApiVersion(config.openaiApiVersion || '');
                setGeminiApiKey(config.geminiApiKey || '');
                setWatsonxApiKey(config.watsonxApiKey || '');
                setWatsonxProjectId(config.watsonxProjectId || '');
                setWatsonxRegion(config.watsonxRegion || 'us-south');
                setReminderOffsetMinutes(config.reminderOffsetMinutes);
                setDefaultUserId(config.defaultUserId || '');
            } catch (error) {
                console.error('Error al cargar configuraciones del agente IA:', error);
                showNotification('error', 'Error', 'No se pudieron cargar las configuraciones del agente IA.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await saveAiAgentConfig({
                isActive,
                context,
                defaultReplies,
                temperature,
                modelProvider,
                modelName,
                openaiApiKey: openaiApiKey || null,
                openaiEndpoint: openaiEndpoint || null,
                openaiApiVersion: openaiApiVersion || null,
                geminiApiKey: geminiApiKey || null,
                watsonxApiKey: watsonxApiKey || null,
                watsonxProjectId: watsonxProjectId || null,
                watsonxRegion: watsonxRegion || 'us-south',
                reminderOffsetMinutes,
                defaultUserId: defaultUserId || null,
            });
            showNotification('success', 'Guardado', 'Configuraciones del Agente IA actualizadas con éxito.');
        } catch (error) {
            console.error('Error al guardar configuraciones:', error);
            showNotification('error', 'Error al Guardar', 'Ocurrió un error al guardar las configuraciones.');
        } finally {
            setSaving(false);
        }
    };

    const userOptions = users.map(u => ({
        value: u.id,
        label: `${u.username} (${u.role})`,
    }));

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
            </div>
        );
    }

    return (
        <>
            <Notification
                show={notification.show}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onConfirm={notification.onConfirm}
                onCancel={notification.onCancel}
            />

            <form onSubmit={handleSave} className="space-y-6 text-left max-w-4xl">
                {/* Header / Switch Principal */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-105/70 rounded-lg text-blue-800">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Respuesta Automática del Agente IA</h3>
                            <p className="text-xs text-gray-500">Habilita o deshabilita las respuestas de la IA a nivel de todos los canales</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-bold text-gray-700">{isActive ? 'Activo' : 'Inactivo'}</span>
                    </label>
                </div>

                {/* Instrucciones y Comportamiento */}
                <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                        <Settings2 className="text-indigo-600" size={20} />
                        <h4 className="font-bold text-gray-800 text-base">Instrucciones y Comportamiento</h4>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="agentContext" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Prompt de Directivas e Instrucciones del Agente
                        </label>
                        <p className="text-xs text-gray-500 pb-2">
                            Redacta aquí las reglas del bot. Ej: cuándo crear oportunidades comerciales, cuándo registrar actividades/recordatorios, y cómo recopilar la información de contacto faltante.
                        </p>
                        <TextArea
                            id="agentContext"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Ej: Eres un asistente CRM. Si el usuario te proporciona su correo, llámale a la herramienta updateContact..."
                            rows={10}
                            required
                        />
                    </div>
                </div>

                {/* Parámetros del LLM */}
                <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                        <Sliders className="text-amber-500" size={20} />
                        <h4 className="font-bold text-gray-800 text-base">Parámetros del LLM</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="modelProvider" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Proveedor del Modelo
                            </label>
                            <Select
                                inputId="modelProvider"
                                value={PROVIDER_OPTIONS.find(opt => opt.value === modelProvider)}
                                onChange={(selected) => {
                                    if (selected) {
                                        setModelProvider(selected.value);
                                        if (selected.value === 'gemini') setModelName('gemini-1.5-flash');
                                        else if (selected.value === 'openai') setModelName('gpt-4o-mini');
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
                            {modelProvider === 'openai' && openaiEndpoint && (
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                    Requerido para Azure: Ingrese el nombre exacto de su <strong>despliegue (Deployment Name)</strong> en Azure AI Studio.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Temperatura de la IA (Creatividad vs Precisión)
                            </label>
                            <span className="text-sm font-bold text-blue-600">{temperature}</span>
                        </div>
                        <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 font-medium">
                            <span>Preciso (0.0)</span>
                            <span>Creativo (1.0)</span>
                        </div>
                    </div>
                </div>

                {/* Credenciales de API */}
                <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4">
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
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                    Solo rellene si utiliza Azure OpenAI. Deje en blanco para usar OpenAI oficial.
                                </p>
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
                                <div>
                                    <Input
                                        label="API Version (Azure OpenAI)"
                                        id="openaiApiVersion"
                                        type="text"
                                        value={openaiApiVersion}
                                        onChange={(e) => setOpenaiApiVersion(e.target.value)}
                                        placeholder="2024-12-01-preview"
                                        required={modelProvider === 'openai' && !!openaiEndpoint.trim()}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                        Requerido únicamente si utiliza Azure OpenAI.
                                    </p>
                                </div>
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
                                    label="Región de WatsonX"
                                    id="watsonxRegion"
                                    type="text"
                                    value={watsonxRegion}
                                    onChange={(e) => setWatsonxRegion(e.target.value)}
                                    placeholder="us-south, eu-de, etc."
                                    required={modelProvider === 'watsonx'}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Asignación y Recordatorios */}
                <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                        <UserCheck className="text-emerald-500" size={20} />
                        <h4 className="font-bold text-gray-800 text-base">Asignación y Tiempos de Recordatorio</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="defaultUserId" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Ejecutivo Asignado por Defecto
                            </label>
                            <p className="text-[11px] text-gray-400 pb-2">
                                Se le asignarán automáticamente todas las conversaciones nuevas entrantes.
                            </p>
                            <Select
                                inputId="defaultUserId"
                                value={userOptions.find(opt => opt.value === defaultUserId)}
                                onChange={(selected) => setDefaultUserId(selected ? selected.value : '')}
                                options={userOptions}
                                isClearable
                                placeholder="-- Seleccionar Ejecutivo --"
                            />
                        </div>

                        <div>
                            <label htmlFor="reminderOffsetMinutes" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Tiempo de Recordatorio por Defecto
                            </label>
                            <p className="text-[11px] text-gray-400 pb-2">
                                Se restará esta cantidad de tiempo a la fecha de la actividad para fijar el recordatorio.
                            </p>
                            <Select
                                inputId="reminderOffsetMinutes"
                                value={REMINDER_OFFSET_OPTIONS.find(opt => opt.value === reminderOffsetMinutes)}
                                onChange={(selected) => { if (selected) setReminderOffsetMinutes(selected.value); }}
                                options={REMINDER_OFFSET_OPTIONS}
                                isSearchable={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="success" loading={saving}>
                        Guardar Configuración
                    </Button>
                </div>
            </form>
        </>
    );
};

export default AiAgentSettings;
