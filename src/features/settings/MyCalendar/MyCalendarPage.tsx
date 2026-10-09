import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Notification from '../../../components/shared/Notification';
import SkeletonLoader from '../../../components/shared/SkeletonLoader';

// Subcomponentes Modulares de Mi Calendario
import { CalendarSyncStatusBanner } from './components/CalendarSyncStatusBanner';
import { CalendarProvidersGrid } from './components/CalendarProvidersGrid';

// Esquemas y Constantes
import type { CalendarIntegrationStatus, NotificationState } from './schemas/myCalendar.schema';
import { CALENDAR_PROVIDERS } from './utils/myCalendar.helpers';

// Servicios API
import {
  getCalendarIntegrationStatus,
  getCalendarAuthUrl,
  disconnectCalendar,
} from '../../../services/calendarIntegrationsService';

export const MyCalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de datos
  const [status, setStatus] = useState<CalendarIntegrationStatus>({ connected: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modales
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState<boolean>(false);

  // Notificación compartida
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Alerta de notificación banner (para callbacks de URL de sincronización OAuth)
  const [bannerAlert, setBannerAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const notify = (notif: { type: 'success' | 'error' | 'warning' | 'confirmation'; title: string; message: string }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: hideNotification,
    });
  };

  // Guard ref para evitar peticiones duplicadas simultáneas (StrictMode o cambios de searchParams)
  const isFetchingRef = useRef<boolean>(false);

  // Cargar estado de la integración
  const fetchStatus = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) setLoading(true);
      const data = await getCalendarIntegrationStatus();
      setStatus(data || { connected: false });
    } catch (err) {
      console.error('Error al obtener estado de integración del calendario:', err);
      notify({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudo verificar el estado de la vinculación de calendario con el servidor.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Inicialización de datos al montar
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Validar parámetros de redirección URL (callback de OAuth de Google o Outlook)
  useEffect(() => {
    const syncResult = searchParams.get('calendar_sync');
    if (syncResult === 'success') {
      setBannerAlert({
        type: 'success',
        message: '¡Tu calendario externo se ha vinculado y sincronizado exitosamente!',
      });
      searchParams.delete('calendar_sync');
      setSearchParams(searchParams, { replace: true });
      fetchStatus(true);
    } else if (syncResult === 'error') {
      setBannerAlert({
        type: 'error',
        message: 'Hubo un error al intentar vincular tu calendario de forma externa. Por favor, reintenta.',
      });
      searchParams.delete('calendar_sync');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchStatus]);

  // Manejo de conexión OAuth (Google / Outlook)
  const handleConnectOAuth = async (provider: 'google' | 'outlook') => {
    try {
      setActionLoading(provider);
      const authUrl = await getCalendarAuthUrl(provider);
      // Redirigir a pantalla de consentimiento OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error(`Error al conectar con ${provider}:`, err);
      notify({
        type: 'error',
        title: 'Fallo al iniciar conexión',
        message: `No se pudo inicializar la conexión segura con ${provider === 'google' ? 'Google' : 'Outlook'}.`,
      });
      setActionLoading(null);
    }
  };

  // Manejo de desconexión
  const executeDisconnect = async () => {
    setShowConfirmDisconnect(false);
    try {
      setActionLoading('disconnect');
      await disconnectCalendar();
      setStatus({ connected: false });
      notify({
        type: 'success',
        title: 'Calendario Desconectado',
        message: 'Tu calendario externo ha sido desvinculado correctamente.',
      });
    } catch (err) {
      console.error('Error al desconectar calendario:', err);
      notify({
        type: 'error',
        title: 'Error de Desvinculación',
        message: 'No se pudo remover la conexión del calendario. Inténtalo de nuevo.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SettingsContainer
      title="Mi Calendario"
      description="Sincroniza tus actividades, visitas y compromisos del CRM con tu agenda personal en tiempo real. Configura tu proveedor preferido (Google Calendar o Microsoft Outlook)."
      icon={<Calendar size={20} />}
      rightAction={
        <Button
          variant="secondary"
          onClick={() => fetchStatus(true)}
          disabled={loading}
          title="Actualizar estado de conexión"
          className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-650' : 'text-slate-600'} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Alerta de notificación por Callback OAuth */}
        {bannerAlert && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 border shadow-xs transition-all duration-300 ${
              bannerAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {bannerAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {bannerAlert.message}
            </div>
            <Button
              variant="icon"
              onClick={() => setBannerAlert(null)}
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Skeleton Loader al cargar inicialmente */}
        {loading && !status.connected && (
          <div className="space-y-6">
            <SkeletonLoader variant="card" count={1} />
            <SkeletonLoader variant="line" count={3} />
          </div>
        )}

        {/* Contenido Principal */}
        {!loading && (
          <div className="space-y-6">
            {/* Banner de Estado de Sincronización */}
            <CalendarSyncStatusBanner
              status={status}
              actionLoading={actionLoading}
              onDisconnect={() => setShowConfirmDisconnect(true)}
              onRefresh={() => fetchStatus(true)}
              loading={loading}
            />

            {/* Cuadrícula de Proveedores de Calendario */}
            <CalendarProvidersGrid
              providers={CALENDAR_PROVIDERS}
              status={status}
              actionLoading={actionLoading}
              onConnectOAuth={handleConnectOAuth}
              onDisconnect={() => setShowConfirmDisconnect(true)}
            />
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE DESVINCULACIÓN */}
      <ConfirmModal
        open={showConfirmDisconnect}
        onClose={() => setShowConfirmDisconnect(false)}
        onConfirm={executeDisconnect}
        message="¿Estás seguro de que deseas desconectar tu calendario externo? Tus citas y actividades comerciales del CRM ya no se sincronizarán automáticamente con tu cuenta."
        confirmLabel="Desconectar calendario"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* NOTIFICACIÓN COMPARTIDA */}
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

export default MyCalendarPage;
