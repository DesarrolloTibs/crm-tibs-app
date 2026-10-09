import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import Button from '../../../../components/shared/Button';
import Select from '../../../../components/shared/Select';
import type {
  TenantPlanInfo,
  Plan,
  RenewalQueueResponse,
  RenewalQueueItem,
} from '../schemas/tenants.schema';

interface TenantRenewalQueueTabProps {
  tenant: TenantPlanInfo;
  plans: Plan[];
  queueData: RenewalQueueResponse | null;
  queueLoading: boolean;
  queueSubmitting: boolean;
  onRefreshQueue: () => void;
  onRemoveQueueItem: (item: RenewalQueueItem) => void;
  onEnqueueSubmit: (data: { planId: number; periodsCount: number }) => Promise<void>;
  onClose: () => void;
}

export const TenantRenewalQueueTab: React.FC<TenantRenewalQueueTabProps> = ({
  tenant,
  plans,
  queueData,
  queueLoading,
  queueSubmitting,
  onRefreshQueue,
  onRemoveQueueItem,
  onEnqueueSubmit,
  onClose,
}) => {
  const initialPlanId = tenant.plan_id || (plans[0]?.plan_id ?? 1);
  const [queuePlanId, setQueuePlanId] = useState<number>(initialPlanId);
  const [queuePeriodsCount, setQueuePeriodsCount] = useState<number>(1);

  const planOptions = plans.map((p) => ({
    value: p.plan_id,
    label: `${p.plan_name} — $${Number(p.price).toFixed(2)} (${p.tokens_limit.toLocaleString()} tokens)`,
  }));

  const selectedQPlan = plans.find((p) => p.plan_id === queuePlanId);
  const resolvedQueueMonths = selectedQPlan?.billing_period_months || 1;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onEnqueueSubmit({
      planId: queuePlanId,
      periodsCount: queuePeriodsCount,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tarjetas de Métricas de Cobertura */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Corte Actual
          </div>
          <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            {tenant.next_renewal_date
              ? new Date(tenant.next_renewal_date).toLocaleDateString()
              : 'Sin fecha'}
          </div>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Períodos en Cola
          </div>
          <div className="text-sm font-bold text-amber-900 mt-1 flex items-center gap-1.5">
            <Layers size={14} className="text-amber-600" />
            {queueData?.total_queued_periods || 0} período(s) ({queueData?.total_queued_months || 0} m.)
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Cobertura Proyectada
          </div>
          <div className="text-sm font-bold text-emerald-900 mt-1 flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-600" />
            {queueData?.coverage_until
              ? new Date(queueData.coverage_until).toLocaleDateString()
              : tenant.next_renewal_date
              ? new Date(tenant.next_renewal_date).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Listado de Períodos en Cola */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Clock size={14} />
            Secuencia de Períodos Encolados
          </h4>
          <Button
            variant="ghost"
            onClick={onRefreshQueue}
            title="Recargar cola"
            className="!text-xs text-indigo-600 hover:!text-indigo-800 flex items-center gap-1 font-medium !p-1"
          >
            <RefreshCw size={12} className={queueLoading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </Button>
        </div>

        {queueLoading ? (
          <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-slate-100">
            <RefreshCw size={14} className="animate-spin text-amber-500" />
            Calculando proyecciones de cola...
          </div>
        ) : !queueData?.items || queueData.items.length === 0 ? (
          <div className="p-5 text-center bg-slate-50 rounded-xl border border-slate-200/70 text-slate-500 text-xs space-y-1">
            <div className="font-semibold text-slate-700">No hay renovaciones en cola programadas</div>
            <p className="text-slate-400">
              Agrega períodos prepagados para asegurar la continuidad del servicio al vencer el corte actual.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {queueData.items.map((item: RenewalQueueItem) => (
              <div
                key={item.queue_id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-colors flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                    #{item.queue_position}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>{item.plan_name}</span>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 font-mono px-1.5 py-0.5 rounded">
                        {item.tokens_limit.toLocaleString()} tokens
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.billing_period_months} mes(es) • ${item.price}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <span>{new Date(item.projected_start_date).toLocaleDateString()}</span>
                      <ArrowRight size={10} className="text-slate-400" />
                      <span className="text-slate-700 font-semibold">
                        {new Date(item.projected_end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost-danger"
                  onClick={() => onRemoveQueueItem(item)}
                  title="Cancelar este período de la cola"
                  className="!p-1.5 text-slate-400 hover:!text-rose-600 hover:!bg-rose-50 shrink-0"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario para Encolar Nuevos Períodos */}
      <div className="pt-3 border-t border-slate-100 bg-slate-50/60 p-4 rounded-xl border">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
          <Plus size={14} className="text-indigo-600" />
          Encolar Nuevos Períodos Prepagados
        </h4>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="queuePlanId"
                className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
              >
                Plan a Encolar
              </label>
              <Select
                inputId="queuePlanId"
                value={planOptions.find((opt) => opt.value === queuePlanId)}
                onChange={(selected: any) => selected && setQueuePlanId(Number(selected.value))}
                options={planOptions}
                isSearchable={false}
                placeholder="Seleccione un plan a encolar..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Vigencia por Período
              </label>
              <div className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between min-h-[54px]">
                <span>{resolvedQueueMonths} mes(es)</span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
                  {resolvedQueueMonths === 12
                    ? 'Ciclo Anual'
                    : resolvedQueueMonths === 1
                    ? 'Ciclo Mensual'
                    : `Ciclo ${resolvedQueueMonths}m`}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Cantidad de Períodos a Encolar (Lote)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 6, 12].map((num) => (
                <Button
                  key={num}
                  variant="ghost"
                  type="button"
                  onClick={() => setQueuePeriodsCount(num)}
                  className={`!px-3 !py-1.5 !text-xs !font-semibold !rounded-lg border transition-all ${
                    queuePeriodsCount === num
                      ? '!bg-indigo-600 !text-white !border-indigo-600 shadow-2xs'
                      : '!bg-white !text-slate-700 !border-slate-200 hover:!border-slate-300'
                  }`}
                >
                  {num} {num === 1 ? 'período' : 'períodos'}
                </Button>
              ))}
              <input
                type="number"
                min={1}
                max={60}
                value={queuePeriodsCount}
                onChange={(e) => setQueuePeriodsCount(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total a respaldar:{' '}
              <strong>{resolvedQueueMonths * queuePeriodsCount} meses adicionales</strong> en{' '}
              {queuePeriodsCount} ciclo(s).
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="!py-2 !px-4 !text-xs !font-semibold !normal-case !tracking-normal"
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              variant="indigo"
              loading={queueSubmitting}
              disabled={queueSubmitting}
              className="!py-2 !px-4 !text-xs !font-bold !normal-case !tracking-normal !bg-amber-600 hover:!bg-amber-700 !shadow-amber-500/20 flex items-center gap-1.5 shadow-xs"
            >
              <span>Encolar Renovación</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
