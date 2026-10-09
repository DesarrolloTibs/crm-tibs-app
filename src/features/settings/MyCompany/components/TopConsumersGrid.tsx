import React from 'react';
import { UserCheck, Users } from 'lucide-react';
import Badge from '@shared/components/Badge';
import EmptyState from '@shared/components/EmptyState';
import type { TopUserConsumption, TopClientConsumption } from '../schemas/myCompany.schema';
import {
  formatNumber,
  getUserInitials,
  getChannelMeta,
} from '../utils/myCompany.helpers';

interface TopConsumersGridProps {
  topUsers?: TopUserConsumption[];
  topClients?: TopClientConsumption[];
}

export const TopConsumersGrid: React.FC<TopConsumersGridProps> = ({
  topUsers = [],
  topClients = [],
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* COLUMNA 1: TOP USUARIOS INTERNOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="text-indigo-600" size={18} />
              Top Usuarios del Equipo (Webchat CRM)
            </h4>
            <Badge variant="indigo" size="sm">
              {topUsers.length} usuarios
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Integrantes del equipo que más se apoyan en el Asistente para responder a clientes.
          </p>
        </div>

        {!topUsers.length ? (
          <EmptyState
            icon={<UserCheck className="w-8 h-8 text-slate-400" />}
            title="Sin actividad de usuarios"
            message="No hay registros de consumo por usuarios del equipo en el período activo."
            className="py-10"
          />
        ) : (
          <div className="space-y-3">
            {topUsers.map((u: TopUserConsumption, index: number) => {
              const maxTokens = Math.max(...(topUsers.map(x => x.total_tokens) || [1]), 1);
              const relPercent = Math.round((u.total_tokens / maxTokens) * 100);

              return (
                <div
                  key={u.user_id}
                  className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center font-mono text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>

                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                      {getUserInitials(u.user_name)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {u.user_name || `Usuario #${u.user_id}`}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                        <span>{formatNumber(u.request_count)} consultas</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 font-mono block">
                      {formatNumber(u.total_tokens)}
                    </span>
                    <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden ml-auto mt-1">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${Math.max(relPercent, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMNA 2: TOP CLIENTES EXTERNOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-emerald-600" size={18} />
              Top Clientes Atendidos (WhatsApp / Redes)
            </h4>
            <Badge variant="success" size="sm">
              {topClients.length} clientes
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contactos y prospectos con mayor volumen de atención automatizada.
          </p>
        </div>

        {!topClients.length ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title="Sin actividad de clientes"
            message="No hay registros de clientes externos en el período activo."
            className="py-10"
          />
        ) : (
          <div className="space-y-3">
            {topClients.map((c: TopClientConsumption, index: number) => {
              const maxTokens = Math.max(...(topClients.map(x => x.total_tokens) || [1]), 1);
              const relPercent = Math.round((c.total_tokens / maxTokens) * 100);
              const meta = getChannelMeta(c.channel);

              return (
                <div
                  key={`${c.client_id}-${c.channel}`}
                  className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center font-mono text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>

                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                      {getUserInitials(c.client_name)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {c.client_name || `Cliente #${c.client_id}`}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={meta.badgeVariant} size="sm">
                          {meta.icon}
                          <span>{meta.label}</span>
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatNumber(c.request_count)} msgs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 font-mono block">
                      {formatNumber(c.total_tokens)}
                    </span>
                    <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden ml-auto mt-1">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(relPercent, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
