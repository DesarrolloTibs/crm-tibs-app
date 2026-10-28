import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { WhatsAppLogo } from '../../../../components/shared/ChannelIcons';
import Modal from '../../../../components/shared/Modal';
import Button from '../../../../components/shared/Button';
import WhatsAppBaseTemplateSettings from './WhatsAppBaseTemplateSettings';
import type { ChannelConfig } from '../../../../core/models/Conversation';
import {
  getMetaPublicConfig,
  connectWhatsAppEmbedded,
} from '../../../../services/conversationsService';
import { launchWhatsAppEmbeddedSignup } from '../../../../utils/facebookSdk';
import { showToast } from '../../../../utils/toast';

interface AiWhatsAppChannelModalProps {
  open: boolean;
  editingChannel: ChannelConfig | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  saving: boolean;
  onNotification: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
}

export const AiWhatsAppChannelModal: React.FC<AiWhatsAppChannelModalProps> = ({
  open,
  editingChannel,
  onClose,
  onSave,
  onNotification,
}) => {
  const [modalTab, setModalTab] = useState<'credentials' | 'base-template'>('credentials');
  const [connectingEmbedded, setConnectingEmbedded] = useState(false);

  useEffect(() => {
    if (open) {
      setModalTab('credentials');
      setConnectingEmbedded(false);
    }
  }, [open, editingChannel]);

  // Manejo de la Conexión Simple / 1 Clic con WhatsApp Embedded Signup
  const handleConnectEmbedded = async () => {
    try {
      setConnectingEmbedded(true);
      const metaConfig = await getMetaPublicConfig();

      if (!metaConfig?.appId || !metaConfig?.whatsappConfigId) {
        throw new Error('Falta configuración de Meta en el servidor (META_APP_ID o META_WHATSAPP_CONFIG_ID).');
      }

      launchWhatsAppEmbeddedSignup({
        appId: metaConfig.appId,
        configId: metaConfig.whatsappConfigId,
        onSuccess: async (metaData) => {
          try {
            showToast.info('Validando activos y suscribiendo webhooks con Meta...');
            const result = await connectWhatsAppEmbedded({
              code: metaData.code,
              wabaId: metaData.wabaId,
              phoneNumberId: metaData.phoneNumberId,
              name: editingChannel?.name || undefined,
            });

            showToast.success(result.message || '¡WhatsApp vinculado con éxito!');
            onNotification(
              'success',
              '¡WhatsApp Conectado!',
              `Se ha vinculado la línea ${result.verifiedName || result.channelConfig?.name || 'oficial'}.`
            );

            await onSave(result.channelConfig);
            onClose();
          } catch (backendErr: any) {
            const errorMsg =
              backendErr?.response?.data?.message ||
              backendErr?.message ||
              'Error vinculando la cuenta de WhatsApp en el servidor.';
            showToast.error(errorMsg);
            onNotification('error', 'Error al conectar WhatsApp', errorMsg);
          } finally {
            setConnectingEmbedded(false);
          }
        },
        onError: (err: any) => {
          setConnectingEmbedded(false);
          const errorMsg =
            err?.message ||
            err?.error?.message ||
            'No se pudo completar el inicio de sesión con Meta. Inténtalo de nuevo.';
          showToast.error(errorMsg);
        },
        onCancel: () => {
          setConnectingEmbedded(false);
          showToast.info('Registro en Meta cancelado.');
        },
      });
    } catch (err: any) {
      setConnectingEmbedded(false);
      showToast.error(err.message || 'Error iniciando flujo de Meta');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={editingChannel && modalTab === 'base-template' ? 'max-w-4xl' : 'max-w-lg'}
      height="h-auto max-h-[90vh]"
    >
      {/* Header */}
      <div className="pb-4 border-b border-slate-150 flex justify-between items-center pr-8 text-left">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <WhatsAppLogo size={18} className="text-emerald-600" />
            {editingChannel
              ? `Configuración WhatsApp: ${editingChannel.name}`
              : 'Conectar WhatsApp Cloud API'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {modalTab === 'base-template'
              ? 'Gestiona la plantilla oficial pre-aprobada para iniciar y reanudar conversaciones.'
              : 'Vincula tu cuenta de WhatsApp en 1 Clic con el diálogo oficial de Meta.'}
          </p>
        </div>
      </div>

      {/* Switcher de pestañas cuando se edita */}
      {editingChannel && (
        <div className="flex gap-2 border-b border-slate-150 pt-3 pb-2 text-left">
          <button
            type="button"
            onClick={() => setModalTab('credentials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modalTab === 'credentials'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Conexión & Cuenta
          </button>
          <button
            type="button"
            onClick={() => setModalTab('base-template')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'base-template'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Plantilla Base de Inicio
          </button>
        </div>
      )}

      {editingChannel && modalTab === 'base-template' ? (
        <div className="mt-4">
          <WhatsAppBaseTemplateSettings
            channelConfig={editingChannel}
            onNotification={onNotification}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4 text-left">
          {/* CONEXIÓN RÁPIDA 1 CLIC */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/80 rounded-2xl p-5 shadow-xs text-left relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                  <Sparkles size={11} className="text-emerald-600" />
                  Conexión Simple Oficial
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm mt-1">
                  {editingChannel ? 'Reconectar o Actualizar con Meta' : 'Conectar con Meta WhatsApp'}
                </h4>
              </div>
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <WhatsAppLogo size={26} />
              </div>
            </div>

            {/* Si ya está conectado, mostrar resumen */}
            {editingChannel && (
              <div className="mt-4 bg-white/90 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 size={14} />
                  <span>Cuenta Actualmente Vinculada:</span>
                </div>
                <div className="text-[11px] text-slate-700 pl-5">
                  <p><strong>Nombre:</strong> {editingChannel.name || 'Sin nombre'}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    <strong>Phone Number ID:</strong> {editingChannel.phoneNumberId || 'No configurado'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5">
              <button
                type="button"
                onClick={handleConnectEmbedded}
                disabled={connectingEmbedded}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {connectingEmbedded ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Conectando con Meta WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppLogo size={16} />
                    <span>{editingChannel ? 'Reconectar con WhatsApp' : 'Conectar con WhatsApp'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 text-xs font-bold">
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
