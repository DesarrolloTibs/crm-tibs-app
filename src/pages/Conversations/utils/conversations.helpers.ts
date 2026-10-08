import type {
  Conversation,
  ConversationFiltersState,
} from '../schemas/conversations.schema';
import { getWhatsAppWindowStatus } from './conversations.messages';

export const INITIAL_CONVERSATION_FILTERS: ConversationFiltersState = {
  search: '',
  channel: 'all',
  assignedUserId: 'all',
  botActive: 'all',
  windowStatus: 'all',
};

/**
 * Normaliza, filtra y ordena cronológicamente la colección de conversaciones
 */
export const filterConversations = (
  conversations: Conversation[],
  filters: ConversationFiltersState
): Conversation[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return conversations
    .filter((conv) => {
      // 1. Coincidencia por texto libre (nombre del cliente, ID externo, asesor asignado)
      const clientName = (conv.clientName || '').toLowerCase();
      const externalId = (conv.externalId || '').toLowerCase();
      const clientNombre = (conv.client?.nombre || '').toLowerCase();
      const assignedUsername = (conv.assignedUser?.username || '').toLowerCase();
      const lastMessageText = (conv.lastMessage?.content || '').toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        clientName.includes(normalizedSearch) ||
        externalId.includes(normalizedSearch) ||
        clientNombre.includes(normalizedSearch) ||
        assignedUsername.includes(normalizedSearch) ||
        lastMessageText.includes(normalizedSearch);

      // 2. Coincidencia por canal
      const matchesChannel =
        filters.channel === 'all' || conv.channel === filters.channel;

      // 3. Coincidencia por asesor asignado
      const matchesUser =
        filters.assignedUserId === 'all' ||
        conv.assignedUserId === filters.assignedUserId;

      // 4. Coincidencia por estado del bot
      const matchesBot =
        filters.botActive === 'all' ||
        (filters.botActive === 'active' && conv.botActive) ||
        (filters.botActive === 'inactive' && !conv.botActive);

      // 5. Coincidencia por ventana de WhatsApp
      let matchesWindow = true;
      if (filters.windowStatus !== 'all') {
        const status = getWhatsAppWindowStatus(conv);
        if (filters.windowStatus === 'open') {
          matchesWindow = !status.isExpired;
        } else if (filters.windowStatus === 'expired') {
          matchesWindow = status.isExpired;
        }
      }

      return (
        matchesSearch &&
        matchesChannel &&
        matchesUser &&
        matchesBot &&
        matchesWindow
      );
    })
    .sort((a, b) => {
      // Ordenamiento cronológico: la conversación con actividad más reciente en la cima
      const timeA = new Date(
        a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0
      ).getTime();
      const timeB = new Date(
        b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0
      ).getTime();
      return timeB - timeA;
    });
};

/**
 * Obtiene las iniciales del nombre de un cliente
 */
export const getInitials = (name?: string): string => {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};
