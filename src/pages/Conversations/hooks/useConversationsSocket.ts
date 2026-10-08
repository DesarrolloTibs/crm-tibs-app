import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';

// Sockets y Autenticación
import { createAppSocket, safeDisconnect } from '../../../core/socket/socketClient';
import { useAuth } from '../../../hooks/useAuth';
import { useConfigStore } from '../../../store/useConfigStore';

// Modelos y Esquemas
import type {
  Conversation,
  Message,
  MessageStatusUpdatedEvent,
  ConversationFiltersState,
} from '../schemas/conversations.schema';
import { INITIAL_CONVERSATION_FILTERS, filterConversations } from '../utils/conversations.helpers';

// Servicios
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  toggleBotStatus,
  assignConversation,
} from '../../../services/conversationsService';
import { getUsers } from '../../../services/usersService';

export interface ConvNotification {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
}

export interface UseConversationsSocketReturn {
  loading: boolean;
  conversations: Conversation[];
  filteredConversations: Conversation[];
  selectedConv: Conversation | null;
  messages: Message[];
  allUsers: any[];
  unreadMap: Record<string, number>;
  inputText: string;
  filters: ConversationFiltersState;
  sending: boolean;
  isTemplateModalOpen: boolean;
  notification: ConvNotification;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setInputText: (text: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<ConversationFiltersState>>;
  setIsTemplateModalOpen: (open: boolean) => void;
  handleSelectConv: (conv: Conversation | null) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  handleTemplateSent: (newMsg: Message) => void;
  handleToggleBot: () => Promise<void>;
  handleAssignUser: (userId: string) => Promise<void>;
  loadConversationsList: (selectId?: string) => Promise<void>;
  notify: (type: 'success' | 'error' | 'warning' | 'confirmation', title: string, message: string) => void;
  hideNotification: () => void;
}

export function useConversationsSocket(): UseConversationsSocketReturn {
  const { user, isAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const currentUserId = user?.id || user?.sub;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlConvId = searchParams.get('id') || searchParams.get('conversationId');

  // ── Estados Principales ──
  const [loading, setLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // ── Estados de Interfaz y Filtros ──
  const [inputText, setInputText] = useState<string>('');
  const [filters, setFilters] = useState<ConversationFiltersState>(INITIAL_CONVERSATION_FILTERS);
  const [sending, setSending] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  // ── Notificaciones Unificadas (reemplaza SweetAlert2) ──
  const [notification, setNotification] = useState<ConvNotification>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const notify = useCallback(
    (type: 'success' | 'error' | 'warning' | 'confirmation', title: string, message: string) => {
      setNotification({ show: true, type, title, message });
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, show: false }));
  }, []);

