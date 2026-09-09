import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
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
  simulateIncomingMessage,
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

  // ── UI state ──
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<ChannelFilter>('all');
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<ConvNotification>(NOTIF_HIDDEN);

  // ── Simulator form state ──
  const [simChannel, setSimChannel] = useState('whatsapp');
  const [simExternalId, setSimExternalId] = useState('+525551234567');
  const [simNickname, setSimNickname] = useState('Pedro Pérez');
  const [simText, setSimText] = useState('Hola, quiero cotizar unas licencias de software');

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

    const rawUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
    const socketPath = rawUrl.includes('/backend') ? '/backend/socket.io' : '/socket.io';
    const originUrl = rawUrl.replace(/\/backend\/?$/, '');
    const socket = io(`${originUrl}/conversations`, { path: socketPath, query: { userId: currentUserId } });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado a Websockets de Conversaciones');
    });

    // 1. Mensaje recibido (entrante de cliente o emitido por usuario/bot)
    socket.on('message_received', (newMsg: Message) => {
      const isCustomer = newMsg.sender === 'contact';
      const safetyExpires = isCustomer
        ? new Date(new Date(newMsg.createdAt).getTime() + 23 * 3600 * 1000).toISOString()
        : undefined;
      const windowExpires = isCustomer
        ? new Date(new Date(newMsg.createdAt).getTime() + 24 * 3600 * 1000).toISOString()
        : undefined;

      // Actualizar lista de conversaciones
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: newMsg,
              lastCustomerMessageAt: isCustomer ? newMsg.createdAt : c.lastCustomerMessageAt,
              is24HourWindowActive: isCustomer ? true : c.is24HourWindowActive,
              safetyWindowExpiresAt: isCustomer && safetyExpires ? safetyExpires : c.safetyWindowExpiresAt,
              windowExpiresAt: isCustomer && windowExpires ? windowExpires : c.windowExpiresAt,
            };
          }
          return c;
        })
      );

      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === newMsg.conversationId) {
        if (isCustomer) {
          setSelectedConv((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessage: newMsg,
                  lastCustomerMessageAt: newMsg.createdAt,
                  is24HourWindowActive: true,
                  safetyWindowExpiresAt: safetyExpires || prev.safetyWindowExpiresAt,
                  windowExpiresAt: windowExpires || prev.windowExpiresAt,
                }
              : null
          );
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
    });

    // 2. Estado de entrega actualizado por webhook de Meta (sent, delivered, read, failed)
    socket.on('message_status_updated', (data: MessageStatusUpdatedEvent) => {
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
          if (
            c.id === data.conversationId &&
            c.lastMessage &&
            (c.lastMessage.id === data.messageId ||
              (data.externalMessageId && c.lastMessage.externalMessageId === data.externalMessageId))
          ) {
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
          return c;
        })
      );
    });

    // 3. Cambio de estado del bot
    socket.on('bot_status_changed', (data: { conversationId: string; botActive: boolean }) => {
      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === data.conversationId) {
        setSelectedConv((prev) => (prev ? { ...prev, botActive: data.botActive } : null));
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, botActive: data.botActive } : c))
      );
    });

    // 4. Asignación de ejecutivo
    socket.on('conversation_assigned', (data: { conversationId: string; assignedUserId: string | null }) => {
      const newAssignedUser = allUsersRef.current.find((u) => u.id === data.assignedUserId) || null;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? { ...c, assignedUserId: data.assignedUserId, assignedUser: newAssignedUser }
            : c
        )
      );
      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === data.conversationId) {
        setSelectedConv((prev) =>
          prev && prev.id === data.conversationId
            ? { ...prev, assignedUserId: data.assignedUserId, assignedUser: newAssignedUser }
            : prev
        );
      }
      if (loadConversationsListRef.current) loadConversationsListRef.current();
    });

    return () => { socket.disconnect(); };
  }, [currentUserId]);

  // ── Actions ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    try {
      setSending(true);
      const msg = await sendMessage(selectedConv.id, textToSend);
      setMessages((prev) => {
        if (!msg || (msg.id && prev.some((m) => m.id === msg.id))) {
          return prev;
        }
        return [...prev, msg];
      });
      scrollToBottom();
      loadConversationsList();
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
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    scrollToBottom();
    setConversations((prev) =>
      prev.map((c) => (c.id === newMsg.conversationId ? { ...c, lastMessage: newMsg } : c))
    );
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

  const handleSimulate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!simExternalId.trim()) { showNotif('warning', 'Campo Requerido', simChannel === 'whatsapp' ? 'Ingrese el Teléfono del Remitente.' : 'Ingrese el ID del Perfil Social.'); return; }
    if (!simNickname.trim()) { showNotif('warning', 'Campo Requerido', 'Ingrese el Apodo del Perfil Social.'); return; }
    if (!simText.trim()) { showNotif('warning', 'Campo Requerido', 'Ingrese el Mensaje del Cliente.'); return; }
    try {
      await simulateIncomingMessage(simChannel, simExternalId.trim(), simNickname.trim(), simText.trim());
      showNotif('success', 'Mensaje Recibido', 'El mensaje simulado ha entrado en el sistema.');
      setIsSimPanelOpen(false);
      loadConversationsList();
    } catch (err) {
      console.error('Error al simular mensaje:', err);
      showNotif('error', 'Error', 'Error al simular mensaje entrante.');
    }
  };

  // ── Derived: filtered conversations ──
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (c.clientName || '').toLowerCase().includes(q) ||
      (c.externalId || '').toLowerCase().includes(q) ||
      (c.client?.nombre || '').toLowerCase().includes(q) ||
      (c.assignedUser?.username || '').toLowerCase().includes(q);
    const matchesChannel = selectedChannelFilter === 'all' || c.channel === selectedChannelFilter;
    return matchesQuery && matchesChannel;
  });

  return {
    // state
    loading, conversations, selectedConv, messages, allUsers,
    inputText, searchQuery, selectedChannelFilter,
    isSimPanelOpen, isTemplateModalOpen, sending, notification,
    simChannel, simExternalId, simNickname, simText,
    filteredConversations,
    // refs
    messagesEndRef,
    // setters
    setSelectedConv, setInputText, setSearchQuery,
    setSelectedChannelFilter, setIsSimPanelOpen, setIsTemplateModalOpen,
    setSimChannel, setSimExternalId, setSimNickname, setSimText,
    hideNotif, showNotif,
    // actions
    handleSendMessage, handleSendBaseTemplate, handleTemplateSent, handleToggleBot, handleAssignUser, handleSimulate,
    loadConversationsList,
    // auth
    isAdmin, currentUserId,
  };
}
