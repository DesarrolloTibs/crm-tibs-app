import React, { useState, useEffect } from 'react';
import { Building2, Database, Check } from 'lucide-react';
import Button from '../../../../components/shared/Button';
import FormField from '../../../../components/shared/FormField';
import type { TenantPlanInfo, TenantGeneralFormData } from '../schemas/tenants.schema';
import { validateTenantGeneralForm } from '../utils/tenants.helpers';

interface TenantGeneralTabProps {
  tenant: TenantPlanInfo;
  onSubmit: (data: TenantGeneralFormData) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

export const TenantGeneralTab: React.FC<TenantGeneralTabProps> = ({
  tenant,
  onSubmit,
  onClose,
  submitting,
}) => {
  const [formData, setFormData] = useState<TenantGeneralFormData>({
    name: tenant.name,
    is_active: tenant.is_active,
    allow_extra: tenant.allow_extra,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData({
      name: tenant.name,
      is_active: tenant.is_active,
      allow_extra: tenant.allow_extra,
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Database size={16} />
          </div>
          <input
            type="text"
            disabled
            value={tenant.schema_name}
            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed select-all"
          />
        </div>
        <p className="text-[11px] text-slate-400 ml-1">
          Identificador inmutable asignado en PostgreSQL para aislamiento multitenant.
        </p>
      </div>

      {/* Switches de Estado y Excedente */}
      <div className="space-y-3 pt-2">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800">
              Organización Activa
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Permite a los usuarios y administradores iniciar sesión en la plataforma y consumir recursos.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800">
              Permitir Consumo Excedente de Tokens
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Habilita el margen de sobreconsumo (sobrefacturación autorizada) cuando la organización agote su cuota mensual contratada.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={formData.allow_extra}
              onChange={(e) => setFormData((prev) => ({ ...prev, allow_extra: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>
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
