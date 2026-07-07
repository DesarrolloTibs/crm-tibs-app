import React, { useState, useEffect } from 'react';
import { 
    getAiAgentConfig, 
    saveAiAgentConfig,
    getChannelConfigs,
    saveChannelConfig,
    deleteChannelConfig
} from '../../services/conversationsService';
import { getUsers } from '../../services/usersService';
import Button from '../shared/Button';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Select from '../shared/Select';
import Loader from '../Loader/Loader';
import Notification from '../Modal/Notification';
import { 
    Brain, 
    Settings2, 
    Sliders, 
    KeyRound, 
    UserCheck, 
    Link2, 
    Smartphone, 
    Facebook, 
    Instagram, 
    Plus, 
    Search, 
    Trash2, 
    Edit2, 
    X,
    MessageSquare,
    CheckCircle
} from 'lucide-react';


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
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'general' | 'channels'>('general');

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

    // Channels states
    const [channelConfigs, setChannelConfigs] = useState<any[]>([]);
    const [channelSearchQuery, setChannelSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<any | null>(null);

    // Modal Form States
    const [channelType, setChannelType] = useState<'whatsapp' | 'facebook' | 'instagram'>('whatsapp');
    const [channelName, setChannelName] = useState('');
    const [appId, setAppId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [verifyToken, setVerifyToken] = useState('');

    // Notification state
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

    const loadSettings = async () => {
        try {
            setLoading(true);
            const [config, allUsers, configsList] = await Promise.all([
                getAiAgentConfig(),
                getUsers(),
                getChannelConfigs()
            ]);

            setUsers(allUsers);
            setChannelConfigs(configsList);
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

    useEffect(() => {
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

    // ── GESTIÓN DE CANALES (CRUD FRONTEND) ────────────────────────────────────

    const handleOpenCreateModal = (type: 'whatsapp' | 'facebook' | 'instagram') => {
        setChannelType(type);
        setEditingChannel(null);
        setChannelName('');
        setAppId('');
        setAccountId('');
        setPhoneNumberId('');
        setAccessToken('');
        setVerifyToken('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (config: any) => {
        setEditingChannel(config);
        setChannelType(config.channel);
        setChannelName(config.name || '');
        setAppId(config.appId || '');
        setAccountId(config.accountId || '');
        setPhoneNumberId(config.phoneNumberId || '');
        setAccessToken(config.accessToken || '');
        setVerifyToken(config.verifyToken || '');
        setIsModalOpen(true);
    };

    const handleSaveChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                id: editingChannel?.id || undefined,
                channel: channelType,
                name: channelName,
                appId: appId || null,
                accountId: accountId || null,
                phoneNumberId: phoneNumberId || null,
                accessToken: accessToken || null,
                verifyToken: verifyToken || null,
                isActive: editingChannel ? editingChannel.isActive : true
            };
            await saveChannelConfig(payload);
            
            showNotification(
                'success',
                editingChannel ? 'Actualizado' : 'Creado',
                `Canal ${channelType.toUpperCase()} guardado con éxito.`
            );
            
            setIsModalOpen(false);
            
            // Recargar lista de canales
            const list = await getChannelConfigs();
            setChannelConfigs(list);
        } catch (err) {
            console.error('Error al guardar canal:', err);
            showNotification(
                'error',
                'Error',
                'No se pudo guardar la configuración del canal.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteChannel = (id: string) => {
        setNotification({
            show: true,
            type: 'confirmation',
            title: '¿Estás seguro?',
            message: 'Esta acción eliminará las credenciales y detendrá la integración para este canal.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await deleteChannelConfig(id);
                    setNotification({
                        show: true,
                        type: 'success',
                        title: 'Eliminado',
                        message: 'El canal ha sido eliminado.',
                        onConfirm: hideNotification,
                        onCancel: hideNotification
                    });
                    const list = await getChannelConfigs();
                    setChannelConfigs(list);
                } catch (err) {
                    console.error('Error al eliminar canal:', err);
                    setNotification({
                        show: true,
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo eliminar el canal.',
                        onConfirm: hideNotification,
                        onCancel: hideNotification
                    });
                }
            },
            onCancel: hideNotification
        });
    };

    const userOptions = users.map(u => ({
        value: u.id,
        label: `${u.username} (${u.role})`,
    }));

    // Obtener configuraciones de Canales
    const whatsappConfig = channelConfigs.find(c => c.channel === 'whatsapp');
    const facebookConfig = channelConfigs.find(c => c.channel === 'facebook');
    const instagramConfig = channelConfigs.find(c => c.channel === 'instagram');

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

            {/* Pestañas de Configuración */}
            <div className="flex gap-6 border-b border-gray-200 pb-px mb-6 max-w-4xl text-left">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`pb-3 px-1 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Brain size={18} />
                    Configuración General
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('channels')}
                    className={`pb-3 px-1 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'channels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Link2 size={18} />
                    Canales de Comunicación
                </button>
            </div>

            {activeTab === 'general' ? (
                // ── CONTENIDO: CONFIGURACIÓN GENERAL (IA) ─────────────────────────
                <form onSubmit={handleSave} className="space-y-6 text-left max-w-4xl">
                    {/* Header / Switch Principal */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-800">
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
                    <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
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
                    <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
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
                    <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                            <UserCheck className="text-emerald-500" size={20} />
                            <h4 className="font-bold text-gray-800 text-base">Asignación y Tiempos de Recordatorio</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="defaultUserId" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Ejecutivo Asignado por Defecto
                                </label>
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
            ) : (
                // ── CONTENIDO: PESTAÑA CANALES DE COMUNICACIÓN ────────────────────
                <div className="space-y-6 text-left max-w-4xl animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                        <div className="pb-3 border-b border-gray-100">
                            <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                                <MessageSquare className="text-indigo-500" size={20} />
                                Canales de Comunicación (Meta APIs)
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Conecta tus cuentas de WhatsApp Cloud API, Facebook Messenger y cuentas de Instagram Business para recibir chats y responder desde el CRM.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* TARJETA WHATSAPP */}
                            <div className="border border-gray-150 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold border border-emerald-100">
                                        <Smartphone size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                                            WhatsApp
                                            {whatsappConfig && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <CheckCircle size={10} /> Conectado
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Conecta tu cuenta de WhatsApp Cloud API para responder a tus clientes y automatizar la captura de prospectos con el agente IA.
                                        </p>
                                    </div>
                                    {whatsappConfig && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-gray-600 space-y-1 font-medium">
                                            <div><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">Nombre de Cuenta</strong> {whatsappConfig.name}</div>
                                            <div className="font-mono mt-1 text-[10px]"><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">Phone Number ID</strong> {whatsappConfig.phoneNumberId}</div>
                                            <div className="font-mono mt-1 text-[10px]"><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">WhatsApp Business Account ID</strong> {whatsappConfig.accountId}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-5 flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={whatsappConfig ? "secondary" : "primary"}
                                        className="w-full text-xs py-2 font-bold cursor-pointer"
                                        onClick={() => whatsappConfig ? handleOpenEditModal(whatsappConfig) : handleOpenCreateModal('whatsapp')}
                                    >
                                        {whatsappConfig ? 'Configurar / Editar' : 'Link Account'}
                                    </Button>
                                    {whatsappConfig && (
                                        <button
                                            onClick={() => handleDeleteChannel(whatsappConfig.id)}
                                            className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            title="Desconectar cuenta"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* TARJETA FACEBOOK */}
                            <div className="border border-gray-150 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold border border-blue-100">
                                        <Facebook size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                                            Facebook
                                            {facebookConfig && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <CheckCircle size={10} /> Conectado
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Gestiona tus páginas de Facebook, responde a los chats de Messenger y programa las publicaciones de tus prospectos de forma interactiva.
                                        </p>
                                    </div>
                                    {facebookConfig && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-gray-600 space-y-1 font-medium">
                                            <div><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">Nombre de Página</strong> {facebookConfig.name}</div>
                                            <div className="font-mono mt-1 text-[10px]"><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">ID de Página (Account ID)</strong> {facebookConfig.accountId}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-5 flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={facebookConfig ? "secondary" : "primary"}
                                        className="w-full text-xs py-2 font-bold cursor-pointer"
                                        onClick={() => facebookConfig ? handleOpenEditModal(facebookConfig) : handleOpenCreateModal('facebook')}
                                    >
                                        {facebookConfig ? 'Configurar / Editar' : 'Link Account'}
                                    </Button>
                                    {facebookConfig && (
                                        <button
                                            onClick={() => handleDeleteChannel(facebookConfig.id)}
                                            className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            title="Desconectar página"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* TARJETA INSTAGRAM */}
                            <div className="border border-gray-150 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center font-bold border border-pink-100">
                                        <Instagram size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                                            Instagram
                                            {instagramConfig && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <CheckCircle size={10} /> Conectado
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Administra tus cuentas comerciales de Instagram, recibe las consultas por mensaje directo y automatiza la captura de datos con el agente IA.
                                        </p>
                                    </div>
                                    {instagramConfig && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-gray-600 space-y-1 font-medium">
                                            <div><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">Nombre de Cuenta</strong> {instagramConfig.name}</div>
                                            <div className="font-mono mt-1 text-[10px]"><strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">ID de Cuenta (Instagram Account ID)</strong> {instagramConfig.accountId}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-5 flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={instagramConfig ? "secondary" : "primary"}
                                        className="w-full text-xs py-2 font-bold cursor-pointer"
                                        onClick={() => instagramConfig ? handleOpenEditModal(instagramConfig) : handleOpenCreateModal('instagram')}
                                    >
                                        {instagramConfig ? 'Configurar / Editar' : 'Link Account'}
                                    </Button>
                                    {instagramConfig && (
                                        <button
                                            onClick={() => handleDeleteChannel(instagramConfig.id)}
                                            className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            title="Desconectar cuenta"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DE CONFIGURACIÓN DE CREDENCIALES DE CANAL ───────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-scale-up text-left">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                                    {channelType === 'whatsapp' ? <Smartphone size={18} className="text-emerald-500" /> : channelType === 'facebook' ? <Facebook size={18} className="text-blue-500" /> : <Instagram size={18} className="text-pink-500" />}
                                    {editingChannel ? 'Editar Configuración' : 'Conectar Nuevo Canal'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">Rellene los campos requeridos obtenidos de Meta for Developers.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSaveChannel} className="p-5 space-y-4">
                            <div>
                                <Input 
                                    label="Nombre descriptivo de la Cuenta (Nombre)"
                                    id="channelName"
                                    type="text"
                                    value={channelName}
                                    onChange={(e: any) => setChannelName(e.target.value)}
                                    placeholder={channelType === 'whatsapp' ? 'Ej: Cuenta Principal de Ventas' : channelType === 'facebook' ? 'Ej: Página Oficial Tibs CRM' : 'Ej: Instagram Comercial'}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Input 
                                        label="App ID de Meta"
                                        id="appId"
                                        type="text"
                                        value={appId}
                                        onChange={(e: any) => setAppId(e.target.value)}
                                        placeholder="Ej: 1234567890"
                                    />
                                </div>
                                <div>
                                    <Input 
                                        label={channelType === 'whatsapp' ? 'WhatsApp Business Account ID' : channelType === 'facebook' ? 'Facebook Page ID' : 'Instagram Business Account ID'}
                                        id="accountId"
                                        type="text"
                                        value={accountId}
                                        onChange={(e: any) => setAccountId(e.target.value)}
                                        placeholder="Ej: 1234567890"
                                        required
                                    />
                                </div>
                            </div>

                            {channelType === 'whatsapp' && (
                                <div>
                                    <Input 
                                        label="Phone Number ID (WhatsApp Cloud API)"
                                        id="phoneNumberId"
                                        type="text"
                                        value={phoneNumberId}
                                        onChange={(e: any) => setPhoneNumberId(e.target.value)}
                                        placeholder="Ej: 1234123455"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <Input 
                                    label="Token de Acceso Permanente (Access Token)"
                                    id="accessToken"
                                    type="password"
                                    value={accessToken}
                                    onChange={(e: any) => setAccessToken(e.target.value)}
                                    placeholder="Pegue aquí el token generado en Meta Developers"
                                    required
                                />
                            </div>

                            <div>
                                <Input 
                                    label="Token de Verificación del Webhook (Verify Token)"
                                    id="verifyToken"
                                    type="text"
                                    value={verifyToken}
                                    onChange={(e: any) => setVerifyToken(e.target.value)}
                                    placeholder="Defina un código secreto para configurar en el webhook (ej: mi_secreto_99)"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1 leading-relaxed">
                                    Este es el código que deberás colocar en el campo <strong>Verify Token</strong> al configurar el webhook en el portal de desarrolladores de Meta.
                                </p>
                            </div>

                            {/* Detalle visual del Webhook según configuración de .env */}
                            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 space-y-2 text-xs">
                                <h4 className="font-extrabold text-blue-900 flex items-center gap-1.5">
                                    <Link2 size={14} className="text-blue-600" />
                                    Configuración de Webhook en Meta
                                </h4>
                                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                                    Copia estos valores y pégalos en la sección de Webhooks en tu panel de Meta for Developers:
                                </p>
                                <div className="space-y-2 pt-1">
                                    <div>
                                        <span className="block text-[9px] font-bold text-blue-700/75 uppercase tracking-wider mb-1">URL de devolución de llamada (Callback URL)</span>
                                        <div className="flex items-center bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-gray-700 break-all select-all font-semibold">
                                            {(import.meta.env.VITE_BASE_URL || 'http://localhost:3091')}/api/conversations/webhook/{channelType}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-bold text-blue-700/75 uppercase tracking-wider mb-1">Token de verificación (Verify Token)</span>
                                        <div className="flex items-center bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-gray-700 select-all font-semibold">
                                            {verifyToken || 'Define el token de verificación arriba...'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer del Modal */}
                            <div className="flex justify-end gap-3 border-t border-gray-150 pt-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold cursor-pointer font-medium"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="success" 
                                    loading={saving}
                                    className="px-4 py-2 text-xs font-bold cursor-pointer"
                                >
                                    Guardar Configuración
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAgentSettings;
