import React, { useMemo } from 'react';
import {
  Layers, ShieldCheck, DollarSign, Calendar, Sparkles,
  Zap, ShieldPlus, ShieldAlert, AlertTriangle, Database
} from 'lucide-react';
import Badge from '@shared/components/Badge';
import type { TenantConsumptionData } from '../schemas/myCompany.schema';
import {
  formatNumber,
  formatTokensCompact,
  formatFriendlyDate,
  getRenewalDays,
} from '../utils/myCompany.helpers';

interface PlanSubscriptionOverviewProps {
  consumption: TenantConsumptionData | null;
  isSuperAdmin: boolean;
  isHistorical: boolean;
  togglingExtra: boolean;
  onToggleExtra: () => void;
}

export const PlanSubscriptionOverview: React.FC<PlanSubscriptionOverviewProps> = ({
  consumption,
  isSuperAdmin,
  isHistorical,
  togglingExtra,
  onToggleExtra,
}) => {
  if (!consumption) return null;

  // Métricas calculadas para Plan Base
  const tokensLimit = consumption.tokens_limit ?? 0;
  const tokensUsed = consumption.tokens_used ?? 0;
  const tokensPercent = tokensLimit > 0
    ? Math.min(100, Math.round((tokensUsed / tokensLimit) * 100))
    : 0;
  const baseTokensRemaining = Math.max(0, tokensLimit - tokensUsed);
  const isBaseExhausted = tokensLimit > 0 && tokensUsed >= tokensLimit;

  // Gradiente dinámico de barra base (<75% verde, 75-99% ámbar, >=100% rojo)
  const baseProgressColorClass = useMemo(() => {
    if (tokensPercent >= 100) return 'bg-gradient-to-r from-rose-500 to-red-600';
    if (tokensPercent >= 75) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-emerald-400 to-teal-500';
  }, [tokensPercent]);

  // Métricas calculadas para Consumo Extra (Hard Cap del 100%)
  const allowExtra = Boolean(consumption.allow_extra);
  const tokensExtraUsed = consumption.tokens_extra_used ?? 0;
  const tokensExtraLimit = consumption.tokens_extra_limit ?? tokensLimit;
  const extraPercent = tokensExtraLimit > 0
    ? Math.min(100, Math.round((tokensExtraUsed / tokensExtraLimit) * 100))
    : 0;
  const extraTokensRemaining = Math.max(0, tokensExtraLimit - tokensExtraUsed);
  const isExtraExhausted = allowExtra && tokensExtraLimit > 0 && tokensExtraUsed >= tokensExtraLimit;

  // Cortesía técnica y consumo total
  const hasCourtesyOverage = Boolean(consumption.has_courtesy_overage);
  const tokensOverageAbsorbed = consumption.tokens_overage_absorbed ?? 0;
  const totalTokensConsumed = consumption.total_tokens_consumed ?? (tokensUsed + tokensExtraUsed);

  // Información de renovación
  const renewalInfo = getRenewalDays(consumption.next_renewal_date);

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: DETALLES DE SUSCRIPCIÓN & COSTOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Detalles de la Suscripción</h4>
              <p className="text-[11px] text-slate-400">Condiciones comerciales y período de vigencia</p>
            </div>
          </div>
          <Badge variant={consumption.is_active ? 'purple' : 'neutral'} size="sm">
            {consumption.plan_name || 'Plan Activo'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <ShieldCheck size={14} className="text-indigo-500" />
              <span>Nivel Contratado</span>
            </div>
            <p className="text-sm font-extrabold text-slate-800">
              {consumption.plan_name || 'Plan Estándar'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <DollarSign size={14} className="text-emerald-500" />
              <span>Costo por Período</span>
            </div>
            <p className="text-sm font-extrabold text-slate-800">
              ${consumption.price ? consumption.price.toLocaleString('es-MX') : '0'} MXN
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Calendar size={14} className="text-amber-500" />
              <span>Próxima Renovación</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-slate-800">
                {formatFriendlyDate(consumption.next_renewal_date)}
              </p>
              {renewalInfo && (
                <Badge variant={renewalInfo.variant} size="sm">
                  {renewalInfo.text}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CUOTA BASE & CONSUMO ADICIONAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TARJETA: CUOTA PLAN BASE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Cuota del Plan Base</h4>
                  <p className="text-[11px] text-slate-400">Capacidad mensual de procesamiento incluida</p>
                </div>
              </div>
              <Badge variant={isBaseExhausted ? 'error' : tokensPercent >= 75 ? 'warning' : 'success'} size="sm">
                {tokensPercent}% utilizado
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatNumber(tokensUsed)}
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {formatNumber(tokensLimit)} recursos</span>
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {formatTokensCompact(tokensUsed)} / {formatTokensCompact(tokensLimit)}
                </span>
              </div>

              {/* Barra de progreso con gradiente reactivo */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${baseProgressColorClass}`}
                  style={{ width: `${tokensPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="font-medium text-slate-500">
                  {isBaseExhausted ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle size={13} /> Cuota base agotada
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      Disponible: <strong>{formatNumber(baseTokensRemaining)}</strong> ({100 - tokensPercent}%)
                    </span>
                  )}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Límite mensual: {formatTokensCompact(tokensLimit)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-500 shrink-0" />
            <span>Al corte de facturación, el contador base se reinicia automáticamente al 100%.</span>
          </div>
        </div>

        {/* TARJETA: CONSUMO ADICIONAL (HARD CAP DEL 100%) */}
        <div className={`rounded-2xl border p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5 transition-all ${
          allowExtra
            ? 'bg-white border-purple-200/80 shadow-purple-500/5'
            : 'bg-slate-50/70 border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${allowExtra ? 'bg-purple-50 text-purple-600' : 'bg-slate-200 text-slate-500'}`}>
                  <ShieldPlus size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Margen de Consumo Extra</h4>
                  <p className="text-[11px] text-slate-400">Protección de continuidad ante picos de demanda</p>
                </div>
              </div>

              {/* Conmutador de allow_extra con protección histórica */}
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-bold ${allowExtra ? 'text-purple-700' : 'text-slate-400'}`}>
                  {allowExtra ? 'Habilitado' : 'Bloqueado'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowExtra}
                  onClick={onToggleExtra}
                  disabled={togglingExtra || isHistorical}
                  title={isHistorical ? 'No se puede modificar la cuota en consultas de períodos cerrados' : 'Habilitar/Deshabilitar consumo extra'}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                    allowExtra ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      allowExtra ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {isHistorical && (
              <div className="mt-3 p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium flex items-center gap-2">
                <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                <span>Configuración en modo lectura (auditoría histórica).</span>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {allowExtra ? (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-purple-900 font-mono tracking-tight">
                      +{formatNumber(tokensExtraUsed)}
                      <span className="text-xs font-bold text-slate-400 ml-1">/ {formatNumber(tokensExtraLimit)} max</span>
                    </span>
                    <Badge variant={isExtraExhausted ? 'error' : extraPercent >= 75 ? 'warning' : 'purple'} size="sm">
                      {extraPercent}% del margen
                    </Badge>
                  </div>

                  {/* Barra de progreso de consumo extra con tope estricto del 100% */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        extraPercent >= 100 ? 'bg-rose-500' : extraPercent >= 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                      }`}
                      style={{ width: `${extraPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-600 font-medium">
                      {isExtraExhausted ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <ShieldAlert size={13} /> Margen extra agotado (100%)
                        </span>
                      ) : (
                        <span>Margen disponible: <strong>+{formatNumber(extraTokensRemaining)}</strong></span>
                      )}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Hard Cap: +100% de cuota base
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-700">Consumo adicional desactivado</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Al agotar la cuota base del plan, el Asistente suspenderá las respuestas hasta el corte de facturación para prevenir cargos adicionales.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-[11px] text-purple-900 flex items-center gap-2">
            <Zap size={14} className="text-purple-600 shrink-0" />
            <span>Tope técnico inquebrantable: el consumo extra no puede exceder el 100% adicional del plan contratado.</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: CORTESÍA TÉCNICA ABSORBIDA (SUPERADMIN AUDITORÍA) */}
      {isSuperAdmin && hasCourtesyOverage && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-purple-950">
                  Cortesía Técnica Absorbida por la Plataforma
                </h4>
                <Badge variant="purple" size="sm">Absorbido SaaS</Badge>
              </div>
              <p className="text-xs text-purple-800 mt-1 max-w-2xl leading-relaxed">
                Esta organización registró un desborde técnico que fue cubierto sin interrupción ni costo adicional por las políticas de alta disponibilidad de la plataforma.
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-purple-200 sm:pl-6 shrink-0">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
              Recursos Asumidos
            </span>
            <span className="text-xl font-black text-purple-900 font-mono">
              +{formatNumber(tokensOverageAbsorbed)}
            </span>
            <span className="text-[10px] text-purple-600 block mt-0.5">
              Consumo real total: {formatNumber(totalTokensConsumed)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
