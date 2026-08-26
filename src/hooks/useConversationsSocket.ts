import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import { getUsers } from '../services/usersService';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  toggleBotStatus,
  assignConversation,
  simulateIncomingMessage,
} from '../services/conversationsService';

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
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // ── UI state ──
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<ChannelFilter>('all');
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<ConvNotification>(NOTIF_HIDDEN);

  // ── Simulator form state ──
  const [simChannel, setSimChannel] = useState('whatsapp');
  const [simExternalId, setSimExternalId] = useState('+525551234567');
  const [simNickname, setSimNickname] = useState('Pedro Pérez');
  const [simText, setSimText] = useState('Hola, quiero cotizar unas licencias de software');

  // ── Refs (stale closure prevention) ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedConvRef = useRef<any>(null);
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
        const found = list.find((c: any) => c.id === selectId);
        if (found) { setSelectedConv(found); return; }
      }

      if (currentSelected) {
        const updated = list.find((c: any) => c.id === currentSelected.id);
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

    socket.on('message_received', (newMsg: any) => {
      if (loadConversationsListRef.current) loadConversationsListRef.current();
      const currentSelected = selectedConvRef.current;
      if (currentSelected && newMsg.conversationId === currentSelected.id) {
        setMessages((prev: any[]) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
    });

    socket.on('bot_status_changed', (data: { conversationId: string; botActive: boolean }) => {
      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === data.conversationId) {
        setSelectedConv((prev: any) => prev ? { ...prev, botActive: data.botActive } : null);
      }
      setConversations((prev: any[]) =>
        prev.map((c) => c.id === data.conversationId ? { ...c, botActive: data.botActive } : c)
      );
    });

    socket.on('conversation_assigned', (data: { conversationId: string; assignedUserId: string | null }) => {
      const newAssignedUser = allUsersRef.current.find((u) => u.id === data.assignedUserId) || null;
      setConversations((prev: any[]) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? { ...c, assignedUserId: data.assignedUserId, assignedUser: newAssignedUser }
            : c
        )
      );
      const currentSelected = selectedConvRef.current;
      if (currentSelected && currentSelected.id === data.conversationId) {
        setSelectedConv((prev: any) =>
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
      setMessages((prev: any[]) => {
        if (!msg || (msg.id && prev.some((m) => m.id === msg.id))) {
          return prev;
        }
        return [...prev, msg];
      });
      scrollToBottom();
      loadConversationsList();
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setInputText(textToSend);
      showNotif('error', 'Error', 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleBot = async () => {
    if (!selectedConv) return;
    const newStatus = !selectedConv.botActive;
    try {
      await toggleBotStatus(selectedConv.id, newStatus);
      setSelectedConv((prev: any) => ({ ...prev, botActive: newStatus }));
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
      setSelectedConv((prev: any) =>
        prev && prev.id === selectedConv.id
          ? { ...prev, assignedUserId: userId || null, assignedUser: newAssignedUser || prev.assignedUser }
          : prev
      );
      setConversations((prev: any[]) =>
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
      c.clientName.toLowerCase().includes(q) ||
      c.externalId.toLowerCase().includes(q) ||
      (c.client?.nombre || '').toLowerCase().includes(q) ||
      (c.assignedUser?.username || '').toLowerCase().includes(q);
    const matchesChannel = selectedChannelFilter === 'all' || c.channel === selectedChannelFilter;
    return matchesQuery && matchesChannel;
  });

  return {
    // state
    loading, conversations, selectedConv, messages, allUsers,
    inputText, searchQuery, selectedChannelFilter,
    isSimPanelOpen, sending, notification,
    simChannel, simExternalId, simNickname, simText,
    filteredConversations,
    // refs
    messagesEndRef,
    // setters
    setSelectedConv, setInputText, setSearchQuery,
    setSelectedChannelFilter, setIsSimPanelOpen,
    setSimChannel, setSimExternalId, setSimNickname, setSimText,
    hideNotif,
    // actions
    handleSendMessage, handleToggleBot, handleAssignUser, handleSimulate,
    loadConversationsList,
    // auth
    isAdmin, currentUserId,
  };
}