  // ── Countdown de re-renderizado para actualizar tiempos de expiración cada 60s ──
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Mutable Refs (Prevención de Stale Closures en WebSockets) ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const allUsersRef = useRef<any[]>([]);
  const isAdminRef = useRef<boolean>(false);
  const loadConversationsListRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const isInitialConnectRef = useRef<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  // Sincronizar referencias mutables
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);
  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ── Carga de Lista de Conversaciones vía REST ──
  const loadConversationsList = useCallback(
    async (selectId?: string) => {
      try {
        const list = await getConversations();
        const validList = Array.isArray(list) ? list : [];
        setConversations(validList);

        const currentSelected = selectedConvRef.current;
        const currentIsAdmin = isAdminRef.current;

        if (selectId) {
          const found = validList.find((c) => c.id === selectId);
          if (found) {
            setSelectedConv(found);
            return;
          }
        }

        if (currentSelected) {
          const updated = validList.find((c) => c.id === currentSelected.id);
          if (updated) {
            setSelectedConv(updated);
          } else if (!currentIsAdmin) {
            setSelectedConv(null);
          }
        }
      } catch (err) {
        console.error('Error al cargar lista de chats:', err);
      }
    },
    []
  );

  loadConversationsListRef.current = loadConversationsList;

  // ── Montaje Inicial de Datos (Guard contra StrictMode de React 19) ──
  useEffect(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const initData = async () => {
      try {
        setLoading(true);
        const [, usersList] = await Promise.all([
          loadConversationsList(urlConvId || undefined),
          getUsers().catch(() => []),
        ]);
        setAllUsers(Array.isArray(usersList) ? usersList : []);
      } catch (err) {
        console.error('Error cargando datos de conversaciones:', err);
        notify('error', 'Error de Carga', 'No se pudieron sincronizar las conversaciones iniciales.');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    initData();
  }, [urlConvId, schemaName, loadConversationsList, notify]);

  // ── Cargar Mensajes al Seleccionar una Conversación ──
  useEffect(() => {
    if (!selectedConv?.id) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const data = await getConversationMessages(selectedConv.id);
        setMessages(Array.isArray(data) ? data : []);
        scrollToBottom();
      } catch (err) {
        console.error('Error al cargar mensajes de la conversación seleccionada:', err);
        notify('error', 'Error de Conversación', 'No fue posible descargar los mensajes.');
      }
    };

    loadMessages();
  }, [selectedConv?.id, scrollToBottom, notify]);

  // ── Conexión en Tiempo Real con WebSockets (`/conversations`) ──
  useEffect(() => {
    if (!currentUserId) return;

    isInitialConnectRef.current = true;
    const socket = createAppSocket({
      namespace: 'conversations',
      query: { userId: currentUserId, tenantSchema: schemaName || 'public' },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Asegurar que el socket ingrese a la sala del tenant activo
      socket.emit('set_tenant', { tenantSchema: schemaName || 'public' });

      if (!isInitialConnectRef.current) {
        console.log('[Conversations WS] Reconectado. Re-sincronizando estado vía REST...');
        if (loadConversationsListRef.current) {
          loadConversationsListRef.current();
        }
        const currentSelected = selectedConvRef.current;
        if (currentSelected) {
          getConversationMessages(currentSelected.id)
            .then((latestMessages) => {
              setMessages(Array.isArray(latestMessages) ? latestMessages : []);
              scrollToBottom();
            })
            .catch((err) => console.error('Error sincronizando mensajes tras reconexión:', err));
        }
      } else {
        isInitialConnectRef.current = false;
        console.log(`Conectado a WebSocket de Conversaciones`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('Desconexión en Conversations WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Error de conexión en Conversations WebSocket:', err.message);
    });

    // 1. Mensaje recibido en tiempo real (entrante de cliente o saliente)
    socket.on('message_received', (newMsg: Message) => {
      const convId =
        newMsg.conversationId ||
        (newMsg as any).conversation_id ||
        (newMsg as any).conversation?.id;
      if (!convId) return;

      const isCustomer = newMsg.sender === 'contact';
      const safetyExpires = isCustomer
        ? new Date(new Date(newMsg.createdAt).getTime() + 23 * 3600 * 1000).toISOString()
        : undefined;
      const windowExpires = isCustomer
        ? new Date(new Date(newMsg.createdAt).getTime() + 24 * 3600 * 1000).toISOString()
        : undefined;

      // Actualizar lista de conversaciones y mover la conversación a la cima (índice 0)
      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c.id === convId);
        if (convIndex === -1) {
          // Si el chat es nuevo, recargar la lista completa desde el backend
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

        const remaining = prev.filter((_, idx) => idx !== convIndex);
        return [updatedConv, ...remaining];
      });

      // Incrementar contador de no leídos si el mensaje proviene del cliente y el chat no está abierto
      const currentSelected = selectedConvRef.current;
      if (isCustomer && (!currentSelected || currentSelected.id !== convId)) {
        setUnreadMap((prev) => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }

      // Si coincide con la conversación seleccionada activamente en pantalla
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
          if (
            prev.some(
              (m) =>
                m.id === newMsg.id ||
                (newMsg.externalMessageId && m.externalMessageId === newMsg.externalMessageId)
            )
          ) {
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
          m.id === data.messageId ||
          (data.externalMessageId && m.externalMessageId === data.externalMessageId)
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

    // 3. Conmutación en tiempo real del Bot de IA
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

    // 4. Reasignación de ejecutivo responsable en vivo
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
    });

    return () => {
      safeDisconnect(socket);
    };
  }, [currentUserId, schemaName, scrollToBottom]);

  // ── Selección Reactiva de Conversación con Sincronización de URL ──
  const handleSelectConv = useCallback(
    (conv: Conversation | null) => {
      setSelectedConv(conv);
      if (conv) {
        // Limpiar conteo de no leídos
        setUnreadMap((prev) => {
          if (!prev[conv.id]) return prev;
          const next = { ...prev };
          delete next[conv.id];
          return next;
        });

        // Sincronizar parámetro de URL
        setSearchParams((prevParams) => {
          const next = new URLSearchParams(prevParams);
          next.set('id', conv.id);
          return next;
        });
      } else {
        setSearchParams((prevParams) => {
          const next = new URLSearchParams(prevParams);
          next.delete('id');
          next.delete('conversationId');
          return next;
        });
      }
    },
    [setSearchParams]
  );

  // ── Envío de Mensaje de Texto Libre ──
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

        // Mover la conversación inmediatamente a la cima de la barra lateral
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
        // Bloquear localmente el input al detectar corte de ventana de 23h
        if (selectedConv) {
          setSelectedConv((prev) => (prev ? { ...prev, is24HourWindowActive: false } : null));
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedConv.id ? { ...c, is24HourWindowActive: false } : c))
          );
        }
        notify(
          'warning',
          'Ventana de WhatsApp Expirada',
          'La ventana de atención de 24 horas (margen de 23h) ha expirado. Por favor, envía una plantilla oficial pre-aprobada.'
        );
        setTimeout(() => setIsTemplateModalOpen(true), 600);
      } else {
        notify('error', 'Error al Enviar', errMsg || 'No fue posible enviar el mensaje.');
      }
    } finally {
      setSending(false);
    }
  };

  // ── Envío de Plantilla Oficial de WhatsApp ──
  const handleTemplateSent = (newMsg: Message) => {
    const convId = newMsg.conversationId || (newMsg as any).conversation_id;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    scrollToBottom();

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
    notify('success', 'Plantilla Enviada', 'La plantilla oficial de WhatsApp fue despachada con éxito.');
  };

  // ── Conmutar Estado del Bot IA ──
  const handleToggleBot = async () => {
    if (!selectedConv) return;
    const newStatus = !selectedConv.botActive;
    try {
      await toggleBotStatus(selectedConv.id, newStatus);
      setSelectedConv((prev) => (prev ? { ...prev, botActive: newStatus } : null));
    } catch (err: any) {
      console.error('Error al alternar bot:', err);
      notify('error', 'Error del Bot', 'No se pudo conmutar el estado del agente de IA.');
    }
  };

  // ── Asignar Ejecutivo Responsable ──
  const handleAssignUser = async (userId: string) => {
    if (!selectedConv) return;
    if (selectedConv.assignedUserId && (!userId || userId.trim() === '')) {
      notify('warning', 'Acción no permitida', 'Una conversación ya asignada no puede quedar desatendida.');
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
      notify('success', 'Reasignado', 'La conversación ha sido reasignada correctamente.');
    } catch (err: any) {
      console.error('Error al asignar ejecutivo:', err);
      notify('error', 'Error de Asignación', err?.response?.data?.message || 'No fue posible reasignar la conversación.');
    }
  };

  // ── Colección Filtrada y Ordenada en Memoria ──
  const filteredConversations = useMemo(
    () => filterConversations(conversations, filters),
    [conversations, filters]
  );

  return {
    loading,
    conversations,
    filteredConversations,
    selectedConv,
    messages,
    allUsers,
    unreadMap,
    inputText,
    filters,
    sending,
    isTemplateModalOpen,
    notification,
    messagesEndRef,
    setInputText,
    setFilters,
    setIsTemplateModalOpen,
    handleSelectConv,
    handleSendMessage,
    handleTemplateSent,
    handleToggleBot,
    handleAssignUser,
    loadConversationsList,
    notify,
    hideNotification,
  };
}

export default useConversationsSocket;
