import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Bot,
  AlertTriangle,
  Zap,
  Sparkles,
  CheckCircle2,
  CheckCheck,
  User,
} from 'lucide-react';
import type {
  Conversation,
  WhatsAppBaseTemplate,
  Message,
  SendTemplatePayload,
} from '../../core/models/Conversation';
import {
  getConversationBaseTemplate,
  getWhatsAppTemplates,
  sendWhatsAppTemplate,
} from '../../services/conversationsService';
import Badge from '../shared/Badge';
import Loader from '../shared/Loader';
import Button from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';

interface MessageInputBarProps {
  botActive: boolean;
  inputText: string;
  sending: boolean;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isWhatsAppWindowClosed?: boolean;
  conversation?: Conversation | null;
  onTemplateSent?: (msg: Message) => void;
  onShowNotification?: (type: 'success' | 'error' | 'warning' | 'confirmation', title: string, message: string) => void;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({
  botActive,
  inputText,
  sending,
  onInputChange,
  onSubmit,
  isWhatsAppWindowClosed = false,
  conversation,
  onTemplateSent,
  onShowNotification,
}) => {
  const [baseTemplate, setBaseTemplate] = useState<WhatsAppBaseTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Pre-load base template when conversation is WhatsApp and window is closed
  useEffect(() => {
    if (!conversation?.id || conversation.channel !== 'whatsapp') {
      setBaseTemplate(null);
      return;
    }

    let isMounted = true;
    setLoadingTemplate(true);
    // Priorizar endpoint de plantilla base de la conversación (trae variables de contacto resueltas)
    getConversationBaseTemplate(conversation.id)
      .then((data) => {
        if (isMounted && data) {
          setBaseTemplate(data);
        }
      })
      .catch(() => {
        return getWhatsAppTemplates(conversation.id).then((templates) => {
          if (!isMounted) return;
          if (templates && templates.length > 0) {
            const tpl = templates[0];
            const headerComp = tpl.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER');
            const bodyComp = tpl.components?.find((c: any) => c.type?.toUpperCase() === 'BODY');
            const footerComp = tpl.components?.find((c: any) => c.type?.toUpperCase() === 'FOOTER');
            setBaseTemplate({
              id: tpl.id,
              channelConfigId: null,
              templateId: tpl.id,
              name: tpl.name || 'crm_inicio_conversacion',
              category: (tpl.category as any) || 'UTILITY',
              language: tpl.language || 'es',
              bodyText: bodyComp?.text || 'Hola {{1}}',
              headerText: headerComp?.text || null,
              footerText: footerComp?.text || null,
              components: tpl.components,
              status: (tpl.status as any) || 'APPROVED',
              isBase: true,
            });
          }
        });
      })
      .catch((err) => {
        console.warn('No se pudo precargar la plantilla base para preview:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingTemplate(false);
      });

    return () => {
      isMounted = false;
    };
  }, [conversation?.id, conversation?.channel]);

  const { user } = useAuth();

  const clientName =
    baseTemplate?.resolvedVariables?.[1] ||
    baseTemplate?.contact?.name ||
    conversation?.clientName?.trim() ||
    'Cliente';

  // Variable {{2}}: Nombre de la empresa asociada al contacto (no el tenant)
  const companyName =
    baseTemplate?.resolvedVariables?.[2] ||
    baseTemplate?.contact?.company ||
    conversation?.client?.company?.nombre ||
    conversation?.client?.empresa ||
    '';

  // Variable {{3}}: Asesor asignado
  const agentName =
    baseTemplate?.resolvedVariables?.[3] ||
    baseTemplate?.contact?.agent ||
    conversation?.assignedUser?.username ||
    user?.username ||
    'Asesor';

  // Extract header and footer
  const headerText = useMemo(() => {
    return (
      baseTemplate?.headerText ||
      baseTemplate?.components?.find((c: any) => c.type === 'HEADER')?.text ||
      null
    );
  }, [baseTemplate]);

  const footerText = useMemo(() => {
    return (
      baseTemplate?.footerText ||
      baseTemplate?.components?.find((c: any) => c.type === 'FOOTER')?.text ||
      null
    );
  }, [baseTemplate]);

  // Pre-render body substituting {{1}}, {{2}}, {{3}} with highlighted chips
  const previewBody = useMemo(() => {
    const rawBody: string =
      baseTemplate?.bodyText ||
      baseTemplate?.components?.find((c: any) => c.type === 'BODY')?.text ||
      'Hola {{1}}, te saluda {{3}} de {{2}}. Me comunico contigo para dar seguimiento y revisar lo siguiente:';

    const parts: string[] = rawBody.split(/(\{\{\d+\}\})/);

    return parts.map((part: string, index: number) => {
      if (part === '{{1}}') {
        return (
          <strong
            key={index}
            className="font-bold text-emerald-800 bg-emerald-100/90 px-1 py-0.5 rounded border border-emerald-300/60 shadow-2xs mx-0.5"
            title="Nombre del cliente (Variable {{1}})"
          >
            {clientName}
          </strong>
        );
      }
      if (part === '{{2}}') {
        const text = companyName?.trim() || '';
        if (!text) {
          return null;
        }
        return (
          <strong
            key={index}
            className="font-bold text-sky-800 bg-sky-100/90 px-1 py-0.5 rounded border border-sky-300/60 shadow-2xs mx-0.5"
            title="Empresa vinculada al contacto (Variable {{2}})"
          >
            {text}
          </strong>
        );
      }
      if (part === '{{3}}') {
        return (
          <strong
            key={index}
            className="font-bold text-indigo-800 bg-indigo-100/90 px-1 py-0.5 rounded border border-indigo-300/60 shadow-2xs mx-0.5"
            title="Asesor / Agente (Variable {{3}})"
          >
            {agentName}
          </strong>
        );
      }
      const match = part.match(/^\{\{(\d+)\}\}$/);
      if (match) {
        return (
          <strong
            key={index}
            className="font-bold text-gray-800 bg-gray-100 px-1 py-0.5 rounded border border-gray-300 shadow-2xs mx-0.5"
          >
            {`Dato ${match[1]}`}
          </strong>
        );
      }
      return part;
    });
  }, [baseTemplate, clientName, companyName, agentName]);

  const handleSendDirectTemplate = async () => {
    if (!conversation || sendingTemplate || loadingTemplate) return;

    try {
      setSendingTemplate(true);

      let tpl = baseTemplate;
      if (!tpl) {
        tpl = await getConversationBaseTemplate(conversation.id);
      }

      if (!tpl) {
        onShowNotification?.(
          'error',
          'Plantilla no encontrada',
          'No se encontró la plantilla base configurada para este canal de WhatsApp.'
        );
        return;
      }

      const matches = tpl.bodyText?.match(/\{\{(\d+)\}\}/g) || [];
      const varNumbers = Array.from(
        new Set(matches.map((m) => parseInt(m.replace(/\D/g, ''), 10)))
      ).sort((a, b) => a - b);

      const parameters = varNumbers.map((n) => {
        if (n === 1) return { type: 'text' as const, text: clientName.trim() || conversation.clientName || 'Cliente' };
        if (n === 2) return { type: 'text' as const, text: companyName.trim() || ' ' };
        if (n === 3) return { type: 'text' as const, text: agentName };
        return { type: 'text' as const, text: '-' };
      });

      const payload: SendTemplatePayload = {
        templateName: tpl.name || 'crm_inicio_conversacion',
        languageCode: tpl.language || 'es',
        components: parameters.length > 0 ? [{ type: 'body', parameters }] : undefined,
      };

      const newMsg = await sendWhatsAppTemplate(conversation.id, payload);
      setIsHovered(false);
      onTemplateSent?.(newMsg);
    } catch (err: any) {
      console.error('Error al enviar plantilla base directa:', err);
      onShowNotification?.(
        'error',
        'Error de Envío',
        err?.response?.data?.message || 'No se pudo enviar la plantilla pre-aprobada a Meta WhatsApp.'
      );
    } finally {
      setSendingTemplate(false);
    }
  };

  return (
    <footer className="p-4 border-t border-gray-150 bg-white relative">
      {isWhatsAppWindowClosed ? (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs animate-fade-in relative">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 lg:mt-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                Ventana de Atención de WhatsApp Expirada (Margen de 23h)
              </h4>
              <p className="text-xs text-amber-800/90 font-medium mt-0.5 leading-relaxed">
                Para reactivar el contacto con este cliente, debes enviar una plantilla oficial pre-aprobada por Meta.
              </p>
            </div>
          </div>

          <div
            className="relative flex items-center shrink-0 self-end lg:self-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Live WhatsApp Bubble Preview Popover on Hover */}
            {isHovered && (
              <div
                className="absolute bottom-full mb-3 right-0 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none text-left"
                style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.18))' }}
              >
                {/* Popover Header */}
                <div className="px-3.5 py-2 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 border-b border-gray-150 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-600" />
                    <span className="text-xs font-black text-gray-800 tracking-tight">
                      Vista Previa del Mensaje
                    </span>
                  </div>
                  {baseTemplate?.status === 'APPROVED' ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 size={10} className="mr-0.5" /> Meta Aprobada
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      {baseTemplate?.name || 'Plantilla Base'}
                    </Badge>
                  )}
                </div>

                {/* Simulated WhatsApp Wallpaper */}
                <div
                  className="p-3.5 relative"
                  style={{
                    backgroundColor: '#efeae2',
                    backgroundImage: 'radial-gradient(#0000000c 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                >
                  {loadingTemplate && !baseTemplate ? (
                    <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-950/5 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                      <Loader size="sm" className="h-auto" />
                      <span>Cargando plantilla...</span>
                    </div>
                  ) : (
                    /* WhatsApp Bubble */
                    <div className="bg-white rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-emerald-950/5 max-w-[95%] space-y-1.5 relative">
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rotate-45 border-t border-r border-emerald-950/5" />

                      {headerText && (
                        <p className="font-extrabold text-xs text-gray-900 border-b border-gray-100 pb-1">
                          {headerText}
                        </p>
                      )}

                      <p className="text-xs text-gray-800 leading-relaxed font-normal whitespace-pre-line">
                        {previewBody}
                      </p>

                      {footerText && (
                        <p className="text-[10px] text-gray-400 font-medium pt-0.5">
                          {footerText}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 font-medium pt-0.5">
                        <span>Ahora</span>
                        <CheckCheck size={12} className="text-blue-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Popover Footer - Clic envía directamente */}
                <div
                  onClick={handleSendDirectTemplate}
                  className="bg-slate-50 hover:bg-emerald-50 px-3.5 py-2 border-t border-gray-150 flex items-center justify-between text-[11px] text-gray-500 font-medium cursor-pointer transition-colors"
                  title="Haz clic para enviar de inmediato"
                >
                  <span className="flex items-center gap-1 truncate max-w-[190px]">
                    <User size={12} className="text-blue-600 shrink-0" />
                    <span className="truncate">
                      Para: <strong className="text-gray-800 font-bold">{clientName}</strong>
                    </span>
                  </span>
                  <span className="text-emerald-700 font-black flex items-center gap-1 text-[10px] uppercase tracking-wide shrink-0">
                    <Zap size={11} className="fill-emerald-700 text-emerald-700" /> Clic para enviar
                  </span>
                </div>

                {/* Triangle Pointer down */}
                <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-slate-50 rotate-45 border-r border-b border-gray-200/90 shadow-2xs" />
              </div>
            )}

            {/* Single Button to Send Template */}
            <Button
              type="button"
              variant="success"
              onClick={handleSendDirectTemplate}
              disabled={sendingTemplate || loadingTemplate}
              loading={sendingTemplate}
              className="!py-2.5 !px-4 !rounded-xl !text-xs !font-black shadow-sm gap-2 group active:scale-95"
              title="Haz clic para enviar la plantilla oficial de WhatsApp de inmediato"
            >
              <Zap size={14} className="fill-white text-white group-hover:scale-110 transition-transform" />
              <span>Enviar Plantilla</span>
            </Button>
          </div>
        </div>
      ) : botActive ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2.5 text-slate-500 select-none">
          <Bot size={18} className="text-blue-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Bot activo respondiendo en este chat. Desactívalo para permitir la intervención humana.
          </span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje de respuesta..."
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-grow py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-700 font-medium"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </footer>
  );
};

export default MessageInputBar;


