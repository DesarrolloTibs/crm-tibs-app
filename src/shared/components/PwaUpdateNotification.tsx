import React, { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

export const PwaUpdateNotification: React.FC = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      registrationRef.current = registration;
    },
    onRegisterError(error) {
      console.error('[PWA] Error al registrar el Service Worker:', error);
    },
  });

  // 1. Chequeo periódico y proactivo de nuevas versiones en el servidor
  useEffect(() => {
    const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // cada 30 minutos

    const checkForUpdates = async () => {
      if (typeof window === 'undefined' || !navigator.onLine) return;
      try {
        const reg = registrationRef.current || (await navigator.serviceWorker?.getRegistration());
        if (reg) {
          await reg.update();
        }
      } catch (err) {
        // Fallos de red transitorios se ignoran de forma defensiva
        console.warn('[PWA] Verificación silenciosa de actualización no completada:', err);
      }
    };

    const interval = setInterval(checkForUpdates, UPDATE_INTERVAL_MS);

    const handleFocusOrResume = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleFocusOrResume);
    window.addEventListener('focus', handleFocusOrResume);

    // 2. Sincronización multi-pestaña: si otra pestaña ya actualizó el SW, sincronizar esta pestaña
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocusOrResume);
      window.removeEventListener('focus', handleFocusOrResume);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Soporte para pruebas visuales mediante ?testPwa=true o &testPwa=true
  const isPreviewMode = typeof window !== 'undefined' &&
    (window.location.href.includes('testPwa=true') ||
     new URLSearchParams(window.location.search).get('testPwa') === 'true');

  const shouldShow = !dismissed && (needRefresh || isPreviewMode);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setDismissed(true);
      setNeedRefresh(false);

      if (isPreviewMode && !needRefresh) {
        const cleanUrl = window.location.href
          .replace(/[?&]testPwa=true/g, '')
          .replace(/\?testPwa=true/g, '');
        window.location.href = cleanUrl;
        return;
      }

      // Notificar directamente al worker en espera si existe
      const reg = registrationRef.current || (await navigator.serviceWorker?.getRegistration());
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      await updateServiceWorker(true);

      // Forzar recarga tras breve retroalimentación visual
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (err) {
      console.error('[PWA] Error al forzar actualización del Service Worker:', err);
      setIsUpdating(false);
      window.location.reload();
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      role="region"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-24 sm:bottom-6 z-[99999] sm:w-[480px] pointer-events-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-center gap-4 sm:gap-5">
          <img
            src="/billy.png"
            alt="Billy Sales & Services"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 filter drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
          />

          <div className="flex-1 min-w-0">
            <Badge variant="indigo" size="sm" dot className="mb-2">
              Actualización del sistema
            </Badge>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Nueva versión disponible
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Hay mejoras y nuevas funciones listas en Billy Sales & Services. Actualiza para aplicar los cambios al instante.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button
            variant="primary"
            loading={isUpdating}
            onClick={handleUpdate}
            className="w-full py-3 normal-case tracking-normal text-sm font-semibold gap-2 shadow-lg shadow-blue-500/25"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            Actualizar ahora
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PwaUpdateNotification;
