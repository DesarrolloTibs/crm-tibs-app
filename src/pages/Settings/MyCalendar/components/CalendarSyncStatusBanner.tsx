import React from 'react';
import { Unlink, Mail, RefreshCw } from 'lucide-react';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import type { CalendarIntegrationStatus } from '../schemas/myCalendar.schema';
import { getProviderMeta, renderProviderIcon } from '../utils/myCalendar.helpers';

interface CalendarSyncStatusBannerProps {
  status: CalendarIntegrationStatus;
  actionLoading: string | null;
  onDisconnect: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CalendarSyncStatusBanner: React.FC<CalendarSyncStatusBannerProps> = ({
  status,
  actionLoading,
  onDisconnect,
  onRefresh,
  loading,
}) => {
  const providerMeta = getProviderMeta(status.provider);

  // Si no hay calendario conectado, no mostrar ningún banner vacío redundante
  if (!status.connected || !providerMeta) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            {renderProviderIcon(status.provider, 'w-6 h-6')}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success" size="md" dot>
                Sincronización en Tiempo Real Activa
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                Proveedor: {providerMeta.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-700 font-medium">
              <Mail size={13} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">{status.email}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Todas las citas del CRM se reflejan automáticamente en tu agenda</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={loading || actionLoading !== null}
            title="Verificar estado de sincronización con el servidor"
            className="!p-2.5 shadow-2xs hover:shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-600'} />
          </Button>

          <Button
            variant="ghost-danger"
            onClick={onDisconnect}
            disabled={actionLoading !== null}
            className="flex-1 sm:flex-none !py-2.5 !px-3.5 !text-xs !normal-case !tracking-normal gap-1.5 border border-rose-200 bg-rose-50/80 hover:bg-rose-100"
          >
            <Unlink size={13} />
            <span>Desvincular</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSyncStatusBanner;
