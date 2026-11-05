import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import Loader from './Loader';
import { showToast } from '@shared/utils/toast';

export type NotificationVariant = 'loading' | 'success' | 'error' | 'warning' | 'confirmation';

export interface NotificationProps {
  type: NotificationVariant;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  show: boolean;
  /** Conservado por compatibilidad de interfaz */
  autoCloseMs?: number | false;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  onConfirm,
  onCancel,
  show,
}) => {
  const dismissRef = useRef<(() => void) | undefined>(onConfirm || onCancel);
  dismissRef.current = onConfirm || onCancel;

  const isToastVariant = type === 'success' || type === 'error' || type === 'warning';

  useEffect(() => {
    if (!show || !isToastVariant) return;

    showToast[type](message, title);
    dismissRef.current?.();
  }, [show, isToastVariant, type, title, message]);

  if (!show || isToastVariant) return null;

  // Estado 'loading': únicamente el loader centrado sobre el backdrop, sin caja modal
  if (type === 'loading') {
    return (
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px] transition-opacity flex items-center justify-center z-[100] animate-in fade-in duration-150"
        role="status"
        aria-live="polite"
        aria-label="Cargando..."
      >
        <Loader className="h-auto" size="lg" />
      </div>
    );
  }

  // Estado 'confirmation': diálogo modal interactivo de confirmación
  return (
    <div
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-[2px] transition-opacity flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 transform transition-all max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300" />
        </div>

        <div className="p-6 pt-7 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-50 ring-8 ring-amber-50/70 border border-amber-100 transition-all duration-300">
            <AlertTriangle className="h-10 w-10 text-amber-600 stroke-[2.2]" />
          </div>
          <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100">
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
        </div>
      </div>
    </div>
  );
};

export default Notification;
