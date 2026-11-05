import React, { useState } from 'react';
import {
  MessageSquare,
  RefreshCw,
  CheckCircle,
  PauseCircle,
  Copy,
  Check,
  Code,
  Trash2,
} from 'lucide-react';
import {
  WhatsAppLogo,
  FacebookLogo,
  InstagramLogo,
  WebchatLogo,
} from '@shared/components/ChannelIcons';
import Button from '@shared/components/Button';
import { showToast } from '@shared/utils/toast';
import type { ChannelConfig } from '@core/models/Conversation';

interface AiChannelsTabProps {
  channelConfigs: ChannelConfig[];
  isLoadingChannels: boolean;
  connectingMetaChannel: 'facebook' | 'instagram' | null;
  onRefreshChannels: () => Promise<void>;
  onOpenWhatsAppModal: (config?: ChannelConfig) => void;
  onConnectMeta: (channel: 'facebook' | 'instagram') => Promise<void>;
  onDeleteChannel: (id: string) => void;
  onToggleWebchatStatus?: (config: ChannelConfig) => Promise<void>;
  onCreateWebchatChannel?: () => Promise<void>;
}

export const AiChannelsTab: React.FC<AiChannelsTabProps> = ({
  channelConfigs,
  isLoadingChannels,
  connectingMetaChannel,
  onRefreshChannels,
  onOpenWhatsAppModal,
  onConnectMeta,
  onDeleteChannel,
  onToggleWebchatStatus,
  onCreateWebchatChannel,
}) => {
  const whatsappConfig = channelConfigs.find((c) => c.channel === 'whatsapp');
  const facebookConfig = channelConfigs.find((c) => c.channel === 'facebook');
  const instagramConfig = channelConfigs.find((c) => c.channel === 'instagram');
  const webchatConfig = channelConfigs.find((c) => c.channel === 'webchat');

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const getWidgetScriptUrl = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${baseUrl}/widget.js`;
  };

  const getEmbedSnippet = (tenantKey: string) => {
    return `<script src="${getWidgetScriptUrl()}" data-tenant-key="${tenantKey}" defer></script>`;
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(true);
      showToast.success('Clave del widget (tenantKey) copiada al portapapeles.');
      setTimeout(() => setCopiedKey(false), 2000);
    });
  };

  const handleCopySnippet = (key: string) => {
    const snippet = getEmbedSnippet(key);
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedSnippet(true);
      showToast.success('Código embebible copiado al portapapeles.');
      setTimeout(() => setCopiedSnippet(false), 2000);
    });
  };

  return (
    <div className="space-y-6 text-left w-full animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        {/* Cabecera y botón de sincronización */}
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={20} />
              Canales de Comunicación Omnicanal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conecta tus cuentas de WhatsApp Cloud API, Facebook Messenger, Instagram Business o el Widget Webchat externo para interactuar con prospectos.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshChannels}
            disabled={isLoadingChannels}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Sincronizar canales en tiempo real"
          >
            <RefreshCw size={13} className={isLoadingChannels ? 'animate-spin text-indigo-600' : ''} />
            <span>{isLoadingChannels ? 'Sincronizando...' : 'Sincronizar Canales'}</span>
          </button>
        </div>

        {/* Tarjetas Comerciales: 4 Columnas Responsivas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* 1. WHATSAPP CLOUD API */}
          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow bg-white">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold border border-emerald-100">
                <WhatsAppLogo size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  WhatsApp Cloud API
                  {isLoadingChannels ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 animate-pulse">
                      <RefreshCw size={9} className="animate-spin" /> Verificando...
                    </span>
                  ) : whatsappConfig ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      <CheckCircle size={10} /> Conectado
                    </span>
                  ) : null}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Conecta tu cuenta oficial de WhatsApp Cloud API para responder a prospectos y gestionar plantillas de inicio.
                </p>
              </div>

              {isLoadingChannels ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="h-2.5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-slate-300 rounded w-2/3"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : whatsappConfig ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-2 font-medium">
                  <div>
                    <strong className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                      CUENTA OFICIAL VERIFICADA
                    </strong>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {whatsappConfig.metaDetails?.profile_picture_url && (
                        <img
                          src={whatsappConfig.metaDetails.profile_picture_url}
                          alt="WhatsApp Avatar"
                          className="w-5 h-5 rounded-full object-cover border border-emerald-200 shrink-0"
                        />
                      )}
                      <span className="font-bold text-slate-800 text-xs truncate">
                        {whatsappConfig.waVerifiedName || whatsappConfig.name || 'Sin nombre registrado'}
                      </span>
                      {whatsappConfig.waVerifiedName && (
                        <span title="Nombre verificado por Meta" className="inline-flex text-emerald-600 shrink-0">
                          <CheckCircle size={12} />
                        </span>
                      )}
                    </div>
                    {(whatsappConfig.phoneNumberId || whatsappConfig.metaDetails?.display_phone_number) && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {whatsappConfig.metaDetails?.display_phone_number || whatsappConfig.phoneNumberId}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={whatsappConfig ? 'secondary' : 'primary'}
                disabled={isLoadingChannels}
                className="flex-grow text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                onClick={() => onOpenWhatsAppModal(whatsappConfig)}
              >
                {isLoadingChannels ? 'Cargando...' : whatsappConfig ? 'Configurar / Editar' : 'Link Account'}
              </Button>
              {whatsappConfig && !isLoadingChannels && (
                <button
                  type="button"
                  onClick={() => onDeleteChannel(whatsappConfig.id)}
                  className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Desconectar cuenta"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 2. FACEBOOK MESSENGER */}
          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow bg-white">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold border border-blue-100">
                <FacebookLogo size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  Facebook Messenger
                  {isLoadingChannels ? (
                    <span className="flex items-center gap-1 text-[10px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 animate-pulse">
                      <RefreshCw size={9} className="animate-spin" /> Verificando...
                    </span>
                  ) : facebookConfig ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      <CheckCircle size={10} /> Conectado
                    </span>
                  ) : null}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Vincula tu Fan Page de Facebook para atender los chats de Messenger desde la bandeja unificada.
                </p>
              </div>

              {isLoadingChannels ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="h-2.5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-slate-300 rounded w-2/3"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : facebookConfig ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5 font-medium">
                  <div>
                    <strong className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                      FAN PAGE CONECTADA
                    </strong>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {facebookConfig.metaDetails?.profile_picture_url && (
                        <img
                          src={facebookConfig.metaDetails.profile_picture_url}
                          alt="Facebook Avatar"
                          className="w-5 h-5 rounded-full object-cover border border-blue-200 shrink-0"
                        />
                      )}
                      <span className="font-bold text-slate-800 text-xs truncate">
                        {facebookConfig.fbPageName || facebookConfig.name || 'Fan Page no detectada'}
                      </span>
                    </div>
                    {facebookConfig.accountId && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {facebookConfig.accountId}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-5 flex gap-2">
              <Button
                type="button"
                variant={facebookConfig ? 'secondary' : 'primary'}
                disabled={isLoadingChannels || connectingMetaChannel !== null}
                loading={connectingMetaChannel === 'facebook'}
                className="w-full text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                onClick={() => onConnectMeta('facebook')}
              >
                {isLoadingChannels
                  ? 'Cargando...'
                  : facebookConfig
                  ? 'Reconectar con Meta'
                  : 'Conectar con Meta'}
              </Button>
              {facebookConfig && !isLoadingChannels && (
                <button
                  type="button"
                  onClick={() => onDeleteChannel(facebookConfig.id)}
                  className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Desconectar página"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 3. INSTAGRAM DIRECT */}
          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow bg-white">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center font-bold border border-pink-100">
                <InstagramLogo size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  Instagram Direct
                  {isLoadingChannels ? (
                    <span className="flex items-center gap-1 text-[10px] text-pink-700 font-medium bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100 animate-pulse">
                      <RefreshCw size={9} className="animate-spin" /> Verificando...
                    </span>
                  ) : instagramConfig ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      <CheckCircle size={10} /> Conectado
                    </span>
                  ) : null}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Administra los mensajes directos de tu cuenta Instagram Business con automatización inteligente.
                </p>
              </div>

              {isLoadingChannels ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="h-2.5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-slate-300 rounded w-2/3"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : instagramConfig ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5 font-medium">
                  <div>
                    <strong className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                      CUENTA INSTAGRAM BUSINESS
                    </strong>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {instagramConfig.metaDetails?.profile_picture_url && (
                        <img
                          src={instagramConfig.metaDetails.profile_picture_url}
                          alt="Instagram Avatar"
                          className="w-5 h-5 rounded-full object-cover border border-pink-200 shrink-0"
                        />
                      )}
                      <span className="font-bold text-slate-800 text-xs text-pink-700 truncate">
                        {instagramConfig.metaProfileName ||
                          (instagramConfig.igUsername ? `@${instagramConfig.igUsername}` : instagramConfig.name)}
                      </span>
                    </div>
                    {instagramConfig.accountId && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {instagramConfig.accountId}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-5 flex gap-2">
              <Button
                type="button"
                variant={instagramConfig ? 'secondary' : 'primary'}
                disabled={isLoadingChannels || connectingMetaChannel !== null}
                loading={connectingMetaChannel === 'instagram'}
                className="w-full text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                onClick={() => onConnectMeta('instagram')}
              >
                {isLoadingChannels
                  ? 'Cargando...'
                  : instagramConfig
                  ? 'Reconectar con Meta'
                  : 'Conectar con Meta'}
              </Button>
              {instagramConfig && !isLoadingChannels && (
                <button
                  type="button"
                  onClick={() => onDeleteChannel(instagramConfig.id)}
                  className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Desconectar cuenta"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 4. WEBCHAT EXTERNO (WIDGET WEB) */}
          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow bg-white">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold border border-purple-100">
                <WebchatLogo size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  WebChat Widget
                  {isLoadingChannels ? (
                    <span className="flex items-center gap-1 text-[10px] text-purple-700 font-medium bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 animate-pulse">
                      <RefreshCw size={9} className="animate-spin" /> Verificando...
                    </span>
                  ) : webchatConfig ? (
                    webchatConfig.isActive ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        <CheckCircle size={10} /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        <PauseCircle size={10} /> En Pausa
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      No instalado
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Incrusta un widget de chat en vivo en tu sitio web corporativo o tienda para captar prospectos y responder con IA o asesores.
                </p>
              </div>

              {isLoadingChannels ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="h-2.5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-slate-300 rounded w-2/3"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : webchatConfig ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-2.5 font-medium">
                  {/* Clave de Integración */}
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                        CLAVE PÚBLICA (TENANT KEY)
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(webchatConfig.id)}
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copiar Tenant Key"
                      >
                        {copiedKey ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{copiedKey ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-700 font-mono bg-white border border-slate-200 rounded-lg px-2 py-1 mt-1 truncate select-all" title={webchatConfig.id}>
                      {webchatConfig.id}
                    </div>
                  </div>

                  {/* Snippet HTML */}
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                        CÓDIGO DE INSERCIÓN WEB
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(webchatConfig.id)}
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copiar Script HTML"
                      >
                        {copiedSnippet ? <Check size={11} className="text-emerald-600" /> : <Code size={11} />}
                        <span>{copiedSnippet ? 'Copiado' : 'Copiar script'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      Pega la etiqueta antes del cierre de <code className="text-purple-700 bg-purple-50 px-1 rounded">&lt;/body&gt;</code> en tu web externa.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 font-medium">
                  Habilita este canal para generar la clave de integración única de tu empresa y recibir chats externos.
                </div>
              )}
            </div>

            <div className="pt-5 flex gap-2">
              {webchatConfig ? (
                <>
                  <Button
                    type="button"
                    variant={webchatConfig.isActive ? 'secondary' : 'primary'}
                    disabled={isLoadingChannels}
                    className="flex-grow text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                    onClick={() => onToggleWebchatStatus?.(webchatConfig)}
                  >
                    {isLoadingChannels
                      ? 'Cargando...'
                      : webchatConfig.isActive
                      ? 'Pausar Widget'
                      : 'Activar Widget'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => onDeleteChannel(webchatConfig.id)}
                    className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar canal"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  disabled={isLoadingChannels}
                  className="w-full text-xs py-2 font-bold cursor-pointer disabled:opacity-60"
                  onClick={() => onCreateWebchatChannel?.()}
                >
                  {isLoadingChannels ? 'Cargando...' : 'Habilitar WebChat'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
