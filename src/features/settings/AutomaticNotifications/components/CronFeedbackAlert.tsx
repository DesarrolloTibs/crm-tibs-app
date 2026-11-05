import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { SaveStatus } from '../schemas/automaticNotifications.schema';

interface CronFeedbackAlertProps {
  saveStatus: SaveStatus;
  errorMsg?: string;
}

export const CronFeedbackAlert: React.FC<CronFeedbackAlertProps> = ({
  saveStatus,
  errorMsg,
}) => {
  if (saveStatus === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-lg animate-fade-in">
        <CheckCircle size={15} className="shrink-0" />
        <span className="font-medium">Configuración guardada correctamente.</span>
      </div>
    );
  }

  if (saveStatus === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg animate-fade-in">
        <AlertCircle size={15} className="shrink-0" />
        <span className="font-medium">
          {errorMsg || 'No se pudo guardar la configuración.'}
        </span>
      </div>
    );
  }

  return null;
};
