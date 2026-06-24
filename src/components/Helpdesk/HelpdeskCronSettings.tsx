import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Save, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { getHelpdeskCronConfig, saveHelpdeskCronConfig } from '../../services/helpdeskCronService';
import type { HelpdeskCronConfig } from '../../core/models/HelpdeskCronConfig';
import Input from '../shared/Input';
import Button from '../shared/Button';

type CronMode = 'fixed' | 'interval';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const HelpdeskCronSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario
  const [mode, setMode] = useState<CronMode>('fixed');
  const [fixedTime, setFixedTime] = useState('08:00');
  const [intervalHours, setIntervalHours] = useState(2);
  const [intervalMinutes, setIntervalMinutes] = useState(0);

  // Cargar configuración actual
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const config = await getHelpdeskCronConfig();
        setMode(config.cron_mode ?? 'fixed');
        setFixedTime(config.cron_time ?? '08:00');
        setIntervalHours(config.cron_interval_hours ?? 2);
        setIntervalMinutes(config.cron_interval_minutes ?? 0);
      } catch {
        // Si el backend aún no existe, se usan valores por defecto silenciosamente
        setMode('fixed');
        setFixedTime('08:00');
        setIntervalHours(2);
        setIntervalMinutes(0);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const getPreviewText = (): string => {
    if (mode === 'fixed') {
      if (!fixedTime) return 'Selecciona una hora de ejecución.';
      const [h, m] = fixedTime.split(':');
      const hora = parseInt(h, 10);
      const min = parseInt(m, 10);
      const period = hora >= 12 ? 'p.m.' : 'a.m.';
      const h12 = hora === 0 ? 12 : hora > 12 ? hora - 12 : hora;
      const minStr = min === 0 ? '' : ` y ${min} minutos`;
      return `El cron se ejecuta todos los días a las ${h12}${minStr} ${period} (${fixedTime} hrs).`;
    }
    const hText = intervalHours > 0 ? `${intervalHours} hora${intervalHours !== 1 ? 's' : ''}` : '';
    const mText = intervalMinutes > 0 ? `${intervalMinutes} minuto${intervalMinutes !== 1 ? 's' : ''}` : '';
    const parts = [hText, mText].filter(Boolean).join(' y ');
    if (!parts) return 'Define al menos 1 minuto de intervalo.';
    return `El cron se ejecuta cada ${parts}.`;
  };

  const isValidInterval = (): boolean => {
    if (mode === 'interval') {
      return (intervalHours > 0 || intervalMinutes > 0) && intervalMinutes <= 59 && intervalHours <= 23;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isValidInterval()) {
      setErrorMsg('Define un intervalo válido (entre 1 minuto y 23 horas 59 minutos).');
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
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar la configuración.';
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
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Notificaciones automáticas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configura cuándo se envía el correo de alerta por tickets sin asignar en etapa inicial.
          </p>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Modo de ejecución
        </span>
        <div className="grid grid-cols-2 gap-3">
          {/* Tarjeta Hora Fija */}
          <button
            type="button"
            onClick={() => setMode('fixed')}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              mode === 'fixed'
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {mode === 'fixed' && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'fixed' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <Clock size={16} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${mode === 'fixed' ? 'text-indigo-700' : 'text-gray-700'}`}>
                Hora fija
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Una vez al día a la hora que definas</p>
            </div>
          </button>

          {/* Tarjeta Intervalo */}
          <button
            type="button"
            onClick={() => setMode('interval')}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              mode === 'interval'
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {mode === 'interval' && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'interval' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <RefreshCw size={16} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${mode === 'interval' ? 'text-indigo-700' : 'text-gray-700'}`}>
                Intervalo
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Repetir cada cierto número de horas y minutos</p>
            </div>
          </button>
        </div>
      </div>

      {/* Configuración según modo */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-4 animate-fade-in" key={mode}>
        {mode === 'fixed' ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="cron-fixed-time" className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Hora de ejecución
            </label>
            <Input
              id="cron-fixed-time"
              type="time"
              value={fixedTime}
              onChange={(e) => setFixedTime(e.target.value)}
              className="w-44 bg-white"
            />
            <p className="text-xs text-gray-400 mt-0.5">El correo se enviará una vez al día a esta hora.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Repetir cada
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Input
                  id="cron-interval-hours"
                  type="number"
                  min={0}
                  max={23}
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0)))}
                  className="w-20 text-center"
                />
                <label htmlFor="cron-interval-hours" className="text-sm text-gray-600 font-medium">
                  horas
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="cron-interval-minutes"
                  type="number"
                  min={0}
                  max={59}
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  className="w-20 text-center"
                />
                <label htmlFor="cron-interval-minutes" className="text-sm text-gray-600 font-medium">
                  minutos
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-400">Rango: mínimo 1 minuto, máximo 23 h 59 min.</p>
          </div>
        )}
      </div>

      {/* Preview dinámico */}
      <div className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-sm ${
        isValidInterval()
          ? 'bg-blue-50 border-blue-100 text-blue-700'
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}>
        <Clock size={15} className="shrink-0 mt-0.5" />
        <span className="font-medium">{getPreviewText()}</span>
      </div>

      {/* Feedback de guardado */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-lg animate-fade-in">
          <CheckCircle size={15} className="shrink-0" />
          <span className="font-medium">Configuración guardada correctamente.</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg animate-fade-in">
          <AlertCircle size={15} className="shrink-0" />
          <span className="font-medium">{errorMsg || 'No se pudo guardar la configuración.'}</span>
        </div>
      )}

      {/* Botón Guardar */}
      <div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isValidInterval()}
          loading={saveStatus === 'saving'}
          variant="indigo"
        >
          <Save size={15} className="mr-2" />
          Guardar configuración
        </Button>
      </div>
    </div>
  );
};

export default HelpdeskCronSettings;
