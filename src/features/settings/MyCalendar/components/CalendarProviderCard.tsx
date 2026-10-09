import React from 'react';
import { Mail, Unlink, Link2, Lock } from 'lucide-react';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import type { CalendarProviderConfig, CalendarIntegrationStatus } from '../schemas/myCalendar.schema';
import { renderProviderIcon } from '../utils/myCalendar.helpers';

interface CalendarProviderCardProps {
  provider: CalendarProviderConfig;
  status: CalendarIntegrationStatus;
  actionLoading: string | null;
  onConnectOAuth: (provider: 'google' | 'outlook') => void;
  onDisconnect: () => void;
}

export const CalendarProviderCard: React.FC<CalendarProviderCardProps> = ({
  provider,
  status,
  actionLoading,
  onConnectOAuth,
  onDisconnect,
}) => {
  const isCurrentProviderConnected = status.connected && status.provider === provider.id;
  const isLoadingThisProvider = actionLoading === provider.id;
  const isDisconnecting = actionLoading === 'disconnect' && isCurrentProviderConnected;

  const handleConnectClick = () => {
    onConnectOAuth(provider.id);
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-md ${
        isCurrentProviderConnected
          ? `${provider.activeBorderColor} ring-2 ${provider.activeRingColor}`
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Cabecera del proveedor */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${provider.iconBg} border border-slate-100`}>
            {renderProviderIcon(provider.id, 'w-6 h-6')}
          </div>

          {isCurrentProviderConnected && (
            <Badge variant="success" size="md" dot>
              Activo
            </Badge>
          )}
        </div>

        {/* Información del proveedor */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">{provider.name}</h3>
          </div>
          {provider.tagline && (
            <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
              {provider.tagline}
            </span>
          )}
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {provider.description}
          </p>
        </div>
      </div>

      {/* Acciones de vinculación / desvinculación usando Button compartido */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        {status.connected ? (
          isCurrentProviderConnected ? (
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 truncate bg-slate-50 p-2.5 rounded-xl border border-slate-200/70"
                title={status.email}
              >
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate font-semibold">{status.email}</span>
              </div>
              <Button
                variant="ghost-danger"
                onClick={onDisconnect}
                loading={isDisconnecting}
                disabled={actionLoading !== null}
                className="w-full !py-2.5 !text-xs !normal-case !tracking-normal gap-1.5 border border-rose-200 bg-rose-50/80 hover:bg-rose-100"
              >
                <Unlink size={13} />
                <span>Desvincular cuenta</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              disabled
              title="Solo puedes mantener una cuenta de calendario vinculada a la vez. Desvincula la activa para cambiar de proveedor."
              className="w-full !py-2.5 !text-xs !normal-case !tracking-normal gap-1.5 !opacity-60 cursor-not-allowed"
            >
              <Lock size={12} className="text-slate-400" />
              <span>No disponible (Otro activo)</span>
            </Button>
          )
        ) : (
          <Button
            variant="indigo"
            onClick={handleConnectClick}
            loading={isLoadingThisProvider}
            disabled={actionLoading !== null}
            className="w-full !py-2.5 !text-xs !normal-case !tracking-normal gap-2 shadow-xs cursor-pointer"
          >
            <Link2 size={14} />
            <span>Vincular {provider.name.split(' ')[0]}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CalendarProviderCard;
