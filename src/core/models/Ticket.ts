import type { Client } from './Client';
import type { User } from './User';

export interface Helpdesk {
  id: string;
  strname: string;
  strdescription: string | null;
  blnstatus: boolean;
  dtmcreated: string;
  dtmlastmodified: string;
  stages?: TicketStage[];
}

export interface TicketStage {
  id: string;
  strname: string;
  blnstatus: boolean;
  helpdesk_id: string;
  display_order: number;
  strcolor: string | null;
  blninitial: boolean;
  intmaxdays: number | null;
  dtmcreated: string;
  dtmlastmodified: string;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  strtitle: string;
  tipo_incidencia: string;
  description: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  notas_resolucion: string | null;
  priority: number;
  alert_sent: boolean;
  archived?: boolean;
  cliente_id: string | null;
  cliente: Client | null;
  responsable_id: string | null;
  responsable: User | null;
  helpdesk_id: string;
  stage_id: string;
  stage?: TicketStage;
  stage_entered_at: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}
