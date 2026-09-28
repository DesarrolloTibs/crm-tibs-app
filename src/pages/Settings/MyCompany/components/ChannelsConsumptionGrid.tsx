import React, { useMemo } from 'react';
import { Smartphone } from 'lucide-react';
import Badge from '../../../../components/shared/Badge';
import EmptyState from '../../../../components/shared/EmptyState';
import type { ChannelConsumption } from '../schemas/myCompany.schema';
import {
  formatNumber,
  formatTokensCompact,
  getChannelMeta,
} from '../utils/myCompany.helpers';

interface ChannelsConsumptionGridProps {
  channels?: ChannelConsumption[];
}

export const ChannelsConsumptionGrid: React.FC<ChannelsConsumptionGridProps> = ({
  channels = [],
}) => {
  const totalChannelTokens = useMemo(() => {
    if (!channels.length) return 1;
    return channels.reduce((sum, c) => sum + (c.total_tokens || 0), 0) || 1;
  }, [channels]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="text-indigo-600" size={18} />
            Distribución de Consumo por Canal de Comunicación
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Consumo de recursos en WhatsApp, Webchat Interno, Base de Conocimiento y redes sociales durante el período auditado.
          </p>
        </div>
        <Badge variant="indigo" size="sm">
          Total: {formatTokensCompact(totalChannelTokens)} recursos
        </Badge>
      </div>

      {!channels.length ? (
        <EmptyState
          icon={<Smartphone className="w-8 h-8 text-slate-400" />}
          title="Sin datos de canales"
          message="No hay registros de consumo por canal en el período seleccionado."
          className="py-12"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch: ChannelConsumption) => {
            const meta = getChannelMeta(ch.channel);
            const pct = Math.round(((ch.total_tokens || 0) / totalChannelTokens) * 100);

            return (
              <div
                key={ch.channel}
                className={`p-5 rounded-2xl border ${meta.borderColor} ${meta.bgColor}/50 space-y-3.5 transition-all hover:shadow-xs`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                    <span className={`p-2 rounded-xl bg-white shadow-xs border ${meta.borderColor}`}>
                      {meta.icon}
                    </span>
                    <span>{meta.label}</span>
                  </div>
                  <Badge variant={meta.badgeVariant} size="sm">
                    {pct}%
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {formatNumber(ch.total_tokens)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formatNumber(ch.request_count)} interacciones
                    </span>
                  </div>

                  <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full rounded-full ${meta.barColor}`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Desglose amigable de Consultas y Respuestas */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Consultas Recibidas</span>
                    <span className="font-mono font-bold text-slate-700">{formatTokensCompact(ch.prompt_tokens)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Respuestas Generadas</span>
                    <span className="font-mono font-bold text-slate-700">{formatTokensCompact(ch.completion_tokens)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
