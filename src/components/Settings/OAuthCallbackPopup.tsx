import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const OAuthCallbackPopup: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const metaOauth = params.get('meta_oauth');
  const isError = Boolean(
    metaOauth === 'error' ||
    params.get('error') ||
    params.get('oauth') === 'error' ||
    params.get('status') === 'error'
  );
  const errorMessage = params.get('error_description') || params.get('message') || 'Error al conectar con Meta.';
  const successMessage = params.get('message') || '¡Canal conectado con éxito!';

  useEffect(() => {
    const payload = {
      type: isError ? 'META_OAUTH_ERROR' : 'META_OAUTH_SUCCESS',
      payload: { message: isError ? errorMessage : successMessage },
    };

    // 1. Notificar vía window.opener
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(payload, '*');
      }
    } catch (err) {
      console.warn('window.opener postMessage:', err);
    }

    // 2. Notificar vía BroadcastChannel (funciona en Brave aunque opener sea nulo)
    try {
      const bc = new BroadcastChannel('meta_oauth_channel');
      bc.postMessage(payload);
      setTimeout(() => bc.close(), 1000);
    } catch (err) {
      console.warn('BroadcastChannel:', err);
    }

    // 3. Notificar vía localStorage event
    try {
      localStorage.setItem('meta_oauth_result', JSON.stringify({
        ...payload,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.warn('localStorage:', err);
    }

    // Intentar cerrar la ventana emergente de inmediato
    window.close();

    // Intentos adicionales de cierre
    const timer1 = setTimeout(() => window.close(), 200);
    const timer2 = setTimeout(() => window.close(), 600);

    // Fallback si la ventana no se puede cerrar (ej: abierta en pestaña principal)
    const timerRedirect = setTimeout(() => {
      window.location.href = `/settings?tab=channels&meta_oauth=${isError ? 'error' : 'success'}`;
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timerRedirect);
    };
  }, [isError, errorMessage, successMessage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full space-y-4">
        {isError ? (
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
        ) : (
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
        )}

        <div>
          <h2 className="text-base font-bold text-gray-800">
            {isError ? 'Error en la conexión' : '¡Conexión Exitosa!'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isError ? errorMessage : 'Tu cuenta ha sido vinculada correctamente. Cerrando ventana...'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.close()}
          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          Cerrar esta ventana
        </button>
      </div>
    </div>
  );
};

export default OAuthCallbackPopup;
