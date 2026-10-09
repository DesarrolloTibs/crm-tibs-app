import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Brain, RefreshCw } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import Notification from '../../../components/shared/Notification';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Loader from '../../../components/shared/Loader';
import { showToast } from '../../../utils/toast';

// Subcomponentes Modulares de Agente IA & Canales
import { AiAgentStatsBanner } from './components/AiAgentStatsBanner';
import { AiAgentTabsNav } from './components/AiAgentTabsNav';
import { AiGeneralTab } from './components/AiGeneralTab';
import { AiChannelsTab } from './components/AiChannelsTab';
import { AiRouterModal } from './components/AiRouterModal';
import { AiSubAgentModal } from './components/AiSubAgentModal';
import { AiWhatsAppChannelModal } from './components/AiWhatsAppChannelModal';

// Esquemas, Tipos y Helpers
import type {
  SubAgent,
  ChannelConfig,
  NotificationState,
} from './schemas/aiAgent.schema';
import { calculateAiAgentStats } from './utils/aiAgent.helpers';

// Servicios API
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
} from '../../../services/conversationsService';
import { getUsers } from '../../../services/usersService';

export const AiAgentChannelsPage: React.FC = () => {
  // Estado de carga inicial y guardado
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subAgentsLoading, setSubAgentsLoading] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'channels'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'channels' || params.get('meta_oauth')) {
        return 'channels';
      }
    }
    return 'general';
  });

  // Datos globales
  const [users, setUsers] = useState<any[]>([]);
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [channelConfigs, setChannelConfigs] = useState<ChannelConfig[]>([]);

  // Configuración del Agente General
  const [isActive, setIsActive] = useState(true);
  const [context, setContext] = useState('');
  const [defaultReplies, setDefaultReplies] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [modelProvider, setModelProvider] = useState('gemini');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiEndpoint, setOpenaiEndpoint] = useState('');
  const [openaiApiVersion, setOpenaiApiVersion] = useState('');
  const [openaiEmbeddingModel, setOpenaiEmbeddingModel] = useState('text-embedding-ada-002');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [watsonxApiKey, setWatsonxApiKey] = useState('');
  const [watsonxProjectId, setWatsonxProjectId] = useState('');
  const [watsonxRegion, setWatsonxRegion] = useState('us-south');
  const [watsonxEmbeddingModel, setWatsonxEmbeddingModel] = useState('ibm/slate-125m-english-rtrvr');
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState(60);
  const [historyMessageLimit, setHistoryMessageLimit] = useState(10);
  const [maxNewTokens, setMaxNewTokens] = useState(7000);
  const [defaultUserId, setDefaultUserId] = useState('');

  // Modales
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);
  const [isSubAgentModalOpen, setIsSubAgentModalOpen] = useState(false);
  const [editingSubAgent, setEditingSubAgent] = useState<SubAgent | null>(null);
  const [deletingSubAgentId, setDeletingSubAgentId] = useState<string | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);
  const [connectingMetaChannel, setConnectingMetaChannel] = useState<'facebook' | 'instagram' | null>(null);

  // Notificación compartida
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: notif.onConfirm || hideNotification,
    });
  };

  // Referencias para conexión Meta OAuth2 (IPC)
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

  // Guard ref para evitar peticiones duplicadas simultáneas (StrictMode o remount)
  const isFetchingRef = useRef<boolean>(false);

  // Cargar configuraciones del sistema
  const loadAllSettings = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) setLoading(true);
      const [config, allUsers, configsList, subAgentsList] = await Promise.all([
        getAiAgentConfig(),
        getUsers(),
        getChannelConfigs(),
        getSubAgents(),
      ]);

      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setChannelConfigs(Array.isArray(configsList) ? configsList : []);
      setSubAgents(Array.isArray(subAgentsList) ? subAgentsList : []);

      if (config) {
        setIsActive(config.isActive ?? true);
        setContext(config.context || '');
        setDefaultReplies(config.defaultReplies || '');
        setTemperature(config.temperature ?? 0.7);
        setModelProvider(config.modelProvider || 'gemini');
        setModelName(config.modelName || 'gemini-1.5-flash');
        setOpenaiApiKey(config.openaiApiKey || '');
        setOpenaiEndpoint(config.openaiEndpoint || '');
        setOpenaiApiVersion(config.openaiApiVersion || '');
        setOpenaiEmbeddingModel(config.openaiEmbeddingModel || 'text-embedding-ada-002');
        setGeminiApiKey(config.geminiApiKey || '');
        setWatsonxApiKey(config.watsonxApiKey || '');
        setWatsonxProjectId(config.watsonxProjectId || '');
        setWatsonxRegion(config.watsonxRegion || 'us-south');
        setWatsonxEmbeddingModel(config.watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr');
        setReminderOffsetMinutes(config.reminderOffsetMinutes ?? 60);
        setHistoryMessageLimit(config.historyMessageLimit || 10);
        setMaxNewTokens(config.maxNewTokens || 7000);
        setDefaultUserId(config.defaultUserId || '');
      }
    } catch (error) {
      console.error('Error al cargar configuraciones del agente IA:', error);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible obtener las configuraciones del Agente IA y Canales desde el servidor.',
      });
    } finally {
      setLoading(false);
      setIsLoadingChannels(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadAllSettings();

    // Verificación de retorno de Meta OAuth en URL
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
  }, [loadAllSettings]);

  // Sincronización Global de Meta OAuth2 (BroadcastChannel + Storage + Message)
  useEffect(() => {
    const handleOAuthGlobalResult = async (data: any) => {
      if (data?.type === 'META_OAUTH_SUCCESS') {
        setActiveTab('channels');
        showToast.success(data.payload?.message || '¡Canal de Meta conectado con éxito!');
        setIsLoadingChannels(true);
        try {
          const list = await getChannelConfigs();
          setChannelConfigs(list);
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

  // Sincronizar Canales con Meta Graph API
  const handleRefreshChannels = async () => {
    try {
      setIsLoadingChannels(true);
      const list = await getChannelConfigs();
      setChannelConfigs(Array.isArray(list) ? list : []);
      showToast.success('Canales sincronizados exitosamente con Meta Graph API.');
    } catch (error) {
      console.error('Error al sincronizar canales con Meta:', error);
      showToast.error('No se pudieron sincronizar los canales con Meta.');
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Guardar Configuración General
  const handleSaveGeneralConfig = async (e: React.FormEvent) => {
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

      notify({
        type: 'success',
        title: '¡Configuración Guardada!',
        message: 'Los parámetros del Agente IA fueron actualizados con éxito en el servidor.',
      });
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: 'Ocurrió un error inesperado al guardar las configuraciones de la IA.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Guardar Prompt del Enrutador Principal
  const handleSaveRouterPrompt = async (newPrompt: string) => {
    try {
      setSaving(true);
      await saveAiAgentConfig({
        isActive,
        context: newPrompt,
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

      setContext(newPrompt);
      setIsRouterModalOpen(false);
      notify({
        type: 'success',
        title: '¡Prompt de Enrutador Guardado!',
        message: 'Las directivas de clasificación del Agente Principal se actualizaron exitosamente.',
      });
    } catch (error) {
      console.error('Error al guardar prompt del enrutador:', error);
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No fue posible guardar el prompt del enrutador principal.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handlers para Sub-Agentes
  const handleOpenCreateSubAgent = () => {
    setEditingSubAgent(null);
    setIsSubAgentModalOpen(true);
  };

  const handleOpenEditSubAgent = (agent: SubAgent) => {
    setEditingSubAgent(agent);
    setIsSubAgentModalOpen(true);
  };

  const handleSaveSubAgent = async (payload: any) => {
    try {
      setSaving(true);
      await saveSubAgent(payload);
      setIsSubAgentModalOpen(false);
      setEditingSubAgent(null);

      notify({
        type: 'success',
        title: editingSubAgent ? '¡Sub-Agente Actualizado!' : '¡Sub-Agente Creado!',
        message: `El sub-agente "${payload.name}" fue guardado exitosamente.`,
      });

      setSubAgentsLoading(true);
      const list = await getSubAgents();
      setSubAgents(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Error al guardar sub-agente:', err);
      const errorMsg = err.response?.data?.message || 'No se pudo guardar el sub-agente.';
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSaving(false);
      setSubAgentsLoading(false);
    }
  };

  const handleConfirmDeleteSubAgent = async () => {
    if (!deletingSubAgentId) return;
    const id = deletingSubAgentId;
    setDeletingSubAgentId(null);

    try {
      setSubAgentsLoading(true);
      await deleteSubAgent(id);
      notify({
        type: 'success',
        title: 'Sub-Agente Eliminado',
        message: 'El sub-agente ha sido eliminado correctamente del sistema.',
      });
      const list = await getSubAgents();
      setSubAgents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error al eliminar sub-agente:', err);
      notify({
        type: 'error',
        title: 'Error al Eliminar',
        message: 'No se pudo eliminar el sub-agente seleccionado.',
      });
    } finally {
      setSubAgentsLoading(false);
    }
  };

  const handleToggleSubAgentStatus = async (agent: SubAgent) => {
    if (!agent.id) return;
    try {
      await saveSubAgent({
        id: agent.id,
        isActive: !agent.isActive,
      });
      const list = await getSubAgents();
      setSubAgents(Array.isArray(list) ? list : []);
      showToast.success(`Sub-agente ${!agent.isActive ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      console.error('Error al cambiar estatus del sub-agente:', err);
      showToast.error('No se pudo cambiar el estado del sub-agente.');
    }
  };

  // Handlers para Canales
  const handleOpenWhatsAppModal = (config?: ChannelConfig) => {
    setEditingChannel(config || null);
    setIsWhatsAppModalOpen(true);
  };

  const handleSaveChannel = async (payload: any) => {
    try {
      setSaving(true);
      await saveChannelConfig(payload);
      setIsWhatsAppModalOpen(false);
      setEditingChannel(null);

      notify({
        type: 'success',
        title: payload.id ? '¡Canal Actualizado!' : '¡Canal Registrado!',
        message: `El canal de WhatsApp "${payload.name}" fue guardado exitosamente.`,
      });

      setIsLoadingChannels(true);
      const list = await getChannelConfigs();
      setChannelConfigs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Error al guardar canal:', err);
      const errorMsg = err.response?.data?.message || 'No se pudo guardar la configuración del canal.';
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSaving(false);
      setIsLoadingChannels(false);
    }
  };

  const handleConfirmDeleteChannel = async () => {
    if (!deletingChannelId) return;
    const id = deletingChannelId;
    setDeletingChannelId(null);

    try {
      setIsLoadingChannels(true);
      await deleteChannelConfig(id);
      notify({
        type: 'success',
        title: 'Canal Desconectado',
        message: 'El canal y sus credenciales han sido removidos con éxito.',
      });
      const list = await getChannelConfigs();
      setChannelConfigs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error al eliminar canal:', err);
      notify({
        type: 'error',
        title: 'Error al Desconectar',
        message: 'No se pudo desconectar el canal seleccionado.',
      });
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Conexión OAuth2 Meta en 1 Clic para Facebook e Instagram
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
        showToast.error('La ventana emergente fue bloqueada por tu navegador. Permite popups e intenta de nuevo.');
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
          showToast.success(
            data.payload?.message ||
              `¡Canal ${channel === 'facebook' ? 'Facebook' : 'Instagram'} conectado con éxito!`
          );
          setIsLoadingChannels(true);
          getChannelConfigs()
            .then((list) => setChannelConfigs(Array.isArray(list) ? list : []))
            .catch((err) => console.error('Error al recargar canales:', err))
            .finally(() => setIsLoadingChannels(false));
        } else if (data?.type === 'META_OAUTH_ERROR') {
          showToast.error(data.payload?.message || 'Error al conectar con Meta.');
        }
        setConnectingMetaChannel(null);
      };

      // 1. PostMessage
      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === 'META_OAUTH_SUCCESS' || event.data?.type === 'META_OAUTH_ERROR') {
          onOAuthResult(event.data);
        }
      };
      metaMessageListenerRef.current = messageListener;
      window.addEventListener('message', messageListener);

      // 2. BroadcastChannel
      try {
        const bc = new BroadcastChannel('meta_oauth_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'META_OAUTH_SUCCESS' || event.data?.type === 'META_OAUTH_ERROR') {
            onOAuthResult(event.data);
          }
        };
        metaBroadcastChannelRef.current = bc;
      } catch (e) {}

      // 3. Storage
      const storageListener = (event: StorageEvent) => {
        if (event.key === 'meta_oauth_result' && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            if (parsed?.type === 'META_OAUTH_SUCCESS' || parsed?.type === 'META_OAUTH_ERROR') {
              localStorage.removeItem('meta_oauth_result');
              onOAuthResult(parsed);
            }
          } catch (e) {}
        }
      };
      metaStorageListenerRef.current = storageListener;
      window.addEventListener('storage', storageListener);

      // Polling de autocierre
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

  // Cálculo de estadísticas consolidadas para el banner superior
  const stats = useMemo(
    () => calculateAiAgentStats(isActive, temperature, historyMessageLimit, subAgents, channelConfigs),
    [isActive, temperature, historyMessageLimit, subAgents, channelConfigs]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader />
      </div>
    );
  }

  return (
    <SettingsContainer
      title="Agente IA & Canales"
      description="Configura la inferencia autónoma de la IA, gestiona el flujo orquestado de sub-agentes y vincula canales oficiales de Meta en 1 clic."
      icon={<Brain size={20} />}
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => loadAllSettings(true)}
            disabled={loading}
            title="Recargar configuración y canales"
            className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-2xs"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin text-indigo-600' : 'text-slate-600'}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Banner de Métricas e Indicadores de Salud */}
        <AiAgentStatsBanner stats={stats} />

        {/* Pestañas de Navegación */}
        <AiAgentTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          subAgentsCount={subAgents.length}
          channelsCount={channelConfigs.length}
        />

        {/* Contenido según Pestaña Activa */}
        {activeTab === 'general' ? (
          <AiGeneralTab
            isActive={isActive}
            setIsActive={setIsActive}
            temperature={temperature}
            setTemperature={setTemperature}
            historyMessageLimit={historyMessageLimit}
            setHistoryMessageLimit={setHistoryMessageLimit}
            defaultUserId={defaultUserId}
            setDefaultUserId={setDefaultUserId}
            reminderOffsetMinutes={reminderOffsetMinutes}
            setReminderOffsetMinutes={setReminderOffsetMinutes}
            users={users}
            subAgents={subAgents}
            onOpenCreateSubAgent={handleOpenCreateSubAgent}
            onOpenEditSubAgent={handleOpenEditSubAgent}
            onDeleteSubAgent={(id) => setDeletingSubAgentId(id)}
            onToggleSubAgentStatus={handleToggleSubAgentStatus}
            onOpenRouterModal={() => setIsRouterModalOpen(true)}
            onSaveGeneralConfig={handleSaveGeneralConfig}
            saving={saving}
            subAgentsLoading={subAgentsLoading}
          />
        ) : (
          <AiChannelsTab
            channelConfigs={channelConfigs}
            isLoadingChannels={isLoadingChannels}
            connectingMetaChannel={connectingMetaChannel}
            onRefreshChannels={handleRefreshChannels}
            onOpenWhatsAppModal={handleOpenWhatsAppModal}
            onConnectMeta={handleConnectMeta}
            onDeleteChannel={(id) => setDeletingChannelId(id)}
          />
        )}
      </div>

      {/* MODALES DEL SISTEMA */}
      <AiRouterModal
        open={isRouterModalOpen}
        initialPrompt={context}
        onClose={() => setIsRouterModalOpen(false)}
        onSave={handleSaveRouterPrompt}
        saving={saving}
      />

      <AiSubAgentModal
        open={isSubAgentModalOpen}
        editingSubAgent={editingSubAgent}
        onClose={() => {
          setIsSubAgentModalOpen(false);
          setEditingSubAgent(null);
        }}
        onSave={handleSaveSubAgent}
        saving={saving}
      />

      <AiWhatsAppChannelModal
        open={isWhatsAppModalOpen}
        editingChannel={editingChannel}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setEditingChannel(null);
        }}
        onSave={handleSaveChannel}
        saving={saving}
        onNotification={(type, title, message) => notify({ type, title, message })}
      />

      {/* Modal de confirmación para eliminar Sub-Agente */}
      <ConfirmModal
        open={!!deletingSubAgentId}
        message="¿Eliminar Sub-Agente? Esta acción eliminará de forma permanente al sub-agente seleccionado del CRM y el Router ya no podrá delegarle chats."
        confirmLabel="Eliminar Sub-Agente"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeleteSubAgent}
        onClose={() => setDeletingSubAgentId(null)}
      />

      {/* Modal de confirmación para desconectar Canal */}
      <ConfirmModal
        open={!!deletingChannelId}
        message="¿Desconectar Canal de Comunicación? Esta acción desconectará el canal de Meta y suspenderá la recepción y despacho de mensajes para esta cuenta."
        confirmLabel="Desconectar Canal"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeleteChannel}
        onClose={() => setDeletingChannelId(null)}
      />

      {/* Notificación Global Compartida */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={hideNotification}
        onCancel={hideNotification}
      />
    </SettingsContainer>
  );
};

export default AiAgentChannelsPage;
