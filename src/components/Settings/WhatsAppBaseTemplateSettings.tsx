import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Info,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  User,
  Building2,
  UserCheck,
} from 'lucide-react';
import { ValidationError } from 'yup';
import type {
  WhatsAppBaseTemplate,
  UpsertBaseTemplateDto,
  ChannelConfig,
} from '../../core/models/Conversation';
import {
  getChannelBaseTemplate,
  saveChannelBaseTemplate,
} from '../../services/conversationsService';
import Loader from '../shared/Loader';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import { useFormValidation } from '../shared/useFormValidation';
import {
  whatsappBaseTemplateSchema,
  whatsappBodySchema,
} from '../../utils/whatsappTemplateSchema';

interface WhatsAppBaseTemplateSettingsProps {
  channelConfig: ChannelConfig | {
    id: string;
    name?: string | null;
    channel?: string | null;
    accountId?: string | null;
    phoneNumberId?: string | null;
  };
  onNotification?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
}

const DEFAULT_BODY_TEXT =
  'Hola {{1}}, te saluda {{3}} de {{2}}. Me comunico contigo para dar seguimiento y revisar lo siguiente:';

interface TemplateFormValues {
  headerText: string;
  bodyText: string;
  footerText: string;
}

export const WhatsAppBaseTemplateSettings: React.FC<WhatsAppBaseTemplateSettingsProps> = ({
  channelConfig,
  onNotification,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<WhatsAppBaseTemplate | null>(null);

  // Form states: only headerText, bodyText and footerText are editable
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState(DEFAULT_BODY_TEXT);
  const [footerText, setFooterText] = useState('');

  // Ref para insertar variables en la posición del cursor
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hook estándar de validación de formularios del sistema
  const { errors, setError, clearError, clearErrors } = useFormValidation<TemplateFormValues>();

  const notify = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    if (onNotification) {
      onNotification(type, title, message);
    }
  };

  const loadBaseTemplate = async () => {
    if (!channelConfig?.id) return;
    try {
      setLoading(true);
      const data = await getChannelBaseTemplate(channelConfig.id);
      setTemplate(data);
      if (data) {
        setHeaderText(data.headerText || '');
        setBodyText(data.bodyText || DEFAULT_BODY_TEXT);
        setFooterText(data.footerText || '');
      }
    } catch (err: any) {
      console.error('Error al cargar plantilla base:', err);
      notify(
        'error',
        'Error',
        err?.response?.data?.message || 'No se pudo cargar la plantilla base de WhatsApp.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseTemplate();
  }, [channelConfig?.id]);

  // Inserción de variables {{1}}, {{2}}, {{3}} en la posición actual del cursor
  const handleInsertVariable = (varNumber: 1 | 2 | 3) => {
    const token = `{{${varNumber}}}`;
    const textarea = textareaRef.current;

    if (!textarea) {
      setBodyText((prev) => (prev ? `${prev} ${token}` : token));
      clearError('bodyText');
      return;
    }

    const start = textarea.selectionStart ?? bodyText.length;
    const end = textarea.selectionEnd ?? bodyText.length;
    const before = bodyText.substring(0, start);
    const after = bodyText.substring(end);

    // Ajustar espacios contextuales automáticamente
    const prefix = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const suffix =
      after.length > 0 && !after.startsWith(' ') && !/^[.,;:!?]/.test(after) ? ' ' : '';

    const nextText = `${before}${prefix}${token}${suffix}${after}`;
    setBodyText(nextText);
    clearError('bodyText');

    // Reposicionar el cursor inmediatamente después de la variable insertada
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + prefix.length + token.length + suffix.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Validación de correlatividad en tiempo real (alerta sutil preventiva)
  const correlativeAlert = useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const numbers = Array.from(
      new Set(matches.map((m) => parseInt(m.replace(/\D/g, ''), 10)))
    ).sort((a, b) => a - b);

    if (numbers.length === 0) return null;

    if (numbers[0] !== 1) {
      return 'Para usar variables en Meta, debes incluir primero {{1}} (Nombre del Cliente).';
    }

    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] !== i + 1) {
        const missing = i + 1;
        const missingLabel =
          missing === 1
            ? '{{1}} Nombre del Cliente'
            : missing === 2
            ? '{{2}} Empresa / Negocio'
            : `{{${missing}}}`;
        return `Meta exige correlatividad estricta: falta incluir la variable ${missingLabel} antes de {{${numbers[i]}}}.`;
      }
    }

    return null;
  }, [bodyText]);

  // Validación reactiva exclusiva del cuerpo según reglas Yup de Meta
  const handleBodyChange = (value: string) => {
    setBodyText(value);
    if (errors.bodyText) {
      try {
        whatsappBodySchema.validateSync(value.trim());
        clearError('bodyText');
      } catch (err: any) {
        if (err instanceof ValidationError) {
          setError('bodyText', err.message);
        }
      }
    }
  };

  // Guardar y sincronizar directamente con Meta Graph API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Validar con el esquema Yup estándar
    try {
      await whatsappBaseTemplateSchema.validate(
        {
          headerText: headerText.trim() || undefined,
          bodyText: bodyText.trim(),
          footerText: footerText.trim() || undefined,
        },
        { abortEarly: false }
      );
    } catch (err: any) {
      if (err instanceof ValidationError) {
        err.inner.forEach((validationErr) => {
          if (validationErr.path) {
            setError(validationErr.path as keyof TemplateFormValues, validationErr.message);
          }
        });
        const firstMessage = err.errors[0] || 'Corrige las validaciones requeridas por Meta.';
        notify('warning', 'Validación de Meta', firstMessage);
        return;
      }
    }

    try {
      setSaving(true);
      const payload: UpsertBaseTemplateDto = {
        bodyText: bodyText.trim(),
      };
      if (headerText.trim()) {
        payload.headerText = headerText.trim();
      }
      if (footerText.trim()) {
        payload.footerText = footerText.trim();
      }

      const result = await saveChannelBaseTemplate(channelConfig.id, payload);
      setTemplate(result);
      notify(
        'success',
        'Sincronizado con Meta',
        'Plantilla actualizada exitosamente en Meta Graph API.'
      );
    } catch (err: any) {
      console.error('Error al guardar plantilla base en Meta:', err);
      notify(
        'error',
        'Error de Sincronización',
        err?.response?.data?.message ||
          'No se pudo registrar o actualizar la plantilla en Meta WhatsApp Cloud API.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Renderizado dinámico de la burbuja de WhatsApp sustituyendo {{1}}, {{2}}, {{3}} por chips de muestra
  const renderPreviewBody = useMemo(() => {
    if (!bodyText) return 'Hola Juan Pérez';

    const sampleData: Record<number, { text: string; bg: string; border: string; color: string }> =
      {
        1: {
          text: 'Juan Pérez',
          bg: 'bg-emerald-100',
          border: 'border-emerald-200',
          color: 'text-emerald-900',
        },
        2: {
          text: 'TIBS Soluciones',
          bg: 'bg-sky-100',
          border: 'border-sky-200',
          color: 'text-sky-900',
        },
        3: {
          text: 'Carlos Asesor',
          bg: 'bg-indigo-100',
          border: 'border-indigo-200',
          color: 'text-indigo-900',
        },
      };

    const parts = bodyText.split(/(\{\{\d+\}\})/);

    return parts.map((part, index) => {
      const match = part.match(/^\{\{(\d+)\}\}$/);
      if (match) {
        const num = parseInt(match[1], 10);
        const sample = sampleData[num] || {
          text: `Dato ${num}`,
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          color: 'text-gray-800',
        };
        return (
          <span
            key={index}
            className={`inline-flex items-center ${sample.bg} ${sample.color} font-bold px-1.5 py-0.5 rounded shadow-2xs mx-0.5 border ${sample.border} text-[11.5px] select-none`}
            title={`Variable {{${num}}} sustituida dinámicamente`}
          >
            {sample.text}
          </span>
        );
      }
      return part;
    });
  }, [bodyText]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <Loader />
        <p className="text-xs font-semibold text-gray-500 mt-3 animate-pulse">
          Consultando estado de la Plantilla Base en Meta Graph API...
        </p>
      </div>
    );
  }

  const status = template?.status || 'DRAFT';

  return (
    <div className="space-y-6 text-left">
      {/* ── Status Banner ── */}
      <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-gray-800 text-sm">
                Plantilla Base de Inicio y Reenganche
              </h4>
              {status === 'APPROVED' ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 size={11} className="mr-0.5" /> Aprobada en Meta
                </Badge>
              ) : status === 'PENDING' ? (
                <Badge variant="warning" size="sm" className="animate-pulse">
                  <Clock size={11} className="mr-0.5" /> En revisión por Meta
                </Badge>
              ) : status === 'REJECTED' ? (
                <Badge variant="error" size="sm">
                  <AlertCircle size={11} className="mr-0.5" /> Rechazada por Meta
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  <Info size={11} className="mr-0.5" /> Borrador / Pendiente de envío
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Esta plantilla se utiliza para iniciar conversaciones y recontactar clientes cuando la
              ventana de 24h ha expirado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {template?.templateId && (
            <div className="bg-white/90 border border-gray-200 rounded-xl px-3 py-1.5 text-right font-mono text-[10px] text-gray-600 shadow-2xs">
              <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider font-sans">
                Meta Template ID
              </span>
              <span className="font-bold text-gray-800 select-all">{template.templateId}</span>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={loadBaseTemplate}
            loading={loading}
            className="py-1.5 px-3 text-[11px] font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Refrescar estado de aprobación desde Meta Graph API"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refrescar Meta</span>
          </Button>
        </div>
      </div>

      {/* ── 2 COLUMNS: Visual Editor & Live WhatsApp Bubble Preview ── */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Optional Header */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Encabezado (Opcional)
              </label>
              <span
                className={`text-[10px] font-mono ${
                  headerText.length > 55 ? 'text-amber-600 font-bold' : 'text-gray-400'
                }`}
              >
                {headerText.length} / 60
              </span>
            </div>
            <input
              type="text"
              value={headerText}
              onChange={(e) => {
                setHeaderText(e.target.value);
                clearError('headerText');
              }}
              placeholder="Ej: Mensaje Importante o Notificación"
              maxLength={60}
              className={`w-full py-2 px-3 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-all font-medium ${
                errors.headerText
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                  : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
              }`}
            />
            {errors.headerText && (
              <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.headerText}</span>
              </p>
            )}
          </div>

          {/* Required Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Cuerpo del Mensaje (Requerido)
              </label>
              <span
                className={`text-[10px] font-mono ${
                  bodyText.length > 950 ? 'text-amber-600 font-bold' : 'text-gray-400'
                }`}
              >
                {bodyText.length} / 1024
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={bodyText}
              onChange={(e) => handleBodyChange(e.target.value)}
              onBlur={() => {
                try {
                  whatsappBodySchema.validateSync(bodyText.trim());
                  clearError('bodyText');
                } catch (err: any) {
                  if (err instanceof ValidationError) {
                    setError('bodyText', err.message);
                  }
                }
              }}
              rows={4}
              placeholder="Hola {{1}}, te saluda {{3}} de {{2}}..."
              maxLength={1024}
              className={`w-full py-2.5 px-3 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-all font-medium leading-relaxed resize-none ${
                errors.bodyText
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                  : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
              }`}
              required
            />

            {/* 3 Botones de Inserción de Variables en Posición de Cursor */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-gray-500 mr-0.5">Insertar variable:</span>
              <button
                type="button"
                onClick={() => handleInsertVariable(1)}
                className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                title="Inserta {{1}} en la posición del cursor (reemplazado por el nombre del contacto)"
              >
                <User size={12} className="text-emerald-700" />
                <code className="bg-white px-1 py-0.2 rounded text-emerald-900 font-mono text-[10px]">
                  {`{{1}}`}
                </code>
                <span>Nombre del Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertVariable(2)}
                className="text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg border border-sky-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                title="Inserta {{2}} en la posición del cursor (reemplazado por la empresa o negocio)"
              >
                <Building2 size={12} className="text-sky-700" />
                <code className="bg-white px-1 py-0.2 rounded text-sky-900 font-mono text-[10px]">
                  {`{{2}}`}
                </code>
                <span>Empresa / Negocio</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertVariable(3)}
                className="text-[11px] font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                title="Inserta {{3}} en la posición del cursor (reemplazado por el asesor o agente asignado)"
              >
                <UserCheck size={12} className="text-indigo-700" />
                <code className="bg-white px-1 py-0.2 rounded text-indigo-900 font-mono text-[10px]">
                  {`{{3}}`}
                </code>
                <span>Asesor / Agente</span>
              </button>
            </div>

            {/* Alerta sutil preventiva de correlatividad */}
            {correlativeAlert && !errors.bodyText && (
              <div className="flex items-center gap-1.5 mt-2 text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 text-[11px]">
                <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                <span>{correlativeAlert}</span>
              </div>
            )}

            {/* Error estándar de validación Yup del cuerpo */}
            {errors.bodyText && (
              <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 mt-1.5">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.bodyText}</span>
              </p>
            )}

            {/* Leyenda explicativa inferior de variables */}
            <div className="flex items-start gap-1.5 mt-2 text-[11px] text-gray-500">
              <HelpCircle size={13} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>
                Las variables <strong>{`{{1}}`}</strong>, <strong>{`{{2}}`}</strong> y{' '}
                <strong>{`{{3}}`}</strong> se reemplazarán automáticamente por el nombre del
                contacto, la empresa y el agente asignado al enviar la plantilla desde el chat.
              </span>
            </div>
          </div>

          {/* Optional Footer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Pie de Mensaje (Opcional)
              </label>
              <span
                className={`text-[10px] font-mono ${
                  footerText.length > 55 ? 'text-amber-600 font-bold' : 'text-gray-400'
                }`}
              >
                {footerText.length} / 60
              </span>
            </div>
            <input
              type="text"
              value={footerText}
              onChange={(e) => {
                setFooterText(e.target.value);
                clearError('footerText');
              }}
              placeholder="Ej: Responde a este mensaje para continuar"
              maxLength={60}
              className={`w-full py-2 px-3 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-all font-medium ${
                errors.footerText
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                  : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
              }`}
            />
            {errors.footerText && (
              <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.footerText}</span>
              </p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="success"
              loading={saving}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <span>Guardar y Sincronizar con Meta</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Live WhatsApp Bubble Preview */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div className="sticky top-4 space-y-2">
            <span className="text-xs font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              Previsualización en Vivo (WhatsApp)
            </span>

            {/* Chat Canvas */}
            <div
              className="rounded-2xl p-5 border border-emerald-950/10 shadow-inner flex flex-col items-start"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage:
                  'radial-gradient(#0000000a 1px, transparent 1px), radial-gradient(#0000000a 1px, #efeae2 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              {/* Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-xs shadow-md p-4 w-full border border-gray-200/60 text-gray-800 space-y-2 select-none">
                {/* Header */}
                {headerText && (
                  <div className="font-extrabold text-gray-900 text-xs border-b border-gray-100 pb-1.5">
                    {headerText}
                  </div>
                )}

                {/* Body with {{1}}, {{2}}, {{3}} dynamically highlighted with chips */}
                <div className="text-xs leading-relaxed font-normal whitespace-pre-wrap text-gray-800">
                  {renderPreviewBody}
                </div>

                {/* Footer */}
                {footerText && (
                  <div className="text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100/70">
                    {footerText}
                  </div>
                )}

                {/* Timestamp & double check */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 font-medium pt-1">
                  <span>10:30 a. m.</span>
                  <CheckCheck size={13} className="text-sky-500" />
                </div>
              </div>

              <div className="mt-3 bg-white/80 backdrop-blur-xs rounded-xl p-2.5 text-[11px] text-gray-500 border border-gray-200/70 shadow-2xs w-full">
                <p className="font-bold text-gray-700 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Impacto Directo en Meta:
                </p>
                <p className="mt-0.5">
                  Al guardar, el backend creará o actualizará la plantilla en Meta Business API
                  registrando automáticamente los ejemplos requeridos para cada variable
                  configurada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WhatsAppBaseTemplateSettings;
