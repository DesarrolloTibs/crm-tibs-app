import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export type NotificationVariant = 'loading' | 'success' | 'error' | 'warning' | 'confirmation';

export interface NotificationProps {
  type: NotificationVariant;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  show: boolean;
  /** Duración en ms para auto-cerrar en estado 'success'. Por defecto 2200ms (false o 0 para desactivar). */
  autoCloseMs?: number | false;
}

const iconMap: Record<
  NotificationVariant,
  {
    icon: React.ReactNode;
    bg: string;
    ring: string;
    accentBar: string;
  }
> = {
  loading: {
    icon: <Loader2 className="h-10 w-10 text-indigo-600 animate-spin stroke-[2.2]" />,
    bg: 'bg-indigo-50',
    ring: 'ring-8 ring-indigo-50/60 border border-indigo-100',
    accentBar: 'bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 animate-pulse',
  },
  success: {
    icon: <CheckCircle2 className="h-11 w-11 text-emerald-600 stroke-[2.2]" />,
    bg: 'bg-emerald-50',
    ring: 'ring-8 ring-emerald-50/70 border border-emerald-100',
    accentBar: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
  },
  error: {
    icon: <XCircle className="h-11 w-11 text-rose-600 stroke-[2.2]" />,
    bg: 'bg-rose-50',
    ring: 'ring-8 ring-rose-50/70 border border-rose-100',
    accentBar: 'bg-gradient-to-r from-rose-500 to-red-600',
  },
  warning: {
    icon: <AlertTriangle className="h-10 w-10 text-amber-600 stroke-[2.2]" />,
    bg: 'bg-amber-50',
    ring: 'ring-8 ring-amber-50/70 border border-amber-100',
    accentBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
  },
  confirmation: {
    icon: <AlertTriangle className="h-10 w-10 text-amber-600 stroke-[2.2]" />,
    bg: 'bg-amber-50',
    ring: 'ring-8 ring-amber-50/70 border border-amber-100',
    accentBar: 'bg-gradient-to-r from-amber-400 to-rose-500',
  },
};

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  onConfirm,
  onCancel,
  show,
  autoCloseMs = 2200,
}) => {
  const handleDismiss = onConfirm || onCancel;

  useEffect(() => {
    if (!show || type !== 'success' || !autoCloseMs || !handleDismiss) return;

    const timer = window.setTimeout(() => {
      handleDismiss();
    }, autoCloseMs);

    return () => window.clearTimeout(timer);
  }, [show, type, autoCloseMs, handleDismiss]);

  if (!show) return null;

  const { icon, bg, ring, accentBar } = iconMap[type] || iconMap.success;

  return (
    <div
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-[2px] transition-opacity flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 transform transition-all max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Barra superior de estado (Loading / Success / Error / Warning) */}
        <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
          <div className={`h-full w-full ${accentBar} transition-all duration-300`} />
        </div>

        <div key={type} className="p-6 pt-7 text-center animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${bg} ${ring} transition-all duration-300`}
          >
            {icon}
          </div>
          <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100">
          {type === 'loading' ? (
            <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600/80 animate-pulse">
              <span>Procesando solicitud...</span>
            </div>
          ) : type === 'confirmation' ? (
            <div className="flex flex-col sm:flex-row-reverse gap-2.5 justify-center">
              <button
                onClick={onConfirm}
                type="button"
                className="w-full sm:flex-1 inline-flex justify-center rounded-xl border border-transparent shadow-xs px-4 py-2.5 bg-rose-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all cursor-pointer"
              >
                Sí, continuar
              </button>
              <button
                onClick={onCancel}
                type="button"
                className="w-full sm:flex-1 inline-flex justify-center rounded-xl border border-slate-200 shadow-2xs px-4 py-2.5 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleDismiss}
                type="button"
                className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-xs px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer ${
                  type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                    : type === 'error'
                      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                Aceptar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
