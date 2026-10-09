import * as yup from 'yup';
import type { ChannelConfig } from '../../../../core/models/Conversation';

export type { ChannelConfig };

/**
 * Modelo de Sub-Agente especializado
 */
export interface SubAgent {
  id?: string;
  key: string;
  name: string;
  description: string;
  context: string;
  tools: string[];
  temperature?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Catálogo de herramientas del CRM asignables a los Sub-Agentes
 */
export interface AgentToolDefinition {
  key: string;
  label: string;
  desc: string;
}

export const AVAILABLE_TOOLS: AgentToolDefinition[] = [
  { key: 'createOpportunity', label: 'Crear Oportunidad', desc: 'Registra oportunidades de venta en el CRM.' },
  { key: 'modifyOpportunity', label: 'Modificar Oportunidad', desc: 'Edita etapas y montos de oportunidades.' },
  { key: 'registerContact', label: 'Registrar Contacto', desc: 'Crea clientes y prospectos en el sistema.' },
  { key: 'updateContact', label: 'Actualizar Contacto', desc: 'Edita la información de la ficha del cliente.' },
  { key: 'checkAvailability', label: 'Consultar Disponibilidad', desc: 'Verifica la agenda de citas del asesor.' },
  { key: 'createActivity', label: 'Crear Actividad', desc: 'Programa reuniones, llamadas o recordatorios.' },
  { key: 'createTicket', label: 'Crear Ticket de Soporte', desc: 'Levanta reportes en la mesa de ayuda.' },
  { key: 'consult_product_catalog', label: 'Consultar Catálogo de Productos', desc: 'Consulta especificaciones técnicas, compatibilidad, disponibilidad y precios de productos en Cube.dev y RAG.' },
];

/**
 * Opciones de recordatorio previo por defecto
 */
export const REMINDER_OFFSET_OPTIONS = [
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes (Predeterminado)' },
  { value: 120, label: '2 horas antes' },
  { value: 180, label: '3 horas antes' },
  { value: 1440, label: '24 horas antes' },
];

/**
 * Esquema Yup para la configuración general del Agente IA y del Tenant
 */
export const aiAgentConfigValidationSchema = yup.object().shape({
  isActive: yup.boolean().default(true),
  temperature: yup
    .number()
    .min(0, 'La temperatura mínima es 0.0')
    .max(1, 'La temperatura máxima es 1.0')
    .default(0.7),
  historyMessageLimit: yup
    .number()
    .typeError('El límite de mensajes debe ser un número')
    .integer('Debe ser un número entero')
    .min(3, 'El límite mínimo de historial es de 3 mensajes')
    .max(50, 'El límite máximo de historial es de 50 mensajes')
    .default(10),
  defaultUserId: yup.string().nullable().default(null),
  reminderOffsetMinutes: yup.number().default(60),
});

export type AiAgentConfigFormData = yup.InferType<typeof aiAgentConfigValidationSchema>;

/**
 * Esquema Yup para el Prompt del Agente Enrutador Principal (Router)
 */
export const routerPromptValidationSchema = yup.object().shape({
  context: yup
    .string()
    .trim()
    .required('Las directivas e instrucciones de enrutamiento son obligatorias')
    .min(10, 'El prompt debe tener al menos 10 caracteres para ser descriptivo'),
});

export type RouterPromptFormData = yup.InferType<typeof routerPromptValidationSchema>;

/**
 * Esquema Yup para creación y edición de Sub-Agentes
 */
export const subAgentValidationSchema = yup.object().shape({
  key: yup
    .string()
    .trim()
    .required('La clave única del agente es obligatoria')
    .matches(/^[a-z0-9_]+$/, 'Solo se permiten letras minúsculas, números y guiones bajos (sin espacios ni acentos)')
    .min(2, 'La clave debe tener al menos 2 caracteres')
    .max(50, 'La clave no debe superar 50 caracteres'),
  name: yup
    .string()
    .trim()
    .required('El nombre del sub-agente es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no debe superar 80 caracteres'),
  description: yup
    .string()
    .trim()
    .required('La descripción para el enrutamiento es obligatoria')
    .min(5, 'La descripción debe guiar claramente al enrutador (mínimo 5 caracteres)')
    .max(300, 'La descripción no debe exceder 300 caracteres'),
  context: yup
    .string()
    .trim()
    .required('Las instrucciones de comportamiento (Prompt) son obligatorias')
    .min(10, 'El prompt del sub-agente debe contener al menos 10 caracteres'),
  temperature: yup
    .number()
    .min(0, 'Temperatura mínima: 0.0')
    .max(1, 'Temperatura máxima: 1.0')
    .default(0.7),
  tools: yup.array().of(yup.string().required()).default([]),
  isActive: yup.boolean().default(true),
});

export type SubAgentFormData = yup.InferType<typeof subAgentValidationSchema>;

/**
 * Esquema Yup para Credenciales de WhatsApp Cloud API
 */
export const whatsappChannelValidationSchema = yup.object().shape({
  channelName: yup
    .string()
    .trim()
    .required('El nombre descriptivo de la cuenta de WhatsApp es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  appId: yup.string().trim().nullable(),
  accountId: yup
    .string()
    .trim()
    .required('El WhatsApp Business Account ID (WABA ID) es obligatorio'),
  phoneNumberId: yup
    .string()
    .trim()
    .required('El Phone Number ID de WhatsApp Cloud API es obligatorio'),
  accessToken: yup
    .string()
    .trim()
    .required('El Token de Acceso Permanente es obligatorio'),
  verifyToken: yup
    .string()
    .trim()
    .required('El Token de Verificación del Webhook es obligatorio')
    .min(3, 'El Verify Token debe tener al menos 3 caracteres'),
});

export type WhatsAppChannelFormData = yup.InferType<typeof whatsappChannelValidationSchema>;

/**
 * Filtro de estado para sub-agentes en vistas tabulares
 */
export type SubAgentStatusFilter = 'all' | 'active' | 'inactive';

export interface SubAgentFilterState {
  search: string;
  status: SubAgentStatusFilter;
}

/**
 * Estadísticas operativas del Agente IA y Canales
 */
export interface AiAgentStats {
  isAgentActive: boolean;
  totalSubAgents: number;
  activeSubAgents: number;
  inactiveSubAgents: number;
  totalChannels: number;
  hasWhatsApp: boolean;
  hasFacebook: boolean;
  hasInstagram: boolean;
  temperature: number;
  historyLimit: number;
}

/**
 * Estado unificado para el modal de notificaciones
 */
export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
