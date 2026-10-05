import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { createAppSocket } from '../core/socket/socketClient';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import { getUsers } from '../services/usersService';
import type {
  Conversation,
  Message,
  MessageStatusUpdatedEvent,
} from '../core/models/Conversation';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  toggleBotStatus,
  assignConversation,
  getConversationBaseTemplate,
  sendWhatsAppTemplate,
} from '../services/conversationsService';
import type { SendTemplatePayload } from '../core/models/Conversation';

export type ChannelFilter = 'all' | 'whatsapp' | 'messenger' | 'instagram' | 'webchat';

export interface ConvNotification {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
}

const NOTIF_HIDDEN: ConvNotification = { show: false, type: 'success', title: '', message: '' };

export function useConversationsSocket() {
  const { user, isAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const currentUserId = user?.id || user?.sub;

  const [searchParams] = useSearchParams();
  const urlConvId = searchParams.get('id') || searchParams.get('conversationId');

  // ── Core state ──
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // ── UI state ──
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<ChannelFilter>('all');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<ConvNotification>(NOTIF_HIDDEN);

  // ── Countdown re-render tick (actualiza badges de tiempo cada 60s) ──
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Refs (stale closure prevention) ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const allUsersRef = useRef<any[]>([]);
  const isAdminRef = useRef<boolean>(false);
  const loadConversationsListRef = useRef<any>(null);
  const isInitialConnectRef = useRef<boolean>(true);

  // Sync refs
  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);
  useEffect(() => { allUsersRef.current = allUsers; }, [allUsers]);
  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
  useEffect(() => { loadConversationsListRef.current = loadConversationsList; });

  // ── Helpers ──
  const showNotif = (type: ConvNotification['type'], title: string, message: string) =>
    setNotification({ show: true, type, title, message });
  const hideNotif = () => setNotification(NOTIF_HIDDEN);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ── Load conversations list ──
  const loadConversationsList = async (selectId?: string) => {
    try {
      const list = await getConversations();
      setConversations(list);

      const currentSelected = selectedConvRef.current;
      const currentIsAdmin = isAdminRef.current;

      if (selectId) {
        const found = list.find((c) => c.id === selectId);
        if (found) { setSelectedConv(found); return; }
      }

      if (currentSelected) {
        const updated = list.find((c) => c.id === currentSelected.id);
        if (updated) {
          setSelectedConv(updated);
        } else if (!currentIsAdmin) {
          setSelectedConv(null);
        }
      }
    } catch (err) {
      console.error('Error al cargar lista de chats:', err);
    }
  };

  // ── Initial load ──
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [, usersList] = await Promise.all([
          loadConversationsList(urlConvId || undefined),
          getUsers(),
        ]);
        setAllUsers(usersList);
      } catch (err) {
        console.error('Error cargando datos de conversaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [urlConvId, schemaName]);

  // ── Load messages when conversation is selected ──
  useEffect(() => {
    if (!selectedConv) return;
    const loadMessages = async () => {
      try {
        const data = await getConversationMessages(selectedConv.id);
        setMessages(data);
        scrollToBottom();
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
      }
    };
    loadMessages();
  }, [selectedConv?.id]);

  // ── WebSocket connection ──
  useEffect(() => {
    if (!currentUserId) return;

    const socket = createAppSocket({
      namespace: 'conversations',
      query: { userId: currentUserId },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsWsConnected(true);
      if (!isInitialConnectRef.current) {
        console.log('[Conversations WS] Reconectado. Sincronizando estado más reciente vía REST...');
        if (loadConversationsListRef.current) {
          loadConversationsListRef.current();
        }
        const currentSelected = selectedConvRef.current;
        if (currentSelected) {
          getConversationMessages(currentSelected.id)
            .then((latestMessages) => {
              setMessages(latestMessages);
              scrollToBottom();
            })
            .catch((err) => console.error('Error re-sincronizando mensajes tras reconexión:', err));
        }
      } else {
        isInitialConnectRef.current = false;
        console.log('Conectado a Websockets de Conversaciones');
      }
    });

    socket.on('disconnect', (reason) => {
      setIsWsConnected(false);
      console.warn('Desconexión en Conversations WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      setIsWsConnected(false);
      console.warn('Error de conexión en Conversations WebSocket:', err.message);
    });

    // 1. Mensaje recibido (entrante de cliente o emitido por usuario/bot)
    socket.on('message_received', (newMsg: Message) => {
      const convId = newMsg.conversationId || (newMsg as any).conversation_id || (newMsg as any).conversation?.id;
      if (!convId) return;

      const isCustomer = newMsg.sender === 'contact';
      const safetyExpires = isCustomer
        ? new Date(new Date(newMsg.createdAt).getTime() + 23 * 3600 * 1000).toISOString()
        : undefined;
      const windowExpires = isCustomer
        ? new Date(new Date(newMsg.createdAt).getTime() + 24 * 3600 * 1000).toISOString()
        : undefined;

      // Actualizar lista de conversaciones en tiempo real y mover a la cima
      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c.id === convId);
        if (convIndex === -1) {
          // Si el chat es nuevo o no está cargado localmente, recargar lista del backend
          if (loadConversationsListRef.current) {
            loadConversationsListRef.current();
          }
          return prev;
        }

        const targetConv = prev[convIndex];
        const updatedConv: Conversation = {
          ...targetConv,
          lastMessage: newMsg,
          lastCustomerMessageAt: isCustomer ? newMsg.createdAt : targetConv.lastCustomerMessageAt,
          is24HourWindowActive: isCustomer ? true : targetConv.is24HourWindowActive,
          safetyWindowExpiresAt: isCustomer && safetyExpires ? safetyExpires : targetConv.safetyWindowExpiresAt,
          windowExpiresAt: isCustomer && windowExpires ? windowExpires : targetConv.windowExpiresAt,
          updatedAt: newMsg.createdAt || new Date().toISOString(),
        };

        // Colocar la conversación que tuvo actividad en la cima (índice 0)
        const remaining = prev.filter((_, idx) => idx !== convIndex);
        return [updatedConv, ...remaining];
      });

      // Incrementar contador de no leídos si el mensaje es del contacto y el chat no está abierto
      const currentSelected = selectedConvRef.current;
      if (isCustomer && (!currentSelected || currentSelected.id !== convId)) {
        setUnreadMap((prev) => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }

      // Si coincide con la conversación activa en pantalla
      if (currentSelected && currentSelected.id === convId) {
        setSelectedConv((prev) =>
          prev
            ? {
                ...prev,
                lastMessage: newMsg,
                lastCustomerMessageAt: isCustomer ? newMsg.createdAt : prev.lastCustomerMessageAt,
                is24HourWindowActive: isCustomer ? true : prev.is24HourWindowActive,
                safetyWindowExpiresAt: isCustomer && safetyExpires ? safetyExpires : prev.safetyWindowExpiresAt,
                windowExpiresAt: isCustomer && windowExpires ? windowExpires : prev.windowExpiresAt,
                updatedAt: newMsg.createdAt || new Date().toISOString(),
              }
            : null
        );

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id || (newMsg.externalMessageId && m.externalMessageId === newMsg.externalMessageId))) {
            return prev;
          }
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
    });

    // 2. Estado de entrega actualizado por webhook de Meta (sent, delivered, read, failed)
    socket.on('message_status_updated', (data: MessageStatusUpdatedEvent) => {
      const convId = data.conversationId || (data as any).conversation_id;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId || (data.externalMessageId && m.externalMessageId === data.externalMessageId)
            ? {
                ...m,
                status: data.status,
                externalMessageId: data.externalMessageId ?? m.externalMessageId,
                errorMessage: data.errorMessage ?? m.errorMessage,
              }
            : m
        )
      );

      setConversations((prev) =>
        prev.map((c) => {
          const isTargetConv =
            c.id === convId ||
            (!convId &&
              c.lastMessage &&
              (c.lastMessage.id === data.messageId ||
                (data.externalMessageId && c.lastMessage.externalMessageId === data.externalMessageId)));

          if (isTargetConv && c.lastMessage) {
            const isTargetMsg =
              c.lastMessage.id === data.messageId ||
              (data.externalMessageId && c.lastMessage.externalMessageId === data.externalMessageId) ||
              (!data.messageId && !data.externalMessageId);

            if (isTargetMsg) {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  status: data.status,
                  externalMessageId: data.externalMessageId ?? c.lastMessage.externalMessageId,
                  errorMessage: data.errorMessage ?? c.lastMessage.errorMessage,
                },
              };
            }
          }
          return c;
        })
      );

      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.lastMessage) {
        const isCurrentTarget =
          currentSelected.id === convId ||
          currentSelected.lastMessage.id === data.messageId ||
          (data.externalMessageId && currentSelected.lastMessage.externalMessageId === data.externalMessageId);

        if (isCurrentTarget) {
          setSelectedConv((prev) =>
            prev && prev.lastMessage
              ? {
                  ...prev,
                  lastMessage: {
                    ...prev.lastMessage,
                    status: data.status,
                    externalMessageId: data.externalMessageId ?? prev.lastMessage.externalMessageId,
                    errorMessage: data.errorMessage ?? prev.lastMessage.errorMessage,
                  },
                }
              : prev
          );
        }
      }
    });

    // 3. Cambio de estado del bot
    socket.on('bot_status_changed', (data: { conversationId: string; botActive: boolean }) => {
      const convId = data.conversationId || (data as any).conversation_id;
      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === convId) {
        setSelectedConv((prev) => (prev ? { ...prev, botActive: data.botActive } : null));
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, botActive: data.botActive } : c))
      );
    });

    // 4. Asignación de ejecutivo
    socket.on('conversation_assigned', (data: { conversationId: string; assignedUserId: string | null }) => {
      const convId = data.conversationId || (data as any).conversation_id;
      const newAssignedUser = allUsersRef.current.find((u) => u.id === data.assignedUserId) || null;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, assignedUserId: data.assignedUserId, assignedUser: newAssignedUser }
            : c
        )
      );
      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === convId) {
        setSelectedConv((prev) =>
          prev && prev.id === convId
            ? { ...prev, assignedUserId: data.assignedUserId, assignedUser: newAssignedUser }
            : prev
        );
      }
      if (loadConversationsListRef.current) loadConversationsListRef.current();
    });

    return () => { socket.disconnect(); };
  }, [currentUserId, schemaName]);

  // ── Actions ──
  const handleSelectConv = useCallback((conv: Conversation | null) => {
    setSelectedConv(conv);
    if (conv) {
      setUnreadMap((prev) => {
        if (!prev[conv.id]) return prev;
        const next = { ...prev };
        delete next[conv.id];
        return next;
      });
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    try {
      setSending(true);
      const msg = await sendMessage(selectedConv.id, textToSend);
      if (msg) {
        setMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
        scrollToBottom();

        // Actualizar la conversación en la barra lateral de forma inmediata y moverla a la cima
        setConversations((prev) => {
          const convIndex = prev.findIndex((c) => c.id === selectedConv.id);
          if (convIndex === -1) return prev;
          const target = prev[convIndex];
          const updated: Conversation = {
            ...target,
            lastMessage: msg,
            updatedAt: msg.createdAt || new Date().toISOString(),
          };
          return [updated, ...prev.filter((_, idx) => idx !== convIndex)];
        });

        setSelectedConv((prev) => (prev ? { ...prev, lastMessage: msg } : null));
      }
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err);
      setInputText(textToSend);

      const errMsg = err?.response?.data?.message || '';
      const isWindowExpiredError =
        err?.response?.status === 400 &&
        (errMsg.toLowerCase().includes('ventana') ||
          errMsg.toLowerCase().includes('plantilla') ||
          errMsg.toLowerCase().includes('23 horas') ||
          errMsg.toLowerCase().includes('expirad'));

      if (isWindowExpiredError) {
        // Bloquear localmente el input al detectar corte de ventana
        if (selectedConv) {
          setSelectedConv((prev) => (prev ? { ...prev, is24HourWindowActive: false } : null));
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedConv.id ? { ...c, is24HourWindowActive: false } : c))
          );
        }
        showNotif(
          'warning',
          'Ventana de WhatsApp Expirada',
          'La ventana de atención de 24 horas (margen seguro de 23h) ha expirado. Abriendo catálogo de plantillas pre-aprobadas de Meta...'
        );
        setTimeout(() => {
          setIsTemplateModalOpen(true);
        }, 600);
      } else {
        showNotif('error', 'Error', errMsg || 'No se pudo enviar el mensaje.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSent = (newMsg: Message) => {
    const convId = newMsg.conversationId || (newMsg as any).conversation_id;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    scrollToBottom();

    // Actualizar la conversación y moverla a la cima de la barra lateral
    setConversations((prev) => {
      const convIndex = prev.findIndex((c) => c.id === convId);
      if (convIndex === -1) return prev;
      const target = prev[convIndex];
      const updated: Conversation = {
        ...target,
        lastMessage: newMsg,
        updatedAt: newMsg.createdAt || new Date().toISOString(),
      };
      return [updated, ...prev.filter((_, idx) => idx !== convIndex)];
    });

    setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, lastMessage: newMsg } : prev));
    showNotif('success', 'Plantilla Enviada', 'La plantilla oficial de WhatsApp ha sido despachada con éxito.');
  };

  const handleSendBaseTemplate = async (conversationId?: string) => {
    const targetConv = conversationId
      ? conversations.find((c) => c.id === conversationId) || selectedConv
      : selectedConv;
    if (!targetConv || sending) return;

    try {
      setSending(true);
      const baseTpl = await getConversationBaseTemplate(targetConv.id);
      if (!baseTpl) {
        showNotif(
          'error',
          'Plantilla No Configurada',
          'No se encontró la plantilla base configurada para este canal de WhatsApp.'
        );
        return;
      }

      const matches = baseTpl.bodyText?.match(/\{\{(\d+)\}\}/g) || [];
      const varNumbers = Array.from(
        new Set(matches.map((m) => parseInt(m.replace(/\D/g, ''), 10)))
      ).sort((a, b) => a - b);

      const clientName =
        baseTpl.resolvedVariables?.[1] ||
        baseTpl.contact?.name ||
        targetConv.clientName?.trim() ||
        'Cliente';

      const companyName =
        baseTpl.resolvedVariables?.[2] ??
        baseTpl.contact?.company ??
        (targetConv.client as any)?.company?.nombre ??
        (targetConv.client as any)?.empresa ??
        '';

      const agentName =
        baseTpl.resolvedVariables?.[3] ||
        baseTpl.contact?.agent ||
        targetConv.assignedUser?.username ||
        user?.username ||
        'Asesor';

      const parameters = varNumbers.map((n) => {
        if (n === 1) return { type: 'text' as const, text: clientName.trim() || targetConv.clientName || 'Cliente' };
        if (n === 2) return { type: 'text' as const, text: companyName.trim() || ' ' };
        if (n === 3) return { type: 'text' as const, text: agentName };
        return { type: 'text' as const, text: '-' };
      });

      const payload: SendTemplatePayload = {
        templateName: baseTpl.name || 'crm_inicio_conversacion',
        languageCode: baseTpl.language || 'es',
        components: parameters.length > 0 ? [{ type: 'body', parameters }] : undefined,
      };

      const newMsg = await sendWhatsAppTemplate(targetConv.id, payload);
      handleTemplateSent(newMsg);
    } catch (err: any) {
      console.error('Error al enviar plantilla base directa:', err);
      showNotif(
        'error',
        'Error al Enviar Plantilla',
        err?.response?.data?.message || 'Fallo al despachar la plantilla a WhatsApp Cloud API.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleToggleBot = async () => {
    if (!selectedConv) return;
    const newStatus = !selectedConv.botActive;
    try {
      await toggleBotStatus(selectedConv.id, newStatus);
      setSelectedConv((prev) => (prev ? { ...prev, botActive: newStatus } : null));
    } catch (err) {
      console.error('Error al alternar bot:', err);
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!selectedConv) return;
    if (selectedConv.assignedUserId && (!userId || userId.trim() === '')) {
      showNotif('warning', 'Acción No Permitida', 'Una conversación asignada previamente no puede quedar sin ejecutivo.');
      return;
    }
    try {
      await assignConversation(selectedConv.id, userId);
      const newAssignedUser = allUsers.find((u) => u.id === userId) || null;
      setSelectedConv((prev) =>
        prev && prev.id === selectedConv.id
          ? { ...prev, assignedUserId: userId || null, assignedUser: newAssignedUser || prev.assignedUser }
          : prev
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, assignedUserId: userId || null, assignedUser: newAssignedUser || c.assignedUser }
            : c
        )
      );
      showNotif('success', 'Reasignado', 'Conversación reasignada con éxito.');
      loadConversationsList();
    } catch (err: any) {
      console.error('Error al asignar ejecutivo:', err);
      showNotif('error', 'Error de Asignación', err?.response?.data?.message || 'No se pudo reasignar la conversación.');
    }
  };

  // ── Derived: filtered & dynamically sorted conversations ──
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return conversations
      .filter((c) => {
        const matchesQuery =
          !q ||
          (c.clientName || '').toLowerCase().includes(q) ||
          (c.externalId || '').toLowerCase().includes(q) ||
          (c.client?.nombre || '').toLowerCase().includes(q) ||
          (c.assignedUser?.username || '').toLowerCase().includes(q);
        const matchesChannel = selectedChannelFilter === 'all' || c.channel === selectedChannelFilter;
        return matchesQuery && matchesChannel;
      })
      .sort((a, b) => {
        const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [conversations, searchQuery, selectedChannelFilter]);

  return {
    // state
    loading, conversations, selectedConv, messages, allUsers,
    inputText, searchQuery, selectedChannelFilter,
    isTemplateModalOpen, sending, notification,
    filteredConversations, unreadMap,
    isWsConnected, isConnected: isWsConnected,
    // refs
    messagesEndRef,
    // setters
    setSelectedConv: handleSelectConv, setInputText, setSearchQuery,
    setSelectedChannelFilter, setIsTemplateModalOpen,
    hideNotif, showNotif,
    // actions
    handleSendMessage, handleSendBaseTemplate, handleTemplateSent, handleToggleBot, handleAssignUser,
    loadConversationsList,
    // auth
    isAdmin, currentUserId,
  };
}
