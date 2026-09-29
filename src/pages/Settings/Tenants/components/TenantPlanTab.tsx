import React, { useState } from 'react';
import { Sparkles, Calendar, Zap, Check } from 'lucide-react';
import Button from '../../../../components/shared/Button';
import Select from '../../../../components/shared/Select';
import type { TenantPlanInfo, Plan } from '../schemas/tenants.schema';

interface TenantPlanTabProps {
  tenant: TenantPlanInfo;
  plans: Plan[];
  onSubmit: (data: {
    planId: number;
    changeType: 'immediate' | 'next_period';
    immediatePolicy?: 'reset_date' | 'keep_current_date';
    months: number;
    updateQueuedPlans?: boolean;
    allowExtra?: boolean;
  }) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

export const TenantPlanTab: React.FC<TenantPlanTabProps> = ({
  tenant,
  plans,
  onSubmit,
  onClose,
  submitting,
}) => {
  const initialPlanId = tenant.plan_id || (plans[0]?.plan_id ?? 1);
  const [assignPlanId, setAssignPlanId] = useState<number>(initialPlanId);
  const [assignAllowExtra, setAssignAllowExtra] = useState<boolean>(tenant.allow_extra);
  const [planApplicationMode, setPlanApplicationMode] = useState<
    'immediate_keep' | 'immediate_reset' | 'next_period'
  >('immediate_keep');
  const [updateQueuedPlans, setUpdateQueuedPlans] = useState<boolean>(false);

  const planOptions = plans.map((p) => ({
    value: p.plan_id,
    label: `${p.plan_name} — $${Number(p.price).toFixed(2)} (${p.tokens_limit.toLocaleString()} tokens)`,
  }));

  const selectedPlan = plans.find((p) => p.plan_id === assignPlanId);
  const resolvedMonths = selectedPlan?.billing_period_months || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedChangeType = planApplicationMode === 'next_period' ? 'next_period' : 'immediate';
    const resolvedImmediatePolicy =
      planApplicationMode === 'immediate_keep' ? 'keep_current_date' : 'reset_date';

    await onSubmit({
      planId: assignPlanId,
      changeType: resolvedChangeType,
      immediatePolicy: resolvedChangeType === 'immediate' ? resolvedImmediatePolicy : undefined,
      months: resolvedMonths,
      updateQueuedPlans: resolvedChangeType === 'immediate' ? updateQueuedPlans : undefined,
      allowExtra: assignAllowExtra,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selector de Plan y Duración */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="assignPlanId"
            className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
          >
            Nuevo Plan
          </label>
          <Select
            inputId="assignPlanId"
            value={planOptions.find((opt) => opt.value === assignPlanId)}
            onChange={(selected: any) => selected && setAssignPlanId(Number(selected.value))}
            options={planOptions}
            isSearchable={false}
            placeholder="Seleccione un plan..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Duración del Plan
          </label>
          <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between min-h-[54px]">
            <span>{resolvedMonths} mes(es)</span>
            <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
              {resolvedMonths === 12 ? 'Anual' : resolvedMonths === 1 ? 'Mensual' : `${resolvedMonths} meses`}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Modalidades de Aplicación */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          Modalidad de Aplicación del Plan
        </label>
        <div className="space-y-2.5">
          {/* Opción 1: Upgrade Inmediato */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              planApplicationMode === 'immediate_keep'
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/20 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
            }`}
          >
            <input
              type="radio"
              name="planApplicationMode"
              value="immediate_keep"
              checked={planApplicationMode === 'immediate_keep'}
              onChange={() => setPlanApplicationMode('immediate_keep')}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                Upgrade Inmediato (Mantener fecha de corte actual)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Aplica el nuevo plan y cuota de tokens <strong>hoy mismo</strong>. La fecha de corte se mantiene en{' '}
                <strong>
                  {tenant.next_renewal_date ? new Date(tenant.next_renewal_date).toLocaleDateString() : 'fecha vigente'}
                </strong>{' '}
                sin perder los días ya cubiertos del ciclo en curso.
              </div>
            </div>
          </label>

          {/* Opción 2: Nuevo Ciclo desde Hoy */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              planApplicationMode === 'immediate_reset'
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/20 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
            }`}
          >
            <input
              type="radio"
              name="planApplicationMode"
              value="immediate_reset"
              checked={planApplicationMode === 'immediate_reset'}
              onChange={() => setPlanApplicationMode('immediate_reset')}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                Nuevo Ciclo desde Hoy (Reiniciar período)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Aplica el plan hoy y resetea el ciclo de facturación. La nueva fecha de corte se calculará desde hoy (+{resolvedMonths} mes(es)).
              </div>
            </div>
          </label>

          {/* Opción 3: Programar para el Próximo Ciclo */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              planApplicationMode === 'next_period'
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/20 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
            }`}
          >
            <input
              type="radio"
              name="planApplicationMode"
              value="next_period"
              checked={planApplicationMode === 'next_period'}
              onChange={() => setPlanApplicationMode('next_period')}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Zap size={14} className="text-indigo-600" />
                Programar para el Próximo Ciclo (Al vencimiento)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                El plan actual sigue activo hasta el{' '}
                <strong>
                  {tenant.next_renewal_date ? new Date(tenant.next_renewal_date).toLocaleDateString() : 'vencimiento'}
                </strong>. El nuevo plan se guardará en la cola de renovación y se activará automáticamente al vencer.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Checkbox condicional para actualizar períodos en cola si el cambio es inmediato */}
      {planApplicationMode !== 'next_period' && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={updateQueuedPlans}
              onChange={(e) => setUpdateQueuedPlans(e.target.checked)}
              className="rounded text-indigo-600 w-4 h-4 focus:ring-indigo-500"
            />
            <span>Actualizar también los períodos ya encolados al nuevo plan contratado</span>
          </label>
        </div>
      )}

      {/* Consumo Excedente */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={assignAllowExtra}
            onChange={(e) => setAssignAllowExtra(e.target.checked)}
            className="rounded text-indigo-600 w-4 h-4 focus:ring-indigo-500"
          />
          <span>Permitir consumo de tokens excedente (Sobrefacturación autorizada)</span>
        </label>
      </div>

      {/* Botones de acción */}
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
          <span>Aplicar Plan</span>
        </Button>
      </div>
    </form>
  );
};
