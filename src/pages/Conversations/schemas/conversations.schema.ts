import * as yup from 'yup';
import type {
  Conversation,
  Message,
  MessageDeliveryStatus,
  MessageType,
  ChannelConfig,
  MessageStatusUpdatedEvent,
  WhatsAppTemplate,
  WhatsAppBaseTemplate,
  SendTemplatePayload,
  MetaTemplateComponent,
  UpsertBaseTemplateDto,
} from '../../../core/models/Conversation';

export type {
  Conversation,
  Message,
  MessageDeliveryStatus,
  MessageType,
  ChannelConfig,
  MessageStatusUpdatedEvent,
  WhatsAppTemplate,
  WhatsAppBaseTemplate,
  SendTemplatePayload,
  MetaTemplateComponent,
  UpsertBaseTemplateDto,
};

export type ChannelFilter = 'all' | 'whatsapp' | 'messenger' | 'instagram' | 'webchat';

/**
 * Esquema Yup para el envío de mensajes de texto libre
 */
export const messageValidationSchema = yup.object().shape({
  content: yup
    .string()
    .trim()
    .required('El contenido del mensaje no puede estar vacío')
    .max(4096, 'El mensaje excede el límite máximo de caracteres'),
});

export type MessageFormData = yup.InferType<typeof messageValidationSchema>;

/**
 * Estado de filtros del chat omnicanal
 */
export interface ConversationFiltersState {
  search: string;
  channel: ChannelFilter;
  assignedUserId: string | 'all';
  botActive: 'all' | 'active' | 'inactive';
  windowStatus: 'all' | 'open' | 'expired';
}
