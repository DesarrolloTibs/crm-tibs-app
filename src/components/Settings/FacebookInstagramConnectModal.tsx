import React, { useState, useEffect, useRef } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { showToast } from '../../utils/toast';
import { getFacebookAuthUrl } from '../../services/conversationsService';
import { Facebook, Instagram, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export interface FacebookInstagramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelConnected: () => void;
  channel?: 'facebook' | 'instagram';
}

export const FacebookInstagramConnectModal: React.FC<FacebookInstagramConnectModalProps> = ({
  isOpen,
  onClose,
  onChannelConnected,
  channel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);

  const cleanupListeners = () => {
    if (listenerRef.current) {
      window.removeEventListener('message', listenerRef.current);
      listenerRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupListeners();
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    cleanupListeners();

    try {
      const response = await getFacebookAuthUrl(channel);
      const authUrl = response?.authUrl || (response as any)?.data?.authUrl;

      if (!authUrl) {
        throw new Error('No se recibió la URL de autenticación de Meta.');
      }

      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'meta-oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsLoading(false);
        showToast.error('La ventana emergente fue bloqueada por tu navegador. Permite las ventanas emergentes e intenta de nuevo.');
        return;
      }

      popupRef.current = popup;

      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === 'META_OAUTH_SUCCESS') {
          cleanupListeners();
          showToast.success(event.data.payload?.message || (channel ? `¡Canal ${channel === 'facebook' ? 'Facebook' : 'Instagram'} conectado con éxito!` : '¡Página de Facebook e Instagram conectadas con éxito!'));
          setIsLoading(false);
          onChannelConnected();
          onClose();
        } else if (event.data?.type === 'META_OAUTH_ERROR') {
          cleanupListeners();
          showToast.error(event.data.payload?.message || 'Error al conectar con Meta.');
          setIsLoading(false);
        }
      };

      listenerRef.current = messageListener;
      window.addEventListener('message', messageListener);

      pollIntervalRef.current = setInterval(() => {
        if (popup.closed) {
          cleanupListeners();
          setIsLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      cleanupListeners();
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || err.message || 'No se pudo iniciar la conexión con Meta.';
      showToast.error(errorMsg);
    }
  };

  const handleModalClose = () => {
    if (isLoading) {
      cleanupListeners();
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      setIsLoading(false);
    }
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleModalClose}
      maxWidth="max-w-md"
      height="h-auto"
      className="p-1"
    >
      <div className="flex flex-col items-center text-center p-6 sm:p-8 space-y-5">
        {/* Meta Brand Header Icons */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/10 transition-transform hover:scale-105">
            <Facebook size={30} />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shadow-sm shadow-pink-500/10 transition-transform hover:scale-105">
            <Instagram size={30} />
          </div>
        </div>

        {/* Title and Intro */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold tracking-wide uppercase">
            <Sparkles size={12} className="text-blue-500" />
            Meta OAuth2 Oficial
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            Conectar Facebook e Instagram
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Vincula tus páginas de Facebook y cuentas comerciales de Instagram con un solo clic. Recibe, responde y gestiona conversaciones en tiempo real directamente desde el CRM.
          </p>
        </div>

        {/* Features / Benefits list */}
        <div className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Sincronización automática de Páginas y Cuentas Business de Instagram</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Webhooks y permisos de mensajería configurados de forma desatendida</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Automatización y derivación de chats con tu Agente IA</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full pt-2 flex flex-col items-center gap-3">
          <Button
            onClick={handleConnect}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            className="w-full py-4 text-xs font-black shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            <Facebook size={16} />
            <span>Conectar con Facebook e Instagram</span>
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck size={13} className="text-slate-400" />
            <span>Conexión segura y oficial protegida por Meta</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FacebookInstagramConnectModal;
