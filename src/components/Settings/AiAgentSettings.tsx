import React, { useState, useEffect } from 'react';
import { 
    getAiAgentConfig, 
    saveAiAgentConfig,
    getChannelConfigs,
    saveChannelConfig,
    deleteChannelConfig,
    getSubAgents,
    saveSubAgent,
    deleteSubAgent
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

const AVAILABLE_TOOLS = [
    { key: 'createOpportunity', label: 'Crear Oportunidad', desc: 'Registra oportunidades de venta.' },
    { key: 'modifyOpportunity', label: 'Modificar Oportunidad', desc: 'Edita oportunidades del CRM.' },
    { key: 'registerContact', label: 'Registrar Contacto', desc: 'Crea clientes en el sistema.' },
    { key: 'updateContact', label: 'Actualizar Contacto', desc: 'Edita la ficha del cliente.' },
    { key: 'checkAvailability', label: 'Consultar Disponibilidad', desc: 'Verifica la agenda del asesor.' },
    { key: 'createActivity', label: 'Crear Actividad', desc: 'Programa reuniones o recordatorios.' },
    { key: 'createTicket', label: 'Crear Ticket de Soporte', desc: 'Levanta reportes en la mesa de ayuda.' }
];

const AiAgentSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'general' | 'channels' | 'subagents'>('general');

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

    // Sub-Agents states
    const [subAgents, setSubAgents] = useState<any[]>([]);
    const [isSubAgentModalOpen, setIsSubAgentModalOpen] = useState(false);
    const [editingSubAgent, setEditingSubAgent] = useState<any | null>(null);

    // Modal Form States for Sub-Agents
    const [subAgentKey, setSubAgentKey] = useState('');
    const [subAgentName, setSubAgentName] = useState('');
    const [subAgentDescription, setSubAgentDescription] = useState('');
    const [subAgentContext, setSubAgentContext] = useState('');
    const [subAgentTools, setSubAgentTools] = useState<string[]>([]);

    // ORCHESTRATOR GRAPH STATES
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Initialize or update positions dynamically
        const initialPositions: Record<string, { x: number; y: number }> = {
            router: nodePositions.router || { x: 330, y: 15 }
        };
        
        subAgents.forEach((agent, index) => {
            if (!nodePositions[agent.key]) {
                const spacing = 180;
                const startX = Math.max(10, 340 - ((subAgents.length - 1) * spacing) / 2);
                initialPositions[agent.key] = { x: startX + index * spacing, y: 160 };
            } else {
                initialPositions[agent.key] = nodePositions[agent.key];
            }
        });
        
        setNodePositions(initialPositions);
    }, [subAgents]);

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
            const [config, allUsers, configsList, subAgentsList] = await Promise.all([
                getAiAgentConfig(),
                getUsers(),
                getChannelConfigs(),
                getSubAgents()
            ]);

            setUsers(allUsers);
            setChannelConfigs(configsList);
            setSubAgents(subAgentsList);
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

    // ── SUB-AGENTS HANDLERS ──────────────────────────────────────────────────
    const handleOpenCreateSubAgentModal = () => {
        setEditingSubAgent(null);
        setSubAgentKey('');
        setSubAgentName('');
        setSubAgentDescription('');
        setSubAgentContext('');
        setSubAgentTools([]);
        setIsSubAgentModalOpen(true);
    };

    const handleOpenEditSubAgentModal = (agent: any) => {
        setEditingSubAgent(agent);
        setSubAgentKey(agent.key);
        setSubAgentName(agent.name);
        setSubAgentDescription(agent.description || '');
        setSubAgentContext(agent.context || '');
        setSubAgentTools(agent.tools || []);
        setIsSubAgentModalOpen(true);
    };

    const handleSaveSubAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                id: editingSubAgent?.id || undefined,
                key: subAgentKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
                name: subAgentName,
                description: subAgentDescription,
                context: subAgentContext,
                tools: subAgentTools,
                isActive: editingSubAgent ? editingSubAgent.isActive : true
            };

            if (!payload.key) {
                showNotification('error', 'Error', 'La clave del agente es requerida.');
                return;
            }

            await saveSubAgent(payload);
            showNotification(
                'success',
                editingSubAgent ? 'Actualizado' : 'Creado',
                `Sub-Agente "${subAgentName}" guardado con éxito.`
            );
            setIsSubAgentModalOpen(false);

            const list = await getSubAgents();
            setSubAgents(list);
        } catch (err) {
            console.error('Error al guardar sub-agente:', err);
            showNotification('error', 'Error', 'No se pudo guardar el sub-agente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSubAgent = (id: string) => {
        setNotification({
            show: true,
            type: 'confirmation',
            title: '¿Estás seguro?',
            message: 'Esta acción eliminará de forma permanente al sub-agente seleccionado del CRM.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await deleteSubAgent(id);
                    setNotification({
                        show: true,
                        type: 'success',
                        title: 'Eliminado',
                        message: 'El sub-agente ha sido eliminado correctamente.',
                        onConfirm: hideNotification,
                        onCancel: hideNotification
                    });
                    const list = await getSubAgents();
                    setSubAgents(list);
                } catch (err) {
                    console.error('Error al eliminar sub-agente:', err);
                    setNotification({
                        show: true,
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo eliminar el sub-agente.',
                        onConfirm: hideNotification,
                        onCancel: hideNotification
                    });
                }
            },
            onCancel: hideNotification
        });
    };

    const handleToggleSubAgentStatus = async (agent: any) => {
        try {
            await saveSubAgent({
                id: agent.id,
                isActive: !agent.isActive
            });
            const list = await getSubAgents();
            setSubAgents(list);
        } catch (err) {
            console.error('Error al cambiar estatus del sub-agente:', err);
            showNotification('error', 'Error', 'No se pudo cambiar el estado del sub-agente.');
        }
    };

    // Drag-and-drop handlers
    const handleDragStart = (e: React.DragEvent, toolKey: string) => {
        e.dataTransfer.setData('text/plain', toolKey);
    };

    const handleDropToAssigned = (e: React.DragEvent) => {
        e.preventDefault();
        const toolKey = e.dataTransfer.getData('text/plain');
        if (toolKey && !subAgentTools.includes(toolKey)) {
            setSubAgentTools(prev => [...prev, toolKey]);
        }
    };

    const handleDropToAvailable = (e: React.DragEvent) => {
        e.preventDefault();
        const toolKey = e.dataTransfer.getData('text/plain');
        if (toolKey && subAgentTools.includes(toolKey)) {
            setSubAgentTools(prev => prev.filter(t => t !== toolKey));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const addTool = (toolKey: string) => {
        if (!subAgentTools.includes(toolKey)) {
            setSubAgentTools(prev => [...prev, toolKey]);
        }
    };

    const removeTool = (toolKey: string) => {
        setSubAgentTools(prev => prev.filter(t => t !== toolKey));
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeKey: string) => {
        e.preventDefault();
        setDraggingNode(nodeKey);
        const pos = nodePositions[nodeKey] || { x: 0, y: 0 };
        setDragOffset({
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!draggingNode) return;
        
        const newX = Math.max(10, Math.min(680, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(220, e.clientY - dragOffset.y));
        
        setNodePositions(prev => ({
            ...prev,
            [draggingNode]: { x: newX, y: newY }
        }));
    };

    const handleCanvasMouseUp = () => {
        setDraggingNode(null);
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
                <button
                    type="button"
                    onClick={() => setActiveTab('subagents')}
                    className={`pb-3 px-1 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'subagents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Sliders size={18} />
                    Sub-Agentes
                </button>
            </div>

            {activeTab === 'general' && (
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

                    {/* Orquestador de Agentes Interactivo */}
                    <div 
                        className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-sm relative overflow-hidden select-none"
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                            <div className="flex items-center gap-2">
                                <Sliders className="text-blue-500" size={20} />
                                <h4 className="font-bold text-slate-200 text-base">Orquestador de Agentes (Lienzo Interactivo)</h4>
                            </div>
                            <span className="text-[10px] text-slate-500">Arrastra para mover • Doble clic para editar prompt</span>
                        </div>

                        {/* CANVAS AREA */}
                        <div className="relative w-full h-[280px] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] rounded-xl border border-slate-800/80 overflow-hidden">
                            
                            {/* SVG CONNECTIONS OVERLAY */}
                            <svg className="absolute inset-0 pointer-events-none w-full h-full">
                                {Object.keys(nodePositions).map(key => {
                                    if (key === 'router') return null;
                                    const routerPos = nodePositions.router || { x: 330, y: 15 };
                                    const subPos = nodePositions[key];
                                    if (!subPos) return null;

                                    const fromX = routerPos.x + 90;
                                    const fromY = routerPos.y + 40;
                                    const toX = subPos.x + 80;
                                    const toY = subPos.y;

                                    const path = `M ${fromX} ${fromY} C ${fromX} ${(fromY + toY) / 2}, ${toX} ${(fromY + toY) / 2}, ${toX} ${toY}`;

                                    return (
                                        <g key={`line-${key}`}>
                                            <path 
                                                d={path} 
                                                fill="none" 
                                                stroke="#3b82f6" 
                                                strokeWidth="2" 
                                                strokeDasharray="4"
                                                opacity="0.6"
                                            />
                                            <circle cx={toX} cy={toY} r="3.5" fill="#3b82f6" />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* DRAGGABLE NODES */}
                            
                            {/* Router Node */}
                            {nodePositions.router && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${nodePositions.router.x}px`,
                                        top: `${nodePositions.router.y}px`,
                                        cursor: draggingNode === 'router' ? 'grabbing' : 'grab',
                                        zIndex: 10
                                    }}
                                    onMouseDown={(e) => handleNodeMouseDown(e, 'router')}
                                    onDoubleClick={() => {
                                        const textarea = document.getElementById('agentContext');
                                        if (textarea) {
                                            textarea.focus();
                                            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }}
                                    className="w-[180px] bg-slate-950 border border-blue-500/80 rounded-xl p-3 shadow-lg flex items-center gap-2 text-left select-none transition-shadow hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                                >
                                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                                        <Brain size={18} />
                                    </div>
                                    <div>
                                        <h5 className="font-extrabold text-[11px] text-slate-200 uppercase tracking-wider leading-none">Agente Principal</h5>
                                        <span className="text-[10px] text-slate-400">Enrutador (Router)</span>
                                    </div>
                                </div>
                            )}

                            {/* Sub-Agents Nodes */}
                            {subAgents.map(agent => {
                                const pos = nodePositions[agent.key];
                                if (!pos) return null;
                                
                                return (
                                    <div
                                        key={agent.id}
                                        style={{
                                            position: 'absolute',
                                            left: `${pos.x}px`,
                                            top: `${pos.y}px`,
                                            cursor: draggingNode === agent.key ? 'grabbing' : 'grab',
                                            zIndex: 5
                                        }}
                                        onMouseDown={(e) => handleNodeMouseDown(e, agent.key)}
                                        onDoubleClick={() => handleOpenEditSubAgentModal(agent)}
                                        className={`w-[160px] bg-slate-950 border rounded-xl p-2.5 shadow-md flex flex-col gap-1.5 text-left select-none hover:shadow-lg transition-all ${agent.isActive ? 'border-indigo-500/60' : 'border-slate-800 opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className={`p-1 bg-slate-800 rounded text-slate-400`}>
                                                <Sliders size={12} />
                                            </div>
                                            <div className="truncate">
                                                <h5 className="font-bold text-[10px] text-slate-200 truncate leading-tight">{agent.name}</h5>
                                                <span className="text-[8px] font-mono text-slate-500 block truncate">Key: {agent.key}</span>
                                            </div>
                                        </div>

                                        {/* Tools badges nested in Node */}
                                        <div className="flex flex-wrap gap-1 mt-1 border-t border-slate-900 pt-1.5">
                                            {agent.tools && agent.tools.length > 0 ? (
                                                agent.tools.slice(0, 2).map((t: string) => (
                                                    <span key={t} className="text-[8px] font-bold bg-blue-500/10 text-blue-400 px-1 py-0.2 rounded border border-blue-500/20 truncate max-w-full">
                                                        {t.replace('create', 'Crear').replace('modify', 'Mod').replace('register', 'Reg').replace('update', 'Act').replace('check', 'Cons')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[8px] text-slate-600 italic">Conversacional</span>
                                            )}
                                            {agent.tools && agent.tools.length > 2 && (
                                                <span className="text-[8px] bg-slate-850 text-slate-400 px-1 py-0.2 rounded">+{agent.tools.length - 2}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
            )}

            {activeTab === 'channels' && (
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

            {activeTab === 'subagents' && (
                // ── CONTENIDO: PESTAÑA SUB-AGENTES ──────────────────────────────
                <div className="space-y-6 text-left max-w-4xl animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                        <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                                    <Sliders className="text-blue-500" size={20} />
                                    Catálogo de Sub-Agentes IA
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Define agentes especializados para escenarios específicos y asígnales herramientas CRM específicas.
                                </p>
                            </div>
                            <Button 
                                type="button" 
                                variant="primary" 
                                className="text-xs font-bold flex items-center gap-1 cursor-pointer"
                                onClick={handleOpenCreateSubAgentModal}
                            >
                                <Plus size={14} /> Nuevo Sub-Agente
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {subAgents.map(agent => (
                                <div key={agent.id} className="border border-gray-150 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow bg-slate-50/20">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                                                    {agent.name}
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${agent.isActive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
                                                        {agent.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </h4>
                                                <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.2 rounded text-slate-500 mt-0.5 inline-block">Key: {agent.key}</span>
                                            </div>
                                            
                                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={agent.isActive}
                                                    onChange={() => handleToggleSubAgentStatus(agent)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed min-h-[32px]">
                                            {agent.description || 'Sin descripción.'}
                                        </p>

                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Herramientas Permitidas:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {agent.tools && agent.tools.length > 0 ? (
                                                    agent.tools.map((t: string) => {
                                                        const tool = AVAILABLE_TOOLS.find(at => at.key === t);
                                                        return (
                                                            <span key={t} className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">
                                                                {tool ? tool.label : t}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-[9px] font-bold bg-gray-50 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                                                        Ninguna (Solo final_answer)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-5 flex gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full text-xs py-1.5 font-bold cursor-pointer"
                                            onClick={() => handleOpenEditSubAgentModal(agent)}
                                        >
                                            <Edit2 size={12} className="inline mr-1" /> Configurar / Editar
                                        </Button>
                                        <button
                                            onClick={() => handleDeleteSubAgent(agent.id)}
                                            className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            title="Eliminar sub-agente"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {subAgents.length === 0 && (
                                <div className="col-span-2 text-center py-12 text-gray-400 text-xs">
                                    No hay sub-agentes configurados. Cree uno nuevo para comenzar.
                                </div>
                            )}
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

            {/* ── MODAL DE CONFIGURACIÓN DE SUB-AGENTE (CATÁLOGO / DRAG AND DROP) ───────── */}
            {isSubAgentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-scale-up text-left">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                                    <Sliders size={18} className="text-blue-500" />
                                    {editingSubAgent ? `Editar Sub-Agente: ${subAgentName}` : 'Crear Nuevo Sub-Agente'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">Define los parámetros de comportamiento y asigna herramientas del CRM.</p>
                            </div>
                            <button 
                                onClick={() => setIsSubAgentModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form / Content */}
                        <form onSubmit={handleSaveSubAgent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Clave Única (Key) - Minúsculas y guiones bajos"
                                    id="subAgentKey"
                                    type="text"
                                    value={subAgentKey}
                                    onChange={(e) => setSubAgentKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="Ej: soporte_tecnico"
                                    required
                                    disabled={!!editingSubAgent}
                                />
                                <Input
                                    label="Nombre del Sub-Agente"
                                    id="subAgentName"
                                    type="text"
                                    value={subAgentName}
                                    onChange={(e) => setSubAgentName(e.target.value)}
                                    placeholder="Ej: Agente de Soporte Técnico"
                                    required
                                />
                            </div>

                            <Input
                                label="Descripción para el Enrutamiento (Guía al Agente Router de cuándo invocarlo)"
                                id="subAgentDescription"
                                type="text"
                                value={subAgentDescription}
                                onChange={(e) => setSubAgentDescription(e.target.value)}
                                placeholder="Ej: Úsalo cuando el cliente tenga problemas técnicos con su cuenta o reporte caídas del servicio."
                                required
                            />

                            <div>
                                <label htmlFor="subAgentContext" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Instrucciones de Comportamiento / Prompt del Agente
                                </label>
                                <TextArea
                                    id="subAgentContext"
                                    value={subAgentContext}
                                    onChange={(e) => setSubAgentContext(e.target.value)}
                                    placeholder="Defina las instrucciones específicas de este sub-agente. Su tono de voz, políticas del área, productos específicos a calificar, etc."
                                    rows={6}
                                    required
                                />
                            </div>

                            {/* DRAG AND DROP PANEL */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Herramientas del CRM Habilitadas
                                </label>
                                <p className="text-[10px] text-gray-400 pb-1">Arrastra las tarjetas o haz clic en ellas para agregarlas o quitarlas del sub-agente.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* DISPONIBLES */}
                                    <div 
                                        className="border border-dashed border-gray-200 rounded-xl p-4 bg-slate-50 min-h-[220px]"
                                        onDragOver={handleDragOver}
                                        onDrop={handleDropToAvailable}
                                    >
                                        <h5 className="text-[10px] font-extrabold text-gray-400 uppercase mb-2 tracking-wider">Disponibles en el CRM</h5>
                                        <div className="space-y-2">
                                            {AVAILABLE_TOOLS.filter(tool => !subAgentTools.includes(tool.key)).map(tool => (
                                                <div
                                                    key={tool.key}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, tool.key)}
                                                    onClick={() => addTool(tool.key)}
                                                    className="bg-white border border-gray-150 rounded-lg p-2.5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs flex justify-between items-center group select-none"
                                                    title="Arrastra o haz clic para agregar"
                                                >
                                                    <div>
                                                        <span className="font-bold text-gray-700 block text-left">{tool.label}</span>
                                                        <span className="text-[10px] text-gray-400 block text-left leading-normal">{tool.desc}</span>
                                                    </div>
                                                    <span className="text-gray-300 font-extrabold group-hover:text-blue-500 transition-colors text-sm pr-1">+</span>
                                                </div>
                                            ))}
                                            {AVAILABLE_TOOLS.filter(tool => !subAgentTools.includes(tool.key)).length === 0 && (
                                                <div className="text-[10px] text-gray-400 text-center py-12">Todas las herramientas asignadas</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ASIGNADAS */}
                                    <div 
                                        className="border border-dashed border-blue-100 rounded-xl p-4 bg-blue-50/20 min-h-[220px]"
                                        onDragOver={handleDragOver}
                                        onDrop={handleDropToAssigned}
                                    >
                                        <h5 className="text-[10px] font-extrabold text-blue-500/75 uppercase mb-2 tracking-wider">Habilitadas para este Agente</h5>
                                        <div className="space-y-2">
                                            {subAgentTools.map(toolKey => {
                                                const tool = AVAILABLE_TOOLS.find(t => t.key === toolKey);
                                                if (!tool) return null;
                                                return (
                                                    <div
                                                        key={toolKey}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, toolKey)}
                                                        onClick={() => removeTool(toolKey)}
                                                        className="bg-white border border-blue-150 rounded-lg p-2.5 shadow-2xs hover:border-red-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs flex justify-between items-center group select-none"
                                                        title="Arrastra o haz clic para quitar"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-blue-900 block text-left">{tool.label}</span>
                                                            <span className="text-[10px] text-blue-500/75 block text-left leading-normal">{tool.desc}</span>
                                                        </div>
                                                        <span className="text-gray-300 font-extrabold group-hover:text-red-500 transition-colors text-sm pr-1">×</span>
                                                    </div>
                                                );
                                            })}
                                            {subAgentTools.length === 0 && (
                                                <div className="text-[10px] text-gray-400 text-center py-12">Arrastra herramientas aquí para habilitarlas</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer del Modal */}
                            <div className="flex justify-end gap-3 border-t border-gray-150 pt-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => setIsSubAgentModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold cursor-pointer"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="success" 
                                    loading={saving}
                                    className="px-4 py-2 text-xs font-bold cursor-pointer"
                                >
                                    Guardar Sub-Agente
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
