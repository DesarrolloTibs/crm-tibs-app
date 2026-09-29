import React, { useState, useEffect } from 'react';
import { Smartphone, Link2 } from 'lucide-react';
import Modal from '../../../../components/shared/Modal';
import Button from '../../../../components/shared/Button';
import Input from '../../../../components/shared/Input';
import { useFormValidation } from '../../../../components/shared/useFormValidation';
import WhatsAppBaseTemplateSettings from './WhatsAppBaseTemplateSettings';
import type { ChannelConfig } from '../../../../core/models/Conversation';
import {
  whatsappChannelValidationSchema,
  type WhatsAppChannelFormData,
} from '../schemas/aiAgent.schema';

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
  saving,
  onNotification,
}) => {
  const [modalTab, setModalTab] = useState<'credentials' | 'base-template'>('credentials');
  const [channelName, setChannelName] = useState('');
  const [appId, setAppId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  const { errors, setError, clearErrors } = useFormValidation<WhatsAppChannelFormData>();

  useEffect(() => {
    if (open) {
      setModalTab('credentials');
      if (editingChannel) {
        setChannelName(editingChannel.name || '');
        setAppId(editingChannel.appId || '');
        setAccountId(editingChannel.accountId || '');
        setPhoneNumberId(editingChannel.phoneNumberId || '');
        setAccessToken(editingChannel.accessToken || '');
        setVerifyToken(editingChannel.verifyToken || '');
      } else {
        setChannelName('');
        setAppId('');
        setAccountId('');
        setPhoneNumberId('');
        setAccessToken('');
        setVerifyToken('');
      }
      clearErrors();
    }
  }, [open, editingChannel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const candidateData: WhatsAppChannelFormData = {
      channelName: channelName.trim(),
      appId: appId.trim() || null,
      accountId: accountId.trim(),
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
      verifyToken: verifyToken.trim(),
    };

    try {
      await whatsappChannelValidationSchema.validate(candidateData, { abortEarly: false });

      await onSave({
        id: editingChannel?.id || undefined,
        channel: 'whatsapp',
        name: candidateData.channelName,
        appId: candidateData.appId || null,
        accountId: candidateData.accountId,
        phoneNumberId: candidateData.phoneNumberId,
        accessToken: candidateData.accessToken,
        verifyToken: candidateData.verifyToken,
        isActive: editingChannel ? editingChannel.isActive : true,
      });
    } catch (err: any) {
      if (err.inner) {
        err.inner.forEach((validationError: any) => {
          if (validationError.path) {
            setError(validationError.path as keyof WhatsAppChannelFormData, validationError.message);
          }
        });
      }
    }
  };

  const callbackUrl = `${import.meta.env.VITE_BASE_URL || 'http://localhost:3091'}/api/conversations/webhook/whatsapp`;

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
            <Smartphone size={18} className="text-emerald-600" />
            {editingChannel
              ? `Configuración WhatsApp: ${channelName || editingChannel.name}`
              : 'Conectar WhatsApp Cloud API'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {modalTab === 'base-template'
              ? 'Gestiona la plantilla oficial pre-aprobada para iniciar y reanudar conversaciones.'
              : 'Rellena los parámetros requeridos obtenidos de Meta for Developers para WhatsApp.'}
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
            Credenciales & Webhook
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
          <div>
            <Input
              label="Nombre descriptivo de la Cuenta (Ej: WhatsApp Ventas)"
              id="channelName"
              type="text"
              value={channelName}
              onChange={(e: any) => setChannelName(e.target.value)}
              placeholder="Ej: WhatsApp Principal"
              required
            />
            {errors.channelName && (
              <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.channelName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="App ID de Meta"
                id="appId"
                type="text"
                value={appId}
                onChange={(e: any) => setAppId(e.target.value)}
                placeholder="Ej: 1234567890"
              />
            </div>
            <div>
              <Input
                label="WhatsApp Business Account ID"
                id="accountId"
                type="text"
                value={accountId}
                onChange={(e: any) => setAccountId(e.target.value)}
                placeholder="Ej: 1234567890"
                required
              />
              {errors.accountId && (
                <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.accountId}</p>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Phone Number ID (WhatsApp Cloud API)"
              id="phoneNumberId"
              type="text"
              value={phoneNumberId}
              onChange={(e: any) => setPhoneNumberId(e.target.value)}
              placeholder="Ej: 1234123455"
              required
            />
            {errors.phoneNumberId && (
              <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.phoneNumberId}</p>
            )}
          </div>

          <div>
            <Input
              label="Token de Acceso Permanente (System User Token)"
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Ingrese el Token permanente generado de Meta"
              required
            />
            {errors.accessToken && (
              <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.accessToken}</p>
            )}
          </div>

          <div>
            <Input
              label="Token de Verificación del Webhook (Verify Token)"
              id="verifyToken"
              type="text"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="Código secreto para Meta (ej: mi_webhook_seguro_99)"
              required
            />
            {errors.verifyToken && (
              <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.verifyToken}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">
              Coloca este mismo token en el portal de desarrolladores de Meta en la configuración del Webhook.
            </p>
          </div>

          {/* Guía Visual Webhook */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 space-y-2 text-xs">
            <h4 className="font-extrabold text-sky-900 flex items-center gap-1.5">
              <Link2 size={14} className="text-sky-600" />
              Configuración del Webhook en Meta
            </h4>
            <p className="text-[11px] text-sky-800/80 leading-relaxed">
              Copia estos valores y pégalos en la sección de Webhooks de WhatsApp en Meta for Developers:
            </p>
            <div className="space-y-2 pt-1">
              <div>
                <span className="block text-[9px] font-bold text-sky-700/80 uppercase tracking-wider mb-1">
                  Callback URL
                </span>
                <div className="flex items-center bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-slate-700 break-all select-all font-semibold">
                  {callbackUrl}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-sky-700/80 uppercase tracking-wider mb-1">
                  Verify Token
                </span>
                <div className="flex items-center bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-slate-700 select-all font-semibold">
                  {verifyToken || 'Escribe el Verify Token arriba...'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-150 pt-4 mt-6">
            <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 text-xs font-bold">
              Cancelar
            </Button>
            <Button type="submit" variant="success" loading={saving} className="px-4 py-2 text-xs font-bold">
              Guardar Configuración
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
