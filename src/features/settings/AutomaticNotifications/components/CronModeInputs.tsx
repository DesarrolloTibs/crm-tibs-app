import React from 'react';
import Input from '@shared/components/Input';
import type { CronMode } from '../schemas/automaticNotifications.schema';

interface CronModeInputsProps {
  mode: CronMode;
  fixedTime: string;
  onFixedTimeChange: (time: string) => void;
  intervalHours: number;
  onIntervalHoursChange: (hours: number) => void;
  intervalMinutes: number;
  onIntervalMinutesChange: (minutes: number) => void;
}

export const CronModeInputs: React.FC<CronModeInputsProps> = ({
  mode,
  fixedTime,
  onFixedTimeChange,
  intervalHours,
  onIntervalHoursChange,
  intervalMinutes,
  onIntervalMinutesChange,
}) => {
  return (
    <div
      className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-4 animate-fade-in"
      key={mode}
    >
      {mode === 'fixed' ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="cron-fixed-time"
            className="text-xs font-bold uppercase tracking-wider text-gray-400"
          >
            Hora de ejecución
          </label>
          <Input
            id="cron-fixed-time"
            type="time"
            value={fixedTime}
            onChange={(e) => onFixedTimeChange(e.target.value)}
            className="w-full sm:w-44 bg-white"
          />
          <p className="text-xs text-gray-400 mt-0.5">
            El correo se enviará una vez al día a esta hora.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Repetir cada
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                id="cron-interval-hours"
                type="number"
                min={0}
                max={23}
                value={intervalHours}
                onChange={(e) =>
                  onIntervalHoursChange(
                    Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0))
                  )
                }
                className="w-20 text-center bg-white"
              />
              <label
                htmlFor="cron-interval-hours"
                className="text-sm text-gray-600 font-medium"
              >
                horas
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="cron-interval-minutes"
                type="number"
                min={0}
                max={59}
                value={intervalMinutes}
                onChange={(e) =>
                  onIntervalMinutesChange(
                    Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0))
                  )
                }
                className="w-20 text-center bg-white"
              />
              <label
                htmlFor="cron-interval-minutes"
                className="text-sm text-gray-600 font-medium"
              >
                minutos
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Rango: mínimo 1 minuto, máximo 23 h 59 min.
          </p>
        </div>
      )}
    </div>
  );
};
