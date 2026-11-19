import React, { useState, useEffect } from 'react';
import { Building2, Database, Check, Mic, Info, Sparkles } from 'lucide-react';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';
import FormField from '@shared/components/FormField';
import Switch from '@shared/components/Switch';
import Input from '@shared/components/Input';
import { useAuth } from '@features/auth';
import type {
  TenantPlanInfo,
  TenantGeneralFormData,
  GlobalAiProviderMeta,
} from '../schemas/tenants.schema';
import { validateTenantGeneralForm } from '../utils/tenants.helpers';

interface TenantGeneralTabProps {
  tenant: TenantPlanInfo;
  onSubmit: (data: TenantGeneralFormData) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
  globalAiProvider?: GlobalAiProviderMeta | null;
}

export const TenantGeneralTab: React.FC<TenantGeneralTabProps> = ({
  tenant,
  onSubmit,
  onClose,
  submitting,
  globalAiProvider = null,
}) => {
  const { isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState<TenantGeneralFormData>({
    name: tenant.name,
    is_active: tenant.is_active,
    allow_extra: tenant.allow_extra,
    ibm_audio_enabled: Boolean(tenant.ibm_audio_enabled),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      name: tenant.name,
      is_active: tenant.is_active,
      allow_extra: tenant.allow_extra,
      ibm_audio_enabled: Boolean(tenant.ibm_audio_enabled),
    });
    setErrors({});
    setTouched({});
  }, [tenant]);

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));
    if (errors.name) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleBlurName = async () => {
    setTouched((prev) => ({ ...prev, name: true }));
    const result = await validateTenantGeneralForm(formData);
    if (!result.isValid && result.errors.name) {
      setErrors((prev) => ({ ...prev, name: result.errors.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await validateTenantGeneralForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      setTouched({ name: true });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo Nombre */}
      <FormField
        id="tenant-general-name"
        label="Nombre de la Organización"
        name="name"
        value={formData.name}
        onChange={handleChangeName}
        onBlur={handleBlurName}
        required
        error={touched.name ? errors.name : undefined}
        inputPrefix={<Building2 size={16} className="text-slate-400" />}
      />

      {/* Esquema de BD (Solo lectura) */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          Esquema de Base de Datos
        </label>
        <Input
          size="sm"
          type="text"
          disabled
          value={tenant.schema_name}
          inputPrefix={<Database size={15} />}
          className="!py-2.5 !pl-9 font-mono text-slate-500 cursor-not-allowed select-all"
        />
        <p className="text-[11px] text-slate-400 ml-1">
          Identificador inmutable asignado en PostgreSQL para aislamiento multitenant.
        </p>
      </div>

      {/* Switches de Estado y Excedente */}
      <div className="space-y-3 pt-2">
        <Switch
          id="tenant-is-active-switch"
          checked={formData.is_active}
          onChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
          color="emerald"
          label="Organización Activa"
          description="Permite a los usuarios y administradores iniciar sesión en la plataforma y consumir recursos."
        />

        <Switch
          id="tenant-allow-extra-switch"
          checked={formData.allow_extra}
          onChange={(checked) => setFormData((prev) => ({ ...prev, allow_extra: checked }))}
          color="indigo"
          label="Permitir Consumo Excedente de Tokens"
          description="Habilita el margen de sobreconsumo (sobrefacturación autorizada) cuando la organización agote su cuota mensual contratada."
        />

        {/* Add-on IBM Speech-to-Text (Exclusivo SuperAdmin) */}
        {isSuperAdmin && (
          <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/40 border border-indigo-200/80 rounded-xl space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700 inline-flex items-center justify-center">
                    <Mic size={13} />
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Soporte de Audio (IBM Speech-to-Text)
                  </span>
                  <Badge variant={formData.ibm_audio_enabled ? 'indigo' : 'neutral'} size="sm">
                    {formData.ibm_audio_enabled ? 'Add-on Activo' : 'Add-on Inactivo'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Habilita la transcripción de notas de voz en WebChat interno y canales externos (WhatsApp, Messenger e Instagram) mediante IBM Speech-to-Text.
                </p>
              </div>

              <Switch
                id="tenant-ibm-audio-switch"
                checked={Boolean(formData.ibm_audio_enabled)}
                onChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    ibm_audio_enabled: checked,
                  }))
                }
                color="indigo"
                title="Habilitar o deshabilitar Soporte de Audio (IBM Speech-to-Text)"
                className="mt-0.5"
              />
            </div>

            {/* Aclaración visual destacada del add-on */}
            <div className="p-3 rounded-lg bg-amber-50/90 border border-amber-200/90 text-[11px] text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info size={13} className="text-amber-700 shrink-0" />
                <span>Condiciones comerciales y técnicas del Add-on</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-amber-900/90 leading-snug">
                <li>
                  <strong>Costo adicional al plan:</strong> Este complemento de audio tiene facturación adicional a la suscripción base de la organización.
                </li>
                <li>
                  <strong>Aplica con proveedor global IBM:</strong> Opera cuando el proveedor global de IA de la plataforma es <strong>IBM (WatsonX)</strong>.
                </li>
                <li>
                  <strong>Sin descuento de cuota de tokens:</strong> La transcripción de voz a texto <strong>no consume tokens de la cuota del cliente</strong> (únicamente se consumen tokens al procesar el texto transcrito con el LLM).
                </li>
              </ul>

              {globalAiProvider && (
                <div className="pt-1.5 mt-1.5 border-t border-amber-200/70 flex flex-wrap items-center gap-1.5">
                  <Sparkles size={12} className={globalAiProvider.isIbm ? 'text-indigo-600' : 'text-sky-600'} />
                  <span className="font-semibold text-slate-700">Proveedor global activo:</span>
                  <Badge variant={globalAiProvider.isIbm ? 'indigo' : 'info'} size="sm">
                    {globalAiProvider.label}
                  </Badge>
                  <span className="text-[10px] text-slate-600">
                    {globalAiProvider.isIbm
                      ? '(Aplica inmediatamente en la plataforma)'
                      : '(Motor multimodal activo; este add-on aplicará si la plataforma opera con IBM)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={submitting}
          className="!py-2 !px-4 !text-xs !font-semibold !normal-case !tracking-normal"
        >
          Cerrar
        </Button>
        <Button
          type="submit"
          variant="indigo"
          loading={submitting}
          disabled={submitting}
          className="!py-2 !px-4 !text-xs !font-bold !normal-case !tracking-normal flex items-center gap-1.5 shadow-xs"
        >
          <Check size={15} />
          <span>Guardar Cambios Generales</span>
        </Button>
      </div>
    </form>
  );
};
