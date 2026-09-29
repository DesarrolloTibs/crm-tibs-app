import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, Bell } from 'lucide-react';

// Servicios API
import {
  getHelpdeskCronConfig,
  saveHelpdeskCronConfig,
} from '../../../services/helpdeskCronService';
import type { HelpdeskCronConfig } from '../../../core/models/HelpdeskCronConfig';

// Componentes Compartidos
import Button from '../../../components/shared/Button';
import SettingsContainer from '../../../components/shared/SettingsContainer';

// Sub-componentes Modulares
import { CronModeSelector } from './components/CronModeSelector';
import { CronModeInputs } from './components/CronModeInputs';
import { CronPreviewBanner } from './components/CronPreviewBanner';
import { CronFeedbackAlert } from './components/CronFeedbackAlert';

// Esquemas, Tipos y Helpers
import type { CronMode, SaveStatus } from './schemas/automaticNotifications.schema';
import {
  getPreviewText,
  isValidInterval,
  validateCronConfigForm,
} from './utils/automaticNotifications.helpers';

export const AutomaticNotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario
  const [mode, setMode] = useState<CronMode>('fixed');
  const [fixedTime, setFixedTime] = useState('08:00');
  const [intervalHours, setIntervalHours] = useState(2);
  const [intervalMinutes, setIntervalMinutes] = useState(0);
  // Guard ref para evitar peticiones duplicadas simultáneas (StrictMode o remount)
  const isFetchingRef = useRef<boolean>(false);

  // Cargar configuración actual
  useEffect(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const fetchConfig = async () => {
      setLoading(true);
      try {
        const config = await getHelpdeskCronConfig();
        setMode(config.cron_mode ?? 'fixed');
        setFixedTime(config.cron_time ?? '08:00');
        setIntervalHours(config.cron_interval_hours ?? 2);
        setIntervalMinutes(config.cron_interval_minutes ?? 0);
      } catch {
        // Si el backend aún no tiene datos registrados, se usan valores por defecto silenciosamente
        setMode('fixed');
        setFixedTime('08:00');
        setIntervalHours(2);
        setIntervalMinutes(0);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };
    fetchConfig();
  }, []);

  const previewText = useMemo(
    () => getPreviewText(mode, fixedTime, intervalHours, intervalMinutes),
    [mode, fixedTime, intervalHours, intervalMinutes]
  );

  const isValid = useMemo(
    () => isValidInterval(mode, intervalHours, intervalMinutes),
    [mode, intervalHours, intervalMinutes]
  );

  const handleSave = async () => {
    // Validación Yup
    const { isValid: yupValid, errors } = await validateCronConfigForm({
      cron_mode: mode,
      cron_time: mode === 'fixed' ? fixedTime : null,
      cron_interval_hours: mode === 'interval' ? intervalHours : null,
      cron_interval_minutes: mode === 'interval' ? intervalMinutes : null,
      blnstatus: true,
    });

    if (!yupValid) {
      const firstError = Object.values(errors)[0] || 'Define un intervalo válido.';
      setErrorMsg(firstError);
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    setErrorMsg('');

    const payload: Partial<HelpdeskCronConfig> = {
      cron_mode: mode,
      cron_time: mode === 'fixed' ? fixedTime : null,
      cron_interval_hours: mode === 'interval' ? intervalHours : null,
      cron_interval_minutes: mode === 'interval' ? intervalMinutes : null,
    };

    try {
      await saveHelpdeskCronConfig(payload);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = apiErr?.response?.data?.message || 'Error al guardar la configuración.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
      setSaveStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
        <div className="h-28 bg-gray-100 rounded-xl" />
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-lg w-32" />
      </div>
    );
  }

  return (
    <SettingsContainer
      title="Notificaciones Automáticas"
      description="Configura cuándo se envía el correo automático para el recordatorio de oportunidades y tickets sin atención."
      icon={<Bell size={18} />}
    >
      <div className="space-y-6 w-full">
        {/* Selector de modo */}
        <CronModeSelector mode={mode} onModeChange={setMode} />

        {/* Configuración según modo */}
        <CronModeInputs
          mode={mode}
          fixedTime={fixedTime}
          onFixedTimeChange={setFixedTime}
          intervalHours={intervalHours}
          onIntervalHoursChange={setIntervalHours}
          intervalMinutes={intervalMinutes}
          onIntervalMinutesChange={setIntervalMinutes}
        />

        {/* Preview dinámico */}
        <CronPreviewBanner isValid={isValid} previewText={previewText} />

        {/* Feedback de guardado */}
        <CronFeedbackAlert saveStatus={saveStatus} errorMsg={errorMsg} />

        {/* Botón Guardar */}
        <div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            loading={saveStatus === 'saving'}
            variant="indigo"
          >
            <Save size={15} className="mr-2" />
            Guardar configuración
          </Button>
        </div>
      </div>
    </SettingsContainer>
  );
};

export default AutomaticNotificationsPage;
