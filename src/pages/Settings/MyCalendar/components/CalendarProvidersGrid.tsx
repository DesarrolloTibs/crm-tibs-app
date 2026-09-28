import React from 'react';
import type { CalendarProviderConfig, CalendarIntegrationStatus } from '../schemas/myCalendar.schema';
import { CalendarProviderCard } from './CalendarProviderCard';

interface CalendarProvidersGridProps {
  providers: CalendarProviderConfig[];
  status: CalendarIntegrationStatus;
  actionLoading: string | null;
  onConnectOAuth: (provider: 'google' | 'outlook') => void;
  onDisconnect: () => void;
}

export const CalendarProvidersGrid: React.FC<CalendarProvidersGridProps> = ({
  providers,
  status,
  actionLoading,
  onConnectOAuth,
  onDisconnect,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Proveedores de Calendario Disponibles
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona la plataforma donde gestionas tu agenda diaria para sincronizar tus citas del CRM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {providers.map((provider) => (
          <CalendarProviderCard
            key={provider.id}
            provider={provider}
            status={status}
            actionLoading={actionLoading}
            onConnectOAuth={onConnectOAuth}
            onDisconnect={onDisconnect}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarProvidersGrid;
