import React, { useState, useEffect } from 'react';
import type { Plan, SubscriptionPlanFormData } from '../schemas/subscriptionPlans.schema';
import { validateSubscriptionPlanForm } from '../utils/subscriptionPlans.helpers';
import Button from '../../../../components/shared/Button';
import FormField from '../../../../components/shared/FormField';
import { Layers, DollarSign, Zap, Calendar, Check, AlertCircle } from 'lucide-react';

interface SubscriptionPlanFormProps {
  initialData?: Plan | null;
  onSubmit: (data: SubscriptionPlanFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const PRESET_PERIODS = [
  { months: 1, label: '1 mes (Mensual)' },
  { months: 3, label: '3 meses (Trimestral)' },
  { months: 6, label: '6 meses (Semestral)' },
  { months: 12, label: '12 meses (Anual)' },
];

export const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const [formData, setFormData] = useState<SubscriptionPlanFormData>({
    plan_name: initialData?.plan_name || '',
    price: initialData?.price ?? 0,
    tokens_limit: initialData?.tokens_limit ?? 100000,
    billing_period_months: initialData?.billing_period_months ?? 1,
    blnstatus: initialData?.blnstatus ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        plan_name: initialData.plan_name,
        price: Number(initialData.price) || 0,
        tokens_limit: Number(initialData.tokens_limit) || 100000,
        billing_period_months: Number(initialData.billing_period_months) || 1,
        blnstatus: initialData.blnstatus,
      });
      setErrors({});
      setTouched({});
    } else {
      setFormData({
        plan_name: '',
        price: 0,
        tokens_limit: 100000,
        billing_period_months: 1,
        blnstatus: true,
      });
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  const handleChange = (field: keyof SubscriptionPlanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = async (field: keyof SubscriptionPlanFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = await validateSubscriptionPlanForm(formData);
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({ ...prev, blnstatus: !prev.blnstatus }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { isValid, errors: validationErrors } = await validateSubscriptionPlanForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({
        plan_name: true,
        price: true,
        tokens_limit: true,
        billing_period_months: true,
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo Nombre del Plan */}
      <div className="space-y-1">
        <FormField
          id="plan-name"
          label="Nombre del Plan de Suscripción"
          name="plan_name"
          value={formData.plan_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('plan_name', e.target.value)}
          onBlur={() => handleBlur('plan_name')}
          placeholder="Ej. Plan Starter, Plan Profesional, Plan Enterprise..."
          maxLength={60}
          autoFocus
          error={touched.plan_name ? errors.plan_name : undefined}
          inputPrefix={<Layers size={16} className="text-slate-400" />}
          className="!py-3 !rounded-xl"
        />
        <p className="text-[11px] text-slate-400 ml-1">
          Nombre identificador visible en la selección de planes al aprovisionar o modificar inquilinos.
        </p>
      </div>

      {/* Grid: Precio USD y Límite de Tokens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Precio USD */}
        <div className="space-y-1">
          <FormField
            id="plan-price"
            label="Precio"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange('price', parseFloat(e.target.value) || 0)
            }
            onBlur={() => handleBlur('price')}
            placeholder="0.00"
            error={touched.price ? errors.price : undefined}
            inputPrefix={<DollarSign size={16} className="text-slate-400" />}
            className="!py-3 !rounded-xl font-semibold"
          />
          <p className="text-[11px] text-slate-400 ml-1">
            Tarifa regular asignada a este nivel de suscripción.
          </p>
        </div>

        {/* Límite de Tokens */}
        <div className="space-y-1">
          <FormField
            id="plan-tokens-limit"
            label="Límite de Tokens por Ciclo"
            name="tokens_limit"
            type="number"
            step="1000"
            min="0"
            value={formData.tokens_limit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange('tokens_limit', parseInt(e.target.value, 10) || 0)
            }
            onBlur={() => handleBlur('tokens_limit')}
            placeholder="100000"
            error={touched.tokens_limit ? errors.tokens_limit : undefined}
            inputPrefix={<Zap size={16} className="text-indigo-500" />}
            className="!py-3 !rounded-xl font-mono text-indigo-700 font-bold"
          />
          <p className="text-[11px] text-slate-400 ml-1">
            Tope de consumo mensual/cíclico para agentes IA y RAG.
          </p>
        </div>
      </div>

      {/* Período de Facturación con sugerencias rápidas */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">
          Período de Facturación (Meses)
        </label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {PRESET_PERIODS.map((preset) => (
            <button
              key={preset.months}
              type="button"
              onClick={() => handleChange('billing_period_months', preset.months)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                formData.billing_period_months === preset.months
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <FormField
          id="plan-billing-months"
          name="billing_period_months"
          type="number"
          min="1"
          max="60"
          value={formData.billing_period_months}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('billing_period_months', parseInt(e.target.value, 10) || 1)
          }
          onBlur={() => handleBlur('billing_period_months')}
          placeholder="1"
          error={touched.billing_period_months ? errors.billing_period_months : undefined}
          inputPrefix={<Calendar size={16} className="text-slate-400" />}
          className="!py-2.5 !rounded-xl"
        />
      </div>

      {/* Switch Toggle Estado Activo / Inactivo */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-700 block">Disponibilidad en Catálogo</span>
          <span className="text-[11px] text-slate-400 block">
            {formData.blnstatus
              ? 'El plan está activo y puede ser seleccionado al registrar inquilinos.'
              : 'El plan queda inactivo y no aparecerá en nuevas contrataciones.'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleStatus}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            formData.blnstatus
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {formData.blnstatus ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Activo</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} className="text-slate-400" />
              <span>Inactivo</span>
            </>
          )}
        </button>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="!py-2.5 !px-5 !text-xs !normal-case !tracking-normal font-semibold rounded-xl"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="indigo"
          loading={submitting}
          disabled={submitting}
          className="!py-2.5 !px-6 !text-xs !normal-case !tracking-normal font-bold shadow-md rounded-xl"
        >
          {initialData ? 'Guardar Cambios' : 'Crear Plan'}
        </Button>
      </div>
    </form>
  );
};
