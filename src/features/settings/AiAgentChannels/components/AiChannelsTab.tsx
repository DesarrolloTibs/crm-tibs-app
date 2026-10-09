import React from 'react';
import {
  MessageSquare,
  Smartphone,
  Facebook,
  Instagram,
  RefreshCw,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import Button from '@shared/components/Button';
import type { ChannelConfig } from '@core/models/Conversation';

interface AiChannelsTabProps {
  channelConfigs: ChannelConfig[];
  isLoadingChannels: boolean;
  connectingMetaChannel: 'facebook' | 'instagram' | null;
  onRefreshChannels: () => Promise<void>;
  onOpenWhatsAppModal: (config?: ChannelConfig) => void;
  onConnectMeta: (channel: 'facebook' | 'instagram') => Promise<void>;
  onDeleteChannel: (id: string) => void;
}

export const AiChannelsTab: React.FC<AiChannelsTabProps> = ({
  channelConfigs,
  isLoadingChannels,
  connectingMetaChannel,
  onRefreshChannels,
  onOpenWhatsAppModal,
  onConnectMeta,
  onDeleteChannel,
}) => {
  const whatsappConfig = channelConfigs.find((c) => c.channel === 'whatsapp');
  const facebookConfig = channelConfigs.find((c) => c.channel === 'facebook');
  const instagramConfig = channelConfigs.find((c) => c.channel === 'instagram');

  return (
    <div className="space-y-6 text-left w-full animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        {/* Cabecera y botón de sincronización Meta */}
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={20} />
              Canales de Comunicación (Meta Graph APIs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conecta tus cuentas de WhatsApp Cloud API, Facebook Messenger e Instagram Business para recibir chats y responder desde el CRM.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshChannels}
            disabled={isLoadingChannels}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Sincronizar canales con Meta Graph API en tiempo real"
          >
            <RefreshCw size={13} className={isLoadingChannels ? 'animate-spin text-indigo-600' : ''} />
            <span>{isLoadingChannels ? 'Sincronizando...' : 'Sincronizar Meta'}</span>
          </button>
        </div>

        {/* Tarjetas Comerciales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. WHATSAPP CLOUD API */}
          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow bg-white">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold border border-emerald-100">
                <Smartphone size={24} />
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
                <Facebook size={24} />
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
                <Instagram size={24} />
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
        </div>
      </div>
    </div>
  );
};
