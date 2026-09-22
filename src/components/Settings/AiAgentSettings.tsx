import React, { useState, useEffect, useRef } from 'react';
import { 
    getAiAgentConfig, 
    saveAiAgentConfig,
    getChannelConfigs,
    getFacebookAuthUrl,
    saveChannelConfig,
    deleteChannelConfig,
    getSubAgents,
    saveSubAgent,
    deleteSubAgent,
    type ChannelConfig,
} from '../../services/conversationsService';
import { showToast } from '../../utils/toast';
import { getUsers } from '../../services/usersService';
import Button from '../shared/Button';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Select from '../shared/Select';
import Loader from '../Loader/Loader';
import Notification from '../Modal/Notification';
import SettingsContainer from '../shared/SettingsContainer';
import Modal from '../Modal/Modal';
import WhatsAppBaseTemplateSettings from './WhatsAppBaseTemplateSettings';
import { 
    Brain, 
    Sliders, 
    UserCheck, 
    Link2, 
    Smartphone, 
    Facebook, 
    Instagram, 
    Plus, 
    Trash2, 
    MessageSquare,
    CheckCircle,
    Maximize2,
    Minimize2,
    RefreshCw,
} from 'lucide-react';

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
    { key: 'createTicket', label: 'Crear Ticket de Soporte', desc: 'Levanta reportes en la mesa de ayuda.' },
    { key: 'consult_product_catalog', label: 'Consultar Catálogo de Productos', desc: 'Consulta especificaciones técnicas, compatibilidad, disponibilidad y precios de productos en Cube.dev y RAG.' }
];

const AiAgentSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<any[]>([]);


    
    // Tab State
    const initialTab = (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('tab') === 'channels' || new URLSearchParams(window.location.search).get('meta_oauth'))) ? 'channels' : 'general';
    const [activeTab, setActiveTab] = useState<'general' | 'channels'>(initialTab);

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
    const [openaiEmbeddingModel, setOpenaiEmbeddingModel] = useState('text-embedding-ada-002');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [watsonxApiKey, setWatsonxApiKey] = useState('');
    const [watsonxProjectId, setWatsonxProjectId] = useState('');
    const [watsonxRegion, setWatsonxRegion] = useState('us-south');
    const [watsonxEmbeddingModel, setWatsonxEmbeddingModel] = useState('ibm/slate-125m-english-rtrvr');

    // Reminder and assignment
    const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState(60);
    const [historyMessageLimit, setHistoryMessageLimit] = useState(10);
    const [maxNewTokens, setMaxNewTokens] = useState(7000);
    const [defaultUserId, setDefaultUserId] = useState('');

    // Channels states
    const [channelConfigs, setChannelConfigs] = useState<ChannelConfig[]>([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);
    const [connectingMetaChannel, setConnectingMetaChannel] = useState<'facebook' | 'instagram' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
    const [channelModalTab, setChannelModalTab] = useState<'credentials' | 'base-template'>('credentials');

    const metaMessageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);
    const metaStorageListenerRef = useRef<((event: StorageEvent) => void) | null>(null);
    const metaBroadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const metaPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const metaPopupRef = useRef<Window | null>(null);

    const cleanupMetaListeners = () => {
        if (metaMessageListenerRef.current) {
            window.removeEventListener('message', metaMessageListenerRef.current);
            metaMessageListenerRef.current = null;
        }
        if (metaStorageListenerRef.current) {
            window.removeEventListener('storage', metaStorageListenerRef.current);
            metaStorageListenerRef.current = null;
        }
        if (metaBroadcastChannelRef.current) {
            metaBroadcastChannelRef.current.close();
            metaBroadcastChannelRef.current = null;
        }
        if (metaPollIntervalRef.current) {
            clearInterval(metaPollIntervalRef.current);
            metaPollIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            cleanupMetaListeners();
            if (metaPopupRef.current && !metaPopupRef.current.closed) {
                metaPopupRef.current.close();
            }
        };
    }, []);

    // Listener global persistente para recargar canales tan pronto termine la conexión
    useEffect(() => {
        const handleOAuthGlobalResult = async (data: any) => {
            if (data?.type === 'META_OAUTH_SUCCESS') {
                setActiveTab('channels');
                showToast.success(data.payload?.message || '¡Canal de Meta conectado con éxito!');
                setIsLoadingChannels(true);
                try {
                    const list = await getChannelConfigs();
                    setChannelConfigs(list);
                    // Doble verificación diferida para asegurar sincronización en BD
                    setTimeout(async () => {
                        try {
                            const updated = await getChannelConfigs();
                            setChannelConfigs(updated);
                        } catch (e) {}
                    }, 1200);
                } catch (err) {
                    console.error('Error al recargar canales:', err);
                } finally {
                    setIsLoadingChannels(false);
                    setConnectingMetaChannel(null);
                }
            } else if (data?.type === 'META_OAUTH_ERROR') {
                showToast.error(data.payload?.message || 'Error al conectar con Meta.');
                setConnectingMetaChannel(null);
            }
        };

        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel('meta_oauth_channel');
            bc.onmessage = (event) => {
                handleOAuthGlobalResult(event.data);
            };
        } catch (e) {}

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'meta_oauth_result' && event.newValue) {
                try {
                    const parsed = JSON.parse(event.newValue);
                    localStorage.removeItem('meta_oauth_result');
                    handleOAuthGlobalResult(parsed);
                } catch (e) {}
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            if (bc) bc.close();
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

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
    const [subAgentTemperature, setSubAgentTemperature] = useState(0.7);

    // ORCHESTRATOR GRAPH STATES
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);
    
    // Pan, Zoom and Maximize states
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isMaximized, setIsMaximized] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
        if (subAgents.length === 0) {
            setNodePositions({});
            return;
        }
        
        const canvasWidth = canvasRef.current ? canvasRef.current.clientWidth : 840;
        const nodeWidth = 270;
        const newPositions: Record<string, { x: number; y: number }> = {
            router: { x: Math.max(10, (canvasWidth - nodeWidth) / 2), y: 15 }
        };
        
        const totalAgents = subAgents.length;
        const spacing = Math.min(310, Math.max(285, (canvasWidth - 40) / totalAgents));
        const totalRowWidth = (totalAgents - 1) * spacing + nodeWidth;
        const startX = Math.max(10, (canvasWidth - totalRowWidth) / 2);
        
        subAgents.forEach((agent, index) => {
            newPositions[agent.key] = {
                x: startX + index * spacing,
                y: 150
            };
        });
        
        setNodePositions(newPositions);
    }, [subAgents, isMaximized]);

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
            setIsLoadingChannels(true);
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
            setOpenaiEmbeddingModel(config.openaiEmbeddingModel || 'text-embedding-ada-002');
            setGeminiApiKey(config.geminiApiKey || '');
            setWatsonxApiKey(config.watsonxApiKey || '');
            setWatsonxProjectId(config.watsonxProjectId || '');
            setWatsonxRegion(config.watsonxRegion || 'us-south');
            setWatsonxEmbeddingModel(config.watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr');
            setReminderOffsetMinutes(config.reminderOffsetMinutes);
            setHistoryMessageLimit(config.historyMessageLimit || 10);
            setMaxNewTokens(config.maxNewTokens || 700);
            setDefaultUserId(config.defaultUserId || '');
        } catch (error) {
            console.error('Error al cargar configuraciones del agente IA:', error);
            showNotification('error', 'Error', 'No se pudieron cargar las configuraciones del agente IA.');
        } finally {
            setLoading(false);
            setIsLoadingChannels(false);
        }
    };

    const handleRefreshChannels = async () => {
        try {
            setIsLoadingChannels(true);
            const list = await getChannelConfigs();
            setChannelConfigs(list);
            showNotification('success', 'Sincronizado', 'Canales sincronizados exitosamente con Meta Graph API.');
        } catch (error) {
            console.error('Error al sincronizar canales con Meta:', error);
            showNotification('error', 'Error', 'No se pudieron sincronizar los canales con Meta.');
        } finally {
            setIsLoadingChannels(false);
        }
    };

    useEffect(() => {
        loadSettings();

        // Verificar si la pantalla cargó con parámetros de meta_oauth
        const params = new URLSearchParams(window.location.search);
        if (params.get('meta_oauth') === 'success') {
            setActiveTab('channels');
            showToast.success(params.get('message') || '¡Canal conectado con éxito!');
            handleRefreshChannels();
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('meta_oauth') === 'error') {
            showToast.error(params.get('message') || 'Error al conectar con Meta.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
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
                openaiEmbeddingModel: openaiEmbeddingModel || 'text-embedding-ada-002',
                geminiApiKey: geminiApiKey || null,
                watsonxApiKey: watsonxApiKey || null,
                watsonxProjectId: watsonxProjectId || null,
                watsonxRegion: watsonxRegion || 'us-south',
                watsonxEmbeddingModel: watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr',
                reminderOffsetMinutes,
                historyMessageLimit,
                maxNewTokens,
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

    const handleSaveRouterPrompt = async (e: React.FormEvent) => {
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
                openaiEmbeddingModel: openaiEmbeddingModel || 'text-embedding-ada-002',
                geminiApiKey: geminiApiKey || null,
                watsonxApiKey: watsonxApiKey || null,
                watsonxProjectId: watsonxProjectId || null,
                watsonxRegion: watsonxRegion || 'us-south',
                watsonxEmbeddingModel: watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr',
                reminderOffsetMinutes,
                maxNewTokens,
                defaultUserId: defaultUserId || null,
            });
            showNotification('success', 'Guardado', 'Prompt del Enrutador Principal guardado con éxito.');
            setIsRouterModalOpen(false);
        } catch (error) {
            console.error('Error al guardar prompt del enrutador:', error);
            showNotification('error', 'Error al Guardar', 'Ocurrió un error al guardar el prompt del enrutador.');
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
        setSubAgentTemperature(0.7);
        setIsSubAgentModalOpen(true);
    };

    const handleOpenEditSubAgentModal = (agent: any) => {
        setEditingSubAgent(agent);
        setSubAgentKey(agent.key);
        setSubAgentName(agent.name);
        setSubAgentDescription(agent.description || '');
        setSubAgentContext(agent.context || '');
        setSubAgentTools(agent.tools || []);
        setSubAgentTemperature(agent.temperature ?? 0.7);
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
                temperature: subAgentTemperature,
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
        e.stopPropagation();
        setDraggingNode(nodeKey);
        if (!canvasRef.current) return;
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const pos = nodePositions[nodeKey] || { x: 0, y: 0 };
        
        // Calculate offset directly from the node's current local position
        setDragOffset({
            x: (e.clientX - canvasRect.left) - pos.x,
            y: (e.clientY - canvasRect.top) - pos.y
        });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Only initiate panning if the click is on the canvas background, SVG viewport, or path
        const target = e.target as HTMLElement;
        const isCanvasBackground = target === canvasRef.current || target.tagName === 'svg' || target.tagName === 'path';
        if (isCanvasBackground) {
            setIsPanning(true);
            setPanStart({
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y
            });
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            const newX = e.clientX - panStart.x;
            const newY = e.clientY - panStart.y;
            setPanOffset({ x: newX, y: newY });
            return;
        }

        if (!draggingNode || !canvasRef.current) return;
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        let newX = (e.clientX - canvasRect.left) - dragOffset.x;
        let newY = (e.clientY - canvasRect.top) - dragOffset.y;
        
        // Allow free dragging with large outer canvas bounds
        newX = Math.max(-1000, Math.min(3000, newX));
        newY = Math.max(-500, Math.min(1500, newY));
        
        setNodePositions(prev => ({
            ...prev,
            [draggingNode]: { x: newX, y: newY }
        }));
    };

    const handleCanvasMouseUp = () => {
        setDraggingNode(null);
        setIsPanning(false);
    };

    // ── GESTIÓN DE CANALES (CRUD FRONTEND) ────────────────────────────────────

    const handleOpenCreateModal = (type: 'whatsapp' | 'facebook' | 'instagram' = 'whatsapp') => {
        if (type === 'facebook' || type === 'instagram') {
            handleConnectMeta(type);
            return;
        }
        setChannelType(type);
        setEditingChannel(null);
        setChannelName('');
        setAppId('');
        setAccountId('');
        setPhoneNumberId('');
        setAccessToken('');
        setVerifyToken('');
        setChannelModalTab('credentials');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (config: ChannelConfig) => {
        if (config.channel === 'facebook' || config.channel === 'instagram') {
            handleConnectMeta(config.channel as 'facebook' | 'instagram');
            return;
        }
        setEditingChannel(config);
        setChannelType(config.channel as 'whatsapp' | 'facebook' | 'instagram');
        setChannelName(config.name || '');
        setAppId(config.appId || '');
        setAccountId(config.accountId || '');
        setPhoneNumberId(config.phoneNumberId || '');
        setAccessToken(config.accessToken || '');
        setVerifyToken(config.verifyToken || '');
        setChannelModalTab('credentials');
        setIsModalOpen(true);
    };

    const handleConnectMeta = async (channel: 'facebook' | 'instagram') => {
        setConnectingMetaChannel(channel);
        cleanupMetaListeners();

        try {
            const response = await getFacebookAuthUrl(channel);
            const authUrl = response?.authUrl || (response as any)?.data?.authUrl;

            if (!authUrl) {
                throw new Error('No se recibió la URL de autenticación de Meta.');
            }

            const width = 600;
            const height = 750;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                authUrl,
                'meta-oauth-popup',
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=no`
            );

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                setConnectingMetaChannel(null);
                showToast.error('La ventana emergente fue bloqueada por tu navegador. Permite las ventanas emergentes e intenta de nuevo.');
                return;
            }

            metaPopupRef.current = popup;

            const onOAuthResult = (data: any) => {
                cleanupMetaListeners();
                if (metaPopupRef.current && !metaPopupRef.current.closed) {
                    try {
                        metaPopupRef.current.close();
                    } catch (e) {
                        console.warn('No se pudo cerrar popup desde ventana principal:', e);
                    }
                }
                if (data?.type === 'META_OAUTH_SUCCESS') {
                    showToast.success(data.payload?.message || `¡Canal ${channel === 'facebook' ? 'Facebook' : 'Instagram'} conectado con éxito!`);
                    setIsLoadingChannels(true);
                    getChannelConfigs()
                        .then(list => setChannelConfigs(list))
                        .catch(err => console.error('Error al recargar canales:', err))
                        .finally(() => setIsLoadingChannels(false));
                } else if (data?.type === 'META_OAUTH_ERROR') {
                    showToast.error(data.payload?.message || 'Error al conectar con Meta.');
                }
                setConnectingMetaChannel(null);
            };

            // 1. Escuchar por window postMessage
            const messageListener = (event: MessageEvent) => {
                if (event.data?.type === 'META_OAUTH_SUCCESS' || event.data?.type === 'META_OAUTH_ERROR') {
                    onOAuthResult(event.data);
                }
            };
            metaMessageListenerRef.current = messageListener;
            window.addEventListener('message', messageListener);

            // 2. Escuchar por BroadcastChannel (Brave / navegadores estrictos)
            try {
                const bc = new BroadcastChannel('meta_oauth_channel');
                bc.onmessage = (event) => {
                    if (event.data?.type === 'META_OAUTH_SUCCESS' || event.data?.type === 'META_OAUTH_ERROR') {
                        onOAuthResult(event.data);
                    }
                };
                metaBroadcastChannelRef.current = bc;
            } catch (e) {
                console.warn('BroadcastChannel no soportado:', e);
            }

            // 3. Escuchar por evento de almacenamiento (localStorage)
            const storageListener = (event: StorageEvent) => {
                if (event.key === 'meta_oauth_result' && event.newValue) {
                    try {
                        const parsed = JSON.parse(event.newValue);
                        if (parsed?.type === 'META_OAUTH_SUCCESS' || parsed?.type === 'META_OAUTH_ERROR') {
                            localStorage.removeItem('meta_oauth_result');
                            onOAuthResult(parsed);
                        }
                    } catch (e) {
                        console.warn('Error leyendo storage de OAuth:', e);
                    }
                }
            };
            metaStorageListenerRef.current = storageListener;
            window.addEventListener('storage', storageListener);

            metaPollIntervalRef.current = setInterval(() => {
                if (popup.closed) {
                    cleanupMetaListeners();
                    setConnectingMetaChannel(null);
                }
            }, 1000);
        } catch (error: any) {
            cleanupMetaListeners();
            setConnectingMetaChannel(null);
            showToast.error(error.response?.data?.message || error.message || 'No se pudo iniciar la conexión con Meta.');
        }
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
            setIsLoadingChannels(true);
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
            setIsLoadingChannels(false);
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
                    setIsLoadingChannels(true);
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
                } finally {
                    setIsLoadingChannels(false);
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
        <SettingsContainer
            title="Agente IA y Canales"
            description="Configura la respuesta automática de la IA y gestiona los canales y sub-agentes asignados."
            icon={<Brain size={18} />}
        >
            <Notification
                show={notification.show}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onConfirm={notification.onConfirm}
                onCancel={notification.onCancel}
            />

            {/* Pestañas de Configuración */}
            <div className="flex gap-6 border-b border-gray-200 pb-px mb-6 w-full text-left">
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

            {activeTab === 'general' && (
                // ── CONTENIDO: CONFIGURACIÓN GENERAL (IA) ─────────────────────────
                <form onSubmit={handleSave} className="space-y-6 text-left w-full">
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

                    {/* ═══ ORQUESTADOR DE AGENTES INTERACTIVO ═══ */}
                    <div
                        className={isMaximized 
                            ? "fixed inset-0 bg-white z-[60] flex flex-col overflow-hidden select-none animate-fade-in" 
                            : "bg-white rounded-2xl border border-gray-150 shadow-sm relative overflow-hidden select-none"
                        }
                        style={isMaximized ? { margin: 0, padding: 0, width: '100vw', height: '100vh', zIndex: 60 } : {}}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        onMouseDown={handleCanvasMouseDown}
                    >
                        {/* Header */}
                        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100">
                                    <Brain className="text-blue-600" size={17} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">Orquestador de Agentes</h4>
                                        {isMaximized && (
                                            <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pantalla Completa</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Arrastra para mover • Doble clic para editar • Mantén click fuera de los nodos para desplazar vista</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title={isMaximized ? "Cerrar pantalla completa" : "Maximizar orquestador"}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-200 transition-all duration-150 cursor-pointer shadow-2xs"
                                >
                                    {isMaximized ? (
                                        <>
                                            <Minimize2 size={11} className="text-gray-500" />
                                            Minimizar
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 size={11} className="text-gray-500" />
                                            Maximizar
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenCreateSubAgentModal}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all duration-150 cursor-pointer border-none"
                                >
                                    <Plus size={12} />
                                    Nuevo Sub-Agente
                                </button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div
                            ref={canvasRef}
                            className="relative w-full overflow-hidden bg-slate-50/50"
                            style={{
                                height: isMaximized ? 'calc(100vh - 120px)' : '340px',
                                backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
                                backgroundSize: '24px 24px',
                                backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
                                cursor: isPanning ? 'grabbing' : 'default'
                            }}
                        >
                            {/* SVG Connections */}
                            <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ overflow: 'visible' }}>
                                <defs>
                                    <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>
                                {subAgents.map(agent => {
                                    const routerPos = nodePositions.router;
                                    const subPos = nodePositions[agent.key];
                                    if (!routerPos || !subPos) return null;

                                    const fromX = routerPos.x + 135 + panOffset.x;
                                    const fromY = routerPos.y + 54 + panOffset.y;
                                    const toX = subPos.x + 135 + panOffset.x;
                                    const toY = subPos.y + panOffset.y;

                                    const midY = (fromY + toY) / 2;
                                    const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

                                    return (
                                        <g key={`conn-${agent.key}`}>
                                            {/* Glow path under active line */}
                                            {agent.isActive && (
                                                <path d={path} fill="none"
                                                    stroke="rgba(37,99,235,0.15)"
                                                    strokeWidth="4" />
                                            )}
                                            {/* Main path line */}
                                            <path d={path} fill="none"
                                                stroke={agent.isActive ? "#2563eb" : "#94a3b8"}
                                                strokeWidth={agent.isActive ? "2" : "1.2"}
                                                strokeDasharray={agent.isActive ? "6 3" : "4 4"}
                                                opacity={agent.isActive ? "1" : "0.5"}
                                                filter={agent.isActive ? "url(#glow-blue)" : undefined}
                                            />
                                            {/* Destination arrow dot */}
                                            <circle cx={toX} cy={toY} r="4"
                                                fill={agent.isActive ? "#2563eb" : "#94a3b8"}
                                                opacity={agent.isActive ? "1" : "0.6"}
                                            />
                                            {/* Source dot */}
                                            <circle cx={fromX} cy={fromY} r="3"
                                                fill={agent.isActive ? "#2563eb" : "#94a3b8"}
                                                opacity={agent.isActive ? "1" : "0.6"}
                                            />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Empty State */}
                            {subAgents.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                                    <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm backdrop-blur-sm">
                                        <Sliders size={28} className="text-gray-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-600 text-xs font-semibold">No hay sub-agentes configurados</p>
                                        <p className="text-gray-400 text-[10px] mt-0.5">Haz clic en "Nuevo Sub-Agente" para comenzar</p>
                                    </div>
                                </div>
                            )}

                            {/* ── ROUTER NODE ── */}
                            {nodePositions.router && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${nodePositions.router.x + panOffset.x}px`,
                                        top: `${nodePositions.router.y + panOffset.y}px`,
                                        cursor: draggingNode === 'router' ? 'grabbing' : 'grab',
                                        zIndex: draggingNode === 'router' ? 30 : 10,
                                        width: '270px',
                                        background: '#ffffff',
                                        transition: draggingNode === 'router' ? 'none' : 'box-shadow 150ms',
                                    }}
                                    onMouseDown={(e) => handleNodeMouseDown(e, 'router')}
                                    onDoubleClick={() => setIsRouterModalOpen(true)}
                                    className={`rounded-2xl p-3.5 flex items-center gap-3.5 text-left select-none transition-transform duration-150 border ${
                                        draggingNode === 'router'
                                            ? 'scale-105 border-blue-500 shadow-[0_8px_30px_rgba(37,99,235,0.18),0_4px_12px_rgba(0,0,0,0.05)]'
                                            : 'border-blue-600/70 shadow-[0_4px_12px_rgba(37,99,235,0.06)] hover:border-blue-600 hover:shadow-[0_6px_16px_rgba(37,99,235,0.12)]'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className="relative shrink-0">
                                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                                            <Brain size={22} className="text-blue-600" />
                                        </div>
                                        {/* Status pulse */}
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white shadow-[0_0_4px_rgba(37,99,235,0.6)] animate-pulse" />
                                    </div>
                                    <div className="min-w-0">
                                        <h5 className="font-extrabold text-[12px] text-gray-800 uppercase tracking-wider leading-none truncate">Agente Principal</h5>
                                        <span className="text-[10px] text-blue-600 font-mono block mt-1 truncate">Router (Enrutador)</span>
                                    </div>
                                </div>
                            )}

                            {/* ── SUBAGENT NODES ── */}
                            {subAgents.map(agent => {
                                const pos = nodePositions[agent.key];
                                if (!pos) return null;

                                const isDragging = draggingNode === agent.key;

                                return (
                                    <div
                                        key={agent.id}
                                        onMouseDown={(e) => handleNodeMouseDown(e, agent.key)}
                                        onDoubleClick={() => handleOpenEditSubAgentModal(agent)}
                                        style={{
                                            position: 'absolute',
                                            left: `${pos.x + panOffset.x}px`,
                                            top: `${pos.y + panOffset.y}px`,
                                            cursor: isDragging ? 'grabbing' : 'grab',
                                            zIndex: isDragging ? 20 : 5,
                                            width: '270px',
                                            background: '#ffffff',
                                            transition: isDragging ? 'none' : 'box-shadow 150ms, opacity 200ms',
                                        }}
                                        className={`rounded-2xl p-4 flex flex-col gap-2.5 text-left select-none border transition-transform duration-150 ${
                                            isDragging
                                                ? 'scale-105 border-indigo-500 shadow-[0_8px_30px_rgba(99,102,241,0.18),0_4px_12px_rgba(0,0,0,0.05)]'
                                                : agent.isActive
                                                    ? 'border-indigo-500/70 shadow-[0_4px_12px_rgba(99,102,241,0.06)] hover:border-indigo-500 hover:shadow-[0_6px_16px_rgba(99,102,241,0.12)]'
                                                    : 'border-gray-200 shadow-sm opacity-60 hover:opacity-85'
                                        }`}
                                    >
                                        {/* Node header */}
                                        <div className="flex items-start justify-between gap-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`p-2.5 rounded-lg border shrink-0 ${agent.isActive ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                                    <Sliders size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-extrabold text-xs text-gray-800 truncate leading-none">{agent.name}</h5>
                                                    <span className="text-[9px] font-mono text-gray-400 block truncate mt-0.5">{agent.key}</span>
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => { e.stopPropagation(); handleToggleSubAgentStatus(agent); }}
                                                    title={agent.isActive ? 'Desactivar' : 'Activar'}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                                                        agent.isActive
                                                            ? 'text-emerald-600 hover:bg-emerald-50'
                                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSubAgent(agent.id); }}
                                                    title="Eliminar agente"
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Temperature badge */}
                                        <div className="flex items-center justify-between gap-1 border-t border-gray-100 pt-2">
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                                agent.isActive
                                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                    : 'text-gray-500 bg-gray-50 border-gray-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                {agent.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full" title="Temperatura del sub-agente">
                                                🌡 {agent.temperature ?? 0.7}
                                            </span>
                                        </div>

                                        {/* Tools row */}
                                        <div className="flex items-center justify-end gap-1">
                                                {agent.tools && agent.tools.length > 0 ? (
                                                    <>
                                                        {agent.tools.slice(0, 2).map((t: string) => (
                                                            <span key={t} className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-[55px]">
                                                                {t.replace('createOpportunity','Opp').replace('modifyOpportunity','Mod').replace('registerActivity','Act').replace('updateContact','Ctc').replace('checkFollowUps','Fup')}
                                                            </span>
                                                        ))}
                                                        {agent.tools.length > 2 && (
                                                            <span className="text-[8px] text-gray-500 font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                                                +{agent.tools.length - 2}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[8px] text-gray-400 italic">conversacional</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                            })}
                        </div>

                        {/* Legend footer */}
                        <div className="relative flex items-center justify-between px-6 py-3 border-t border-gray-150 bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#2563eb" strokeWidth="1.8" strokeDasharray="4 2" /></svg>
                                    <span className="text-[9px] text-gray-600 font-medium">Flujo activo</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" /></svg>
                                    <span className="text-[9px] text-gray-400 font-medium">Inactivo</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Brain size={9} className="text-blue-600" />
                                    <span className="text-[9px] text-gray-600 font-medium">Enrutador</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Sliders size={9} className="text-indigo-600" />
                                    <span className="text-[9px] text-gray-600 font-medium">Sub-agente</span>
                                </div>
                            </div>
                            <span className="text-[9px] text-gray-500">
                                {subAgents.filter(a => a.isActive).length} / {subAgents.length} activos
                            </span>
                        </div>
                    </div>

                    {/* Parámetros de la IA */}
                    <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                            <Sliders className="text-amber-500" size={20} />
                            <h4 className="font-bold text-gray-800 text-base">Parámetros de la IA del Tenant</h4>
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

                        <div className="pt-4 border-t border-gray-100 space-y-1">
                            <label htmlFor="historyMessageLimit" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Límite de Historial de Mensajes para la IA (Omnicanal)
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Total global de mensajes más recientes del cliente recuperados entre todos sus canales (WhatsApp, Messenger, Instagram, WebChat) enviados como contexto al modelo de IA.
                            </p>
                            <Input
                                id="historyMessageLimit"
                                type="number"
                                min={3}
                                max={50}
                                value={historyMessageLimit}
                                onChange={(e) => setHistoryMessageLimit(parseInt(e.target.value) || 10)}
                                placeholder="Ej: 10"
                            />
                        </div>
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
                <div className="space-y-6 text-left w-full animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                        <div className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                                    <MessageSquare className="text-indigo-500" size={20} />
                                    Canales de Comunicación (Meta APIs)
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Conecta tus cuentas de WhatsApp Cloud API, Facebook Messenger y cuentas de Instagram Business para recibir chats y responder desde el CRM.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRefreshChannels}
                                disabled={isLoadingChannels}
                                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                title="Sincronizar canales con Meta Graph API en tiempo real"
                            >
                                <RefreshCw size={13} className={isLoadingChannels ? 'animate-spin text-indigo-600' : ''} />
                                <span>{isLoadingChannels ? 'Sincronizando...' : 'Sincronizar Meta'}</span>
                            </button>
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
                                            {isLoadingChannels ? (
                                                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 animate-pulse">
                                                    <RefreshCw size={9} className="animate-spin" /> Verificando...
                                                </span>
                                            ) : whatsappConfig ? (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <CheckCircle size={10} /> Conectado
                                                </span>
                                            ) : null}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Conecta tu cuenta de WhatsApp Cloud API para responder a tus clientes y automatizar la captura de prospectos con el agente IA.
                                        </p>
                                    </div>

                                    {isLoadingChannels ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                                            <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                                            <div className="h-3.5 bg-gray-300 rounded w-2/3"></div>
                                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ) : whatsappConfig ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-gray-600 space-y-2 font-medium">
                                            <div>
                                                <strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">
                                                    NOMBRE DE CUENTA OFICIAL
                                                </strong>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {whatsappConfig.metaDetails?.profile_picture_url && (
                                                        <img 
                                                            src={whatsappConfig.metaDetails.profile_picture_url} 
                                                            alt="WhatsApp Avatar" 
                                                            className="w-5 h-5 rounded-full object-cover border border-emerald-200 shrink-0" 
                                                        />
                                                    )}
                                                    <span className="font-bold text-gray-800 text-xs">
                                                        {whatsappConfig.waVerifiedName || whatsappConfig.name || 'Sin nombre registrado'}
                                                    </span>
                                                    {whatsappConfig.waVerifiedName && (
                                                        <span title="Nombre verificado por Meta" className="inline-flex text-emerald-600">
                                                            <CheckCircle size={12} />
                                                        </span>
                                                    )}
                                                </div>
                                                {(whatsappConfig.phoneNumberId || whatsappConfig.metaDetails?.display_phone_number) && (
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        {whatsappConfig.metaDetails?.display_phone_number || whatsappConfig.phoneNumberId}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="pt-5 flex flex-wrap gap-2">
                                    <Button 
                                        type="button" 
                                        variant={whatsappConfig ? "secondary" : "primary"}
                                        disabled={isLoadingChannels}
                                        className="flex-grow text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                                        onClick={() => whatsappConfig ? handleOpenEditModal(whatsappConfig) : handleOpenCreateModal('whatsapp')}
                                    >
                                        {isLoadingChannels ? 'Cargando...' : whatsappConfig ? 'Configurar / Editar' : 'Link Account'}
                                    </Button>
                                    {whatsappConfig && !isLoadingChannels && (
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
                                            {isLoadingChannels ? (
                                                <span className="flex items-center gap-1 text-[10px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 animate-pulse">
                                                    <RefreshCw size={9} className="animate-spin" /> Verificando...
                                                </span>
                                            ) : facebookConfig ? (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <CheckCircle size={10} /> Conectado
                                                </span>
                                            ) : null}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Gestiona tus páginas de Facebook, responde a los chats de Messenger y programa las publicaciones de tus prospectos de forma interactiva.
                                        </p>
                                    </div>

                                    {isLoadingChannels ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                                            <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                                            <div className="h-3.5 bg-gray-300 rounded w-2/3"></div>
                                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ) : facebookConfig ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-gray-600 space-y-1.5 font-medium">
                                            <div>
                                                <strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">
                                                    PÁGINA DE FACEBOOK CONECTADA
                                                </strong>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {facebookConfig.metaDetails?.profile_picture_url && (
                                                        <img 
                                                            src={facebookConfig.metaDetails.profile_picture_url} 
                                                            alt="Facebook Avatar" 
                                                            className="w-5 h-5 rounded-full object-cover border border-blue-200 shrink-0" 
                                                        />
                                                    )}
                                                    <span className="font-bold text-gray-800 text-xs">
                                                        {facebookConfig.fbPageName || facebookConfig.name || 'Fan Page no detectada'}
                                                    </span>
                                                </div>
                                                {facebookConfig.accountId && (
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        ID: {facebookConfig.accountId}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="pt-5 flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={facebookConfig ? "secondary" : "primary"}
                                        disabled={isLoadingChannels || connectingMetaChannel !== null}
                                        loading={connectingMetaChannel === 'facebook'}
                                        className="w-full text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                                        onClick={() => handleConnectMeta('facebook')}
                                    >
                                        {isLoadingChannels ? 'Cargando...' : facebookConfig ? 'Reconectar con Meta' : 'Conectar con Meta'}
                                    </Button>
                                    {facebookConfig && !isLoadingChannels && (
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
                                            {isLoadingChannels ? (
                                                <span className="flex items-center gap-1 text-[10px] text-pink-700 font-medium bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100 animate-pulse">
                                                    <RefreshCw size={9} className="animate-spin" /> Verificando...
                                                </span>
                                            ) : instagramConfig ? (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <CheckCircle size={10} /> Conectado
                                                </span>
                                            ) : null}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Administra tus cuentas comerciales de Instagram, recibe las consultas por mensaje directo y automatiza la captura de datos con el agente IA.
                                        </p>
                                    </div>

                                    {isLoadingChannels ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                                            <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                                            <div className="h-3.5 bg-gray-300 rounded w-2/3"></div>
                                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ) : instagramConfig ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-gray-600 space-y-1.5 font-medium">
                                            <div>
                                                <strong className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block">
                                                    CUENTA INSTAGRAM BUSINESS
                                                </strong>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {instagramConfig.metaDetails?.profile_picture_url && (
                                                        <img 
                                                            src={instagramConfig.metaDetails.profile_picture_url} 
                                                            alt="Instagram Avatar" 
                                                            className="w-5 h-5 rounded-full object-cover border border-pink-200 shrink-0" 
                                                        />
                                                    )}
                                                    <span className="font-bold text-gray-800 text-xs text-pink-700">
                                                        {instagramConfig.metaProfileName || (instagramConfig.igUsername ? `@${instagramConfig.igUsername}` : instagramConfig.name)}
                                                    </span>
                                                </div>
                                                {instagramConfig.accountId && (
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        ID: {instagramConfig.accountId}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="pt-5 flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={instagramConfig ? "secondary" : "primary"}
                                        disabled={isLoadingChannels || connectingMetaChannel !== null}
                                        loading={connectingMetaChannel === 'instagram'}
                                        className="w-full text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                                        onClick={() => handleConnectMeta('instagram')}
                                    >
                                        {isLoadingChannels ? 'Cargando...' : instagramConfig ? 'Reconectar con Meta' : 'Conectar con Meta'}
                                    </Button>
                                    {instagramConfig && !isLoadingChannels && (
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


            {/* ── MODAL DE CONFIGURACIÓN DE CREDENCIALES DE WHATSAPP ───────────────────── */}
            <Modal 
                open={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                maxWidth={editingChannel && channelModalTab === 'base-template' ? 'max-w-4xl' : 'max-w-lg'} 
                height="h-auto max-h-[90vh]"
            >
                {/* Header */}
                <div className="pb-4 border-b border-gray-150 flex justify-between items-center pr-8 text-left">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                            <Smartphone size={18} className="text-emerald-500" />
                            {editingChannel ? `Configuración WhatsApp: ${channelName || editingChannel.name}` : 'Conectar WhatsApp Cloud API'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {channelModalTab === 'base-template'
                                ? 'Gestiona la plantilla oficial pre-aprobada para iniciar y reanudar conversaciones con impacto directo en Meta.'
                                : 'Rellene los campos requeridos obtenidos de Meta for Developers para WhatsApp.'}
                        </p>
                    </div>
                </div>

                {/* Switcher de pestañas cuando se edita WhatsApp */}
                {editingChannel && (
                    <div className="flex gap-2 border-b border-gray-150 pt-3 pb-2 text-left">
                        <button
                            type="button"
                            onClick={() => setChannelModalTab('credentials')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                channelModalTab === 'credentials'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            Credenciales & Webhook
                        </button>
                        <button
                            type="button"
                            onClick={() => setChannelModalTab('base-template')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                channelModalTab === 'base-template'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <span>Plantilla Base de Inicio</span>
                        </button>
                    </div>
                )}

                {editingChannel && channelModalTab === 'base-template' ? (
                    <div className="mt-4">
                        <WhatsAppBaseTemplateSettings 
                            channelConfig={editingChannel}
                            onNotification={(type, title, message) => showNotification(type, title, message)}
                        />
                    </div>
                ) : (
                    /* Formulario de credenciales WhatsApp */
                    <form onSubmit={handleSaveChannel} className="mt-4 space-y-4 text-left">
                        <div>
                            <Input 
                                label="Nombre descriptivo de la Cuenta (Nombre)"
                                id="channelName"
                                type="text"
                                value={channelName}
                                onChange={(e: any) => setChannelName(e.target.value)}
                                placeholder="Ej: Cuenta Principal de Ventas WhatsApp"
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
                                    label="WhatsApp Business Account ID"
                                    id="accountId"
                                    type="text"
                                    value={accountId}
                                    onChange={(e: any) => setAccountId(e.target.value)}
                                    placeholder="Ej: 1234567890"
                                    required
                                />
                            </div>
                        </div>

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

                        <div>
                            <Input 
                                label="Token de Acceso Permanente (Access Token)"
                                id="accessToken"
                                type="password"
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="Ingrese el Token permanente generado de Meta"
                                required
                            />
                        </div>

                        <div>
                            <Input 
                                label="Token de Verificación del Webhook (Verify Token)"
                                id="verifyToken"
                                type="text"
                                value={verifyToken}
                                onChange={(e) => setVerifyToken(e.target.value)}
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
                                        {(import.meta.env.VITE_BASE_URL || 'http://localhost:3091')}/api/conversations/webhook/whatsapp
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
                )}
            </Modal>

            {/* ── MODAL DE CONFIGURACIÓN DE SUB-AGENTE (CATÁLOGO / DRAG AND DROP) ───────── */}
            <Modal open={isSubAgentModalOpen} onClose={() => setIsSubAgentModalOpen(false)} maxWidth="max-w-2xl" height="h-[95vh]">
                {/* Header */}
                <div className="pb-4 border-b border-gray-150 flex justify-between items-center pr-8 text-left">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                            <Sliders size={18} className="text-blue-500" />
                            {editingSubAgent ? `Editar Sub-Agente: ${subAgentName}` : 'Crear Nuevo Sub-Agente'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Define los parámetros de comportamiento y asigna herramientas del CRM.</p>
                    </div>
                </div>

                {/* Form / Content */}
                <form onSubmit={handleSaveSubAgent} className="mt-4 space-y-4 text-left">
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

                    {/* TEMPERATURE SLIDER */}
                    <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Temperatura del Sub-Agente (Creatividad vs Precisión)
                            </label>
                            <span className="text-sm font-bold text-blue-600">{subAgentTemperature}</span>
                        </div>
                        <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={subAgentTemperature}
                            onChange={(e) => setSubAgentTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 font-medium">
                            <span>Preciso (0.0)</span>
                            <span>Creativo (1.0)</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            Para sub-agentes <strong>comerciales</strong> o de <strong>consulta de catálogo</strong>, se recomienda una temperatura <strong>baja (0.1 — 0.3)</strong> para evitar que la IA invente productos o precios. Para sub-agentes <strong>conversacionales</strong> o de <strong>atención general</strong>, una temperatura <strong>media-alta (0.5 — 0.7)</strong> genera respuestas más naturales.
                        </p>
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
            </Modal>

            {/* ── MODAL DE CONFIGURACIÓN DEL AGENTE PRINCIPAL (ENRUTADOR) ───────── */}
            <Modal open={isRouterModalOpen} onClose={() => setIsRouterModalOpen(false)} maxWidth="max-w-2xl" height="h-auto max-h-[90vh]">
                {/* Header */}
                <div className="pb-4 border-b border-gray-150 flex justify-between items-center pr-8 text-left">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                            <Brain size={18} className="text-blue-500" />
                            Configurar Agente Principal (Enrutador)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Define las directivas y reglas globales que utiliza el enrutador para clasificar los chats.</p>
                    </div>
                </div>

                {/* Form / Content */}
                <form onSubmit={handleSaveRouterPrompt} className="mt-4 space-y-4 text-left">
                    <div>
                        <label htmlFor="agentContext" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Prompt de Directivas e Instrucciones de Enrutamiento
                        </label>
                        <p className="text-xs text-gray-500 pb-2 leading-relaxed">
                            Define la lógica para guiar al modelo sobre cómo clasificar las solicitudes de los clientes y derivarlas a los sub-agentes comerciales, de soporte o de agendamiento.
                        </p>
                        <TextArea
                            id="agentContext"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Ingrese las reglas de negocio de enrutamiento..."
                            rows={12}
                            required
                        />
                    </div>

                    {/* Footer del Modal */}
                    <div className="flex justify-end gap-3 border-t border-gray-150 pt-4 mt-6">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setIsRouterModalOpen(false)}
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
                            Guardar Prompt
                        </Button>
                    </div>
                </form>
            </Modal>
        </SettingsContainer>
    );
};

export default AiAgentSettings;
