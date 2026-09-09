export type MessageDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'template' | 'document' | 'image';

export interface Message {
  id: string;
  conversationId: string;
  sender: 'contact' | 'user' | 'bot' | 'agent' | 'system';
  senderUserId?: string | null;
  content: string;
  status?: MessageDeliveryStatus;
  messageType?: MessageType;
  externalMessageId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  senderUser?: {
    id: string;
    username: string;
    email?: string;
  } | null;
}

export interface Conversation {
  id: string;
  channel: 'whatsapp' | 'webchat' | 'messenger' | 'facebook' | 'instagram';
  externalId: string;
  clientName: string;
  clientId?: string | null;
  client?: any;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    username: string;
    role?: string;
  } | null;
  botActive: boolean;
  lastCustomerMessageAt?: string | null;
  is24HourWindowActive: boolean;
  windowExpiresAt?: string | null;
  safetyWindowExpiresAt?: string | null;
  lastMessage?: Message | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface WhatsAppTemplate {
  name: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  id: string;
  components: MetaTemplateComponent[];
}

export interface SendTemplatePayload {
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: string;
    index?: string;
    parameters: Array<{
      type: 'text' | 'image' | 'document' | 'video';
      text?: string;
      image?: { link: string };
    }>;
  }>;
}

export interface MessageStatusUpdatedEvent {
  messageId: string;
  conversationId: string;
  status: MessageDeliveryStatus;
  externalMessageId?: string | null;
  errorMessage?: string | null;
}

export interface WhatsAppBaseTemplate {
  id: string | null;
  channelConfigId: string | null;
  templateId: string | null; // ID oficial asignado por Meta
  name: string; // Nombre técnico en Meta (ej. 'crm_inicio_conversacion')
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string; // 'es', 'es_MX', etc.
  bodyText: string; // Por defecto: "Hola {{1}}"
  headerText?: string | null;
  footerText?: string | null;
  components?: any[] | null;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
  isBase: boolean;
  resolvedVariables?: Record<number, string>;
  contact?: {
    id?: string | null;
    name?: string;
    company?: string;
    agent?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertBaseTemplateDto {
  name?: string; // Opcional, por defecto 'crm_inicio_conversacion'
  bodyText: string; // "Hola {{1}}" o texto personalizado
  category?: string; // 'UTILITY' (recomendado) o 'MARKETING'
  language?: string; // 'es'
  headerText?: string;
  footerText?: string;
}

export interface SelectExistingBaseTemplateDto {
  templateName: string;
  templateId?: string;
  language?: string;
  category?: string;
  bodyText?: string;
}
