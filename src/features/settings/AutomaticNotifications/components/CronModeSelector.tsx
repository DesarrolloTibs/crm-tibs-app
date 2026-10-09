import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import type { CronMode } from '../schemas/automaticNotifications.schema';

interface CronModeSelectorProps {
  mode: CronMode;
  onModeChange: (mode: CronMode) => void;
}

export const CronModeSelector: React.FC<CronModeSelectorProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
        Modo de ejecución
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tarjeta Hora Fija */}
        <button
          type="button"
          onClick={() => onModeChange('fixed')}
          className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            mode === 'fixed'
              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {mode === 'fixed' && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />
          )}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'fixed'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Clock size={16} />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                mode === 'fixed' ? 'text-indigo-700' : 'text-gray-700'
              }`}
            >
              Hora fija
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Una vez al día a la hora que definas
            </p>
          </div>
        </button>

        {/* Tarjeta Intervalo */}
        <button
          type="button"
          onClick={() => onModeChange('interval')}
          className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            mode === 'interval'
              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {mode === 'interval' && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />
          )}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'interval'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <RefreshCw size={16} />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                mode === 'interval' ? 'text-indigo-700' : 'text-gray-700'
              }`}
            >
              Intervalo
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Repetir cada cierto número de horas y minutos
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
