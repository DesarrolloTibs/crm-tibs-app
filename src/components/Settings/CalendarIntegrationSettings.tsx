import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Link2,
  Unlink,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  X
} from 'lucide-react';
import {
  getCalendarIntegrationStatus,
  getCalendarAuthUrl,
  connectICloudCalendar,
  disconnectCalendar
} from '../../services/calendarIntegrationsService';
import type { CalendarIntegrationStatus } from '../../services/calendarIntegrationsService';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { useFormValidation } from '../shared/useFormValidation';

const CalendarIntegrationSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<CalendarIntegrationStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estado para modal de iCloud
  const [showICloudModal, setShowICloudModal] = useState(false);
  const [icloudEmail, setICloudEmail] = useState('');
  const [icloudPassword, setICloudPassword] = useState('');
  const [icloudError, setICloudError] = useState<string | null>(null);

  // Confirmar desvinculación
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  // Validación de formulario iCloud
  const { errors, setError, clearErrors } = useFormValidation<{
    icloudEmail: string;
    icloudPassword: string;
  }>();

  // Cargar estado de la integración
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await getCalendarIntegrationStatus();
      setStatus(data);
    } catch (err) {
      console.error('Error al obtener estado de integración:', err);
      setNotification({
        type: 'error',
        message: 'No se pudo cargar el estado de la vinculación de calendario.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Validar parámetros de redirección URL (callback de OAuth)
    const syncResult = searchParams.get('calendar_sync');
    if (syncResult === 'success') {
      setNotification({
        type: 'success',
        message: '¡Tu calendario externo se ha vinculado y sincronizado exitosamente!'
      });
      // Limpiar parámetro de la URL
      searchParams.delete('calendar_sync');
      setSearchParams(searchParams);
    } else if (syncResult === 'error') {
      setNotification({
        type: 'error',
        message: 'Hubo un error al intentar vincular tu calendario de forma externa. Por favor, reintenta.'
      });
      searchParams.delete('calendar_sync');
      setSearchParams(searchParams);
    }
  }, []);

  // Manejo de conexión OAuth (Google/Outlook)
  const handleConnectOAuth = async (provider: 'google' | 'outlook') => {
    try {
      setActionLoading(provider);
      const authUrl = await getCalendarAuthUrl(provider);
      window.location.href = authUrl; // Redirigir a OAuth
    } catch (err) {
      console.error(`Error al conectar con ${provider}:`, err);
      setNotification({
        type: 'error',
        message: `No se pudo inicializar la conexión con ${provider === 'google' ? 'Google' : 'Outlook'}.`
      });
      setActionLoading(null);
    }
  };

  // Manejo de conexión iCloud CalDAV
  const handleConnectICloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setICloudError(null);
    clearErrors();

    let hasValidationErrors = false;

    // Validación formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!icloudEmail) {
      setError('icloudEmail', 'El correo de iCloud es requerido.');
      hasValidationErrors = true;
    } else if (!emailRegex.test(icloudEmail)) {
      setError('icloudEmail', 'Formato de correo electrónico inválido.');
      hasValidationErrors = true;
    }

    // Validación formato contraseña de aplicación de Apple (xxxx-xxxx-xxxx-xxxx)
    const appPasswordRegex = /^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$/i;
    if (!icloudPassword) {
      setError('icloudPassword', 'La contraseña de aplicación es requerida.');
      hasValidationErrors = true;
    } else if (!appPasswordRegex.test(icloudPassword.trim())) {
      setError('icloudPassword', 'La contraseña de aplicación debe tener el formato xxxx-xxxx-xxxx-xxxx.');
      hasValidationErrors = true;
    }

    if (hasValidationErrors) {
      return;
    }

    try {
      setActionLoading('icloud');
      await connectICloudCalendar(icloudEmail, icloudPassword);
      setNotification({
        type: 'success',
        message: '¡Tu cuenta de iCloud se ha conectado y sincronizado con éxito!'
      });
      setShowICloudModal(false);
      setICloudEmail('');
      setICloudPassword('');
      fetchStatus();
    } catch (err: any) {
      console.error('Error al vincular iCloud:', err);
      setICloudError(
        err.response?.data?.message || 'Error al conectar con iCloud. Verifica tus credenciales.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Manejo de desconexión
  const handleDisconnect = () => {
    setShowConfirmDisconnect(true);
  };

  const executeDisconnect = async () => {
    setShowConfirmDisconnect(false);
    try {
      setActionLoading('disconnect');
      await disconnectCalendar();
      setNotification({
        type: 'success',
        message: 'Tu calendario externo ha sido desconectado correctamente.'
      });
      setStatus({ connected: false });
    } catch (err) {
      console.error('Error al desconectar calendario:', err);
      setNotification({
        type: 'error',
        message: 'No se pudo remover la conexión del calendario.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-sm font-medium">Verificando estado de conexiones...</span>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-4 max-w-4xl flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600 w-5 h-5" /> Integración de Calendario Externo
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Sincroniza tus actividades del CRM con tu calendario personal en tiempo real. Configura tu proveedor preferido a continuación.
        </p>
      </div>

      {/* Alertas de notificación */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all duration-300 ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-red-50 border-red-100 text-red-800'
          }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{notification.message}</div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CARD: GOOGLE CALENDAR */}
        <div className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md ${status.connected && status.provider === 'google'
            ? 'border-blue-500 ring-2 ring-blue-500/10'
            : 'border-gray-100'
          }`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.47-.83-1.03-1.03-1.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
              </div>
              {status.connected && status.provider === 'google' && (
                <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">
                  Activo
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Google Calendar</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Vincula tus actividades del CRM directamente con tu cuenta personal de Gmail.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {status.connected ? (
              status.provider === 'google' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate" title={status.email}>{status.email}</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={actionLoading !== null}
                    className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'disconnect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink size={13} />}
                    Desvincular
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-2 px-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-xs font-bold"
                >
                  Bloqueado
                </button>
              )
            ) : (
              <button
                onClick={() => handleConnectOAuth('google')}
                disabled={actionLoading !== null}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'google' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 size={13} />}
                Vincular cuenta
              </button>
            )}
          </div>
        </div>

        {/* CARD: MICROSOFT OUTLOOK */}
        <div className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md ${status.connected && status.provider === 'outlook'
            ? 'border-blue-500 ring-2 ring-blue-500/10'
            : 'border-gray-100'
          }`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                  <rect x="12.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                  <rect x="0" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
                  <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
                </svg>
              </div>
              {status.connected && status.provider === 'outlook' && (
                <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">
                  Activo
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Outlook Calendar</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Sincroniza tus compromisos con tu calendario personal o corporativo de Microsoft 365.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {status.connected ? (
              status.provider === 'outlook' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate" title={status.email}>{status.email}</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={actionLoading !== null}
                    className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'disconnect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink size={13} />}
                    Desvincular
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-2 px-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-xs font-bold"
                >
                  Bloqueado
                </button>
              )
            ) : (
              <button
                onClick={() => handleConnectOAuth('outlook')}
                disabled={actionLoading !== null}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'outlook' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 size={13} />}
                Vincular cuenta
              </button>
            )}
          </div>
        </div>

        {/* CARD: APPLE ICLOUD
        <div className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md ${
          status.connected && status.provider === 'icloud' 
            ? 'border-blue-500 ring-2 ring-blue-500/10' 
            : 'border-gray-100'
        }`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-50/50">
                <svg className="w-6 h-6 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5 19A5.5 5.5 0 0 0 19 8.2c-.3 0-.6 0-.9.1A8 8 0 0 0 3 11.5c0 .3 0 .6.1.9A6 6 0 0 0 5.5 24H17.5z" fill="#0EA5E9" opacity="0.1" />
                  <path d="M17.5 19A5.5 5.5 0 0 0 19 8.2c-.3 0-.6 0-.9.1A8 8 0 0 0 3 11.5c0 .3 0 .6.1.9A6 6 0 0 0 5.5 24H17.5z" stroke="#0EA5E9" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              {status.connected && status.provider === 'icloud' && (
                <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">
                  Activo
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">iCloud Calendar</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Integra tus actividades en tu cuenta de Apple usando CalDAV y contraseña de aplicación.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {status.connected ? (
              status.provider === 'icloud' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate" title={status.email}>{status.email}</span>
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    disabled={actionLoading !== null}
                    className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'disconnect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink size={13} />}
                    Desvincular
                  </button>
                </div>
              ) : (
                <button 
                  disabled 
                  className="w-full py-2 px-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-xs font-bold"
                >
                  Bloqueado
                </button>
              )
            ) : (
              <button
                onClick={() => setShowICloudModal(true)}
                disabled={actionLoading !== null}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                Vincular iCloud
              </button>
            )}
          </div>
        </div> */}

      </div>

      <Modal
        open={showICloudModal}
        onClose={() => {
          setShowICloudModal(false);
          setICloudError(null);
        }}
        maxWidth="max-w-md"
        height="h-auto"
      >
        <div className="flex flex-col">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-800 text-base">Conectar Apple iCloud</h3>
          </div>

          {icloudError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="text-red-600 shrink-0" />
              <span>{icloudError}</span>
            </div>
          )}

          <form onSubmit={handleConnectICloud} className="flex flex-col gap-4">
            <Input
              label="ID de Apple (Correo)"
              type="email"
              required
              placeholder="ejemplo@icloud.com"
              value={icloudEmail}
              onChange={(e) => setICloudEmail(e.target.value)}
              error={errors.icloudEmail}
            />

            <Input
              label="Contraseña de Aplicación"
              type="password"
              required
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={icloudPassword}
              onChange={(e) => setICloudPassword(e.target.value)}
              error={errors.icloudPassword}
              inputPrefix={<Lock size={14} className="text-slate-400 mt-0.5" />}
            />

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-[11px] text-gray-500 leading-normal">
              <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-700">Importante:</span> Por seguridad de Apple, debes generar una contraseña de aplicación. Ve a
                <a
                  href="https://appleid.apple.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold hover:underline mx-1"
                >
                  appleid.apple.com
                </a>
                e ingresa en la sección "Iniciar sesión y seguridad" &gt; "Contraseñas específicas de la aplicación" para crear una.
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowICloudModal(false);
                  setICloudError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={actionLoading === 'icloud'}
              >
                Conectar
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE DESVINCULACIÓN */}
      <ConfirmModal
        open={showConfirmDisconnect}
        onClose={() => setShowConfirmDisconnect(false)}
        onConfirm={executeDisconnect}
        message="¿Estás seguro de que deseas desconectar tu calendario externo? Las actividades ya no se sincronizarán."
        confirmLabel="Desconectar"
        cancelLabel="Cancelar"
        variant="danger"
      />

    </div>
  );
};

export default CalendarIntegrationSettings;
