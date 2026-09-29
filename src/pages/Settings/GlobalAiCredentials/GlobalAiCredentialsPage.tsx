import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Notification from '../../../components/shared/Notification';
import Loader from '../../../components/Loader/Loader';

// Subcomponentes Modulares de Credenciales LLM Global
import { GlobalAiStatsBanner } from './components/GlobalAiStatsBanner';
import { GlobalAiParametersCard } from './components/GlobalAiParametersCard';
import { GlobalAiCredentialsTable } from './components/GlobalAiCredentialsTable';
import { GlobalAiCredentialModal } from './components/GlobalAiCredentialModal';

// Esquemas y Tipos
import type {
  GlobalAiConfig,
  LlmProviderItem,
  LlmProviderId,
  GlobalAiFilterState,
  GlobalAiCredentialsFormData,
  GlobalAiParametersFormData,
  NotificationState,
} from './schemas/globalAiCredentials.schema';

// Utilidades y Helpers
import {
  PROVIDER_CATALOG,
  buildProviderRows,
  filterProviders,
  calculateGlobalAiStats,
} from './utils/globalAiCredentials.helpers';

// Servicios API
import {
  getAiAgentConfig,
  saveAiAgentConfig,
} from '../../../services/conversationsService';

export const GlobalAiCredentialsPage: React.FC = () => {
  // Estado de configuración cruda de la API
  const [config, setConfig] = useState<GlobalAiConfig>({
    modelProvider: 'gemini',
    modelName: 'gemini-1.5-flash',
    maxNewTokens: 7000,
    geminiApiKey: '',
    openaiApiKey: '',
    openaiEndpoint: '',
    openaiApiVersion: '',
    openaiEmbeddingModel: 'text-embedding-ada-002',
    watsonxApiKey: '',
    watsonxProjectId: '',
    watsonxRegion: 'us-south',
    watsonxEmbeddingModel: 'ibm/slate-125m-english-rtrvr',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [savingParameters, setSavingParameters] = useState<boolean>(false);
  const [submittingModal, setSubmittingModal] = useState<boolean>(false);

  // Filtros de la tabla TanStack
  const [filters, setFilters] = useState<GlobalAiFilterState>({
    search: '',
    status: 'all',
  });

  // Estados de modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<LlmProviderItem | null>(null);
  const [activatingProvider, setActivatingProvider] = useState<LlmProviderItem | null>(null);

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

  // Guard ref para evitar peticiones duplicadas simultáneas
  const isFetchingRef = useRef<boolean>(false);

  // Cargar configuración global de IA
  const fetchConfig = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) setLoading(true);
      const data = await getAiAgentConfig();
      if (data) {
        setConfig((prev) => ({
          ...prev,
          modelProvider: data.modelProvider || 'gemini',
          modelName: data.modelName || 'gemini-1.5-flash',
          maxNewTokens: data.maxNewTokens || 7000,
          geminiApiKey: data.geminiApiKey || '',
          openaiApiKey: data.openaiApiKey || '',
          openaiEndpoint: data.openaiEndpoint || '',
          openaiApiVersion: data.openaiApiVersion || '',
          openaiEmbeddingModel: data.openaiEmbeddingModel || 'text-embedding-ada-002',
          watsonxApiKey: data.watsonxApiKey || '',
          watsonxProjectId: data.watsonxProjectId || '',
          watsonxRegion: data.watsonxRegion || 'us-south',
          watsonxEmbeddingModel: data.watsonxEmbeddingModel || 'ibm/slate-125m-english-rtrvr',
        }));
      }
    } catch (err) {
      console.error('Error al cargar configuración global de IA:', err);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible obtener la configuración de IA desde el servidor. Por favor, reintenta.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Transformar datos a filas para TanStack Table
  const providerRows = useMemo(() => buildProviderRows(config), [config]);

  // Filtrado y estadísticas calculadas
  const filteredProviders = useMemo(
    () => filterProviders(providerRows, filters),
    [providerRows, filters]
  );

  const stats = useMemo(() => calculateGlobalAiStats(config), [config]);

  // Manejador de apertura de modal de credenciales
  const handleOpenConfigure = (provider: LlmProviderItem) => {
    setEditingProvider(provider);
    setModalOpen(true);
  };

  // Guardar credenciales desde el modal
  const handleSaveModalCredentials = async (formData: GlobalAiCredentialsFormData) => {
    setSubmittingModal(true);
    try {
      const updatedConfig: GlobalAiConfig = {
        ...config,
        modelProvider: formData.isDefault ? formData.providerId : config.modelProvider,
        modelName: formData.isDefault ? formData.modelName : (config.modelProvider === formData.providerId ? formData.modelName : config.modelName),
      };

      if (formData.providerId === 'gemini') {
        updatedConfig.geminiApiKey = formData.geminiApiKey?.trim() || '';
      } else if (formData.providerId === 'openai') {
        updatedConfig.openaiApiKey = formData.openaiApiKey?.trim() || '';
        updatedConfig.openaiEndpoint = formData.openaiEndpoint?.trim() || '';
        updatedConfig.openaiApiVersion = formData.openaiApiVersion?.trim() || '';
        updatedConfig.openaiEmbeddingModel = formData.openaiEmbeddingModel?.trim() || 'text-embedding-ada-002';
      } else if (formData.providerId === 'watsonx') {
        updatedConfig.watsonxApiKey = formData.watsonxApiKey?.trim() || '';
        updatedConfig.watsonxProjectId = formData.watsonxProjectId?.trim() || '';
        updatedConfig.watsonxRegion = formData.watsonxRegion?.trim() || 'us-south';
        updatedConfig.watsonxEmbeddingModel = formData.watsonxEmbeddingModel?.trim() || 'ibm/slate-125m-english-rtrvr';
      }

      await saveAiAgentConfig(updatedConfig);
      setConfig(updatedConfig);

      setModalOpen(false);
      setEditingProvider(null);

      notify({
        type: 'success',
        title: '¡Credenciales Guardadas!',
        message: `Las credenciales y parámetros de "${PROVIDER_CATALOG[formData.providerId].name}" han sido actualizados exitosamente en todos los esquemas.`,
      });
    } catch (err: any) {
      console.error('Error al guardar credenciales:', err);
      const errorMsg =
        err.response?.data?.message || 'No fue posible guardar las credenciales del proveedor.';
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Guardar parámetros rápidos de inferencia
  const handleSaveParameters = async (data: GlobalAiParametersFormData) => {
    setSavingParameters(true);
    try {
      const updatedConfig: GlobalAiConfig = {
        ...config,
        modelProvider: data.modelProvider,
        modelName: data.modelName,
        maxNewTokens: data.maxNewTokens,
      };

      await saveAiAgentConfig(updatedConfig);
      setConfig(updatedConfig);

      notify({
        type: 'success',
        title: 'Parámetros Actualizados',
        message: `El motor activo se ha establecido en "${PROVIDER_CATALOG[data.modelProvider].name}" (${data.modelName}) con un límite de ${data.maxNewTokens.toLocaleString()} tokens.`,
      });
    } catch (err: any) {
      console.error('Error al guardar parámetros de inferencia:', err);
      const errorMsg =
        err.response?.data?.message || 'No se pudieron actualizar los parámetros de inferencia.';
      notify({
        type: 'error',
        title: 'Error al Actualizar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSavingParameters(false);
    }
  };

  // Confirmar activación rápida de motor
  const handleOpenSetDefault = (provider: LlmProviderItem) => {
    setActivatingProvider(provider);
  };

  const handleConfirmSetDefault = async () => {
    if (!activatingProvider) return;
    const target = activatingProvider;
    setActivatingProvider(null);

    try {
      setLoading(true);
      const defaultModel = PROVIDER_CATALOG[target.id].defaultModel;
      const updatedConfig: GlobalAiConfig = {
        ...config,
        modelProvider: target.id,
        modelName: target.modelName || defaultModel,
      };

      await saveAiAgentConfig(updatedConfig);
      setConfig(updatedConfig);

      notify({
        type: 'success',
        title: 'Motor Activo Modificado',
        message: `"${target.name}" es ahora el motor LLM principal de la plataforma CRM.`,
      });
    } catch (err: any) {
      console.error('Error al cambiar motor activo:', err);
      notify({
        type: 'error',
        title: 'Error al Cambiar Motor',
        message: 'No se pudo cambiar el motor principal. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !config.modelProvider) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader />
      </div>
    );
  }

  return (
    <SettingsContainer
      title="Credenciales & LLM Global"
      description="Define centralmente el motor de Inteligencia Artificial que ejecuta las respuestas automatizadas y llamadas RAG en toda la plataforma CRM para todos los tenants."
      icon={<KeyRound size={20} />}
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchConfig(true)}
            disabled={loading}
            title="Recargar configuración global de IA"
            className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-2xs"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin text-indigo-650' : 'text-slate-600'}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Banner de Estadísticas Rápidas */}
        <GlobalAiStatsBanner stats={stats} />

        {/* Tarjeta de Parámetros Rápidos de Inferencia */}
        <GlobalAiParametersCard
          config={config}
          onSaveParameters={handleSaveParameters}
          saving={savingParameters}
        />

        {/* Tabla TanStack Table de Proveedores y Credenciales */}
        <GlobalAiCredentialsTable
          providers={filteredProviders}
          totalCount={providerRows.length}
          loading={loading}
          onConfigure={handleOpenConfigure}
          onSetDefault={handleOpenSetDefault}
          searchTerm={filters.search}
          setSearchTerm={(term) => setFilters((prev) => ({ ...prev, search: term }))}
          statusFilter={filters.status}
          setStatusFilter={(status) => setFilters((prev) => ({ ...prev, status }))}
        />
      </div>

      {/* MODAL DE EDICIÓN DE CREDENCIALES */}
      <GlobalAiCredentialModal
        open={modalOpen}
        provider={editingProvider}
        config={config}
        onClose={() => {
          setModalOpen(false);
          setEditingProvider(null);
        }}
        onSubmit={handleSaveModalCredentials}
        submitting={submittingModal}
      />

      {/* MODAL DE CONFIRMACIÓN PARA ACTIVAR MOTOR */}
      <ConfirmModal
        open={!!activatingProvider}
        onClose={() => setActivatingProvider(null)}
        onConfirm={handleConfirmSetDefault}
        message={`¿Deseas establecer a "${activatingProvider?.name}" como el motor LLM principal del sistema? Todas las respuestas automáticas y agentes inteligentes procesarán sus llamadas con este proveedor.`}
        confirmLabel="Establecer como Activo"
        cancelLabel="Cancelar"
        variant="warning"
      />

      {/* NOTIFICACIÓN MODAL COMPARTIDA */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />
    </SettingsContainer>
  );
};

export default GlobalAiCredentialsPage;
