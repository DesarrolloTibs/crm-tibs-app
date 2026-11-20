import axiosInstance from "@core/axios/axiosInstance";
import { HELPDESKS, TICKETS } from "@/global/endpoints";
import type { Helpdesk, TicketStage, Ticket } from "@core/models/Ticket";
import { configStore } from "@/store/useConfigStore";

let ticketsCache: Record<string, { data: Ticket[]; timestamp: number }> = {};
let pendingTicketsPromises: Record<string, Promise<Ticket[]>> = {};

let helpdeskCache: Record<string, { data: Helpdesk; timestamp: number }> = {};
let pendingHelpdeskPromises: Record<string, Promise<Helpdesk>> = {};

export const clearTicketsCache = () => {
  ticketsCache = {};
  helpdeskCache = {};
};

/**
 * Obtiene la mesa de ayuda principal con sus etapas.
 */
export const getMainHelpdesk = async (forceRefresh = false): Promise<Helpdesk> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && helpdeskCache[currentSchema] && now - helpdeskCache[currentSchema].timestamp < 3000) {
    return helpdeskCache[currentSchema].data;
  }

  if (currentSchema in pendingHelpdeskPromises) {
    return pendingHelpdeskPromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get<Helpdesk>(`${HELPDESKS.HELPDESKS}/main`);
      const raw = (response.data as any)?.data ?? response.data;
      const data = raw as Helpdesk;
      helpdeskCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingHelpdeskPromises[currentSchema];
    }
  })();

  pendingHelpdeskPromises[currentSchema] = promise;
  return promise;
};

export interface UpdateMainHelpdeskStagePayload {
  id?: string;
  strname: string;
  blnstatus: boolean;
  display_order: number;
  strcolor?: string | null;
  blninitial: boolean;
  intmaxdays?: number | null;
  bln_show_dashboard?: boolean;
  stage_type?: number;
}

export interface UpdateMainHelpdeskPayload {
  strname?: string;
  strdescription?: string | null;
  stages?: UpdateMainHelpdeskStagePayload[];
}

const sanitizeHelpdeskStage = (
  stage: Partial<TicketStage> & { bln_show_dashboard?: boolean }
): UpdateMainHelpdeskStagePayload => {
  const clean: UpdateMainHelpdeskStagePayload = {
    strname: (stage.strname || '').trim(),
    blnstatus: Boolean(stage.blnstatus),
    display_order: Math.trunc(Number(stage.display_order ?? 0)),
    strcolor: stage.strcolor ?? '#6366f1',
    blninitial: Boolean(stage.blninitial),
    stage_type: Number(stage.stage_type ?? 0),
    intmaxdays:
      stage.intmaxdays !== undefined && stage.intmaxdays !== null
        ? Math.trunc(Number(stage.intmaxdays))
        : null,
  };

  if (stage.id && !stage.id.startsWith('temp-')) {
    clean.id = stage.id;
  }
  if (stage.bln_show_dashboard !== undefined) {
    clean.bln_show_dashboard = Boolean(stage.bln_show_dashboard);
  }

  return clean;
};

/**
 * Actualiza la mesa de ayuda principal y su lista de etapas.
 */
export const updateMainHelpdesk = async (
  data: Partial<Omit<Helpdesk, 'stages'>> & { stages?: Partial<TicketStage>[] }
): Promise<Helpdesk> => {
  const payload: UpdateMainHelpdeskPayload = {};
  if (data.strname !== undefined) payload.strname = data.strname.trim();
  if (data.strdescription !== undefined) {
    payload.strdescription =
      typeof data.strdescription === 'string' ? data.strdescription.trim() : data.strdescription;
  }
  if (Array.isArray(data.stages)) {
    payload.stages = data.stages.map(sanitizeHelpdeskStage);
  }

  const response = await axiosInstance.patch<Helpdesk>(`${HELPDESKS.HELPDESKS}/main`, payload);
  clearTicketsCache();
  return response.data;
};

/**
 * Obtiene las etapas activas de la mesa de ayuda principal.
 */
export const getActiveTicketStages = async (): Promise<TicketStage[]> => {
  const response = await axiosInstance.get<TicketStage[]>(`${HELPDESKS.HELPDESKS}/main/stages/active`);
  return Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
};

/**
 * Obtiene la lista de todos los tickets (con filtro opcional de etapa y archivado).
 */
export const getTickets = async (stage_id?: string, showArchived = false, forceRefresh = false): Promise<Ticket[]> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const params = new URLSearchParams();
  if (stage_id) params.append('stage_id', stage_id);
  params.append('showArchived', String(showArchived));
  const queryStr = params.toString();
  const cacheKey = `${currentSchema}:${queryStr}`;
  const now = Date.now();

  if (!forceRefresh && ticketsCache[cacheKey] && now - ticketsCache[cacheKey].timestamp < 3000) {
    return ticketsCache[cacheKey].data;
  }

  if (cacheKey in pendingTicketsPromises) {
    return pendingTicketsPromises[cacheKey];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get<Ticket[]>(`${TICKETS.TICKETS}?${queryStr}`);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Ticket[];
      ticketsCache[cacheKey] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingTicketsPromises[cacheKey];
    }
  })();

  pendingTicketsPromises[cacheKey] = promise;
  return promise;
};

/**
 * Archiva o desarchiva un ticket.
 */
export const archiveTicket = async (id: string, archived: boolean): Promise<void> => {
  await axiosInstance.patch(`${TICKETS.TICKETS}/${id}/archive`, { archived });
};

/**
 * Obtiene un ticket por su ID.
 */
export const getTicket = async (id: string): Promise<Ticket> => {
  const response = await axiosInstance.get<Ticket>(`${TICKETS.TICKETS}/${id}`);
  return response.data;
};

/**
 * Registra un nuevo ticket (puede ser público o interno).
 */
export const createTicket = async (ticketData: Partial<Ticket> & { companyName?: string }): Promise<Ticket> => {
  const response = await axiosInstance.post<Ticket>(TICKETS.TICKETS, ticketData);
  return response.data;
};

/**
 * Actualiza un ticket existente (estado, asignación, notas, etc.).
 */
export const updateTicket = async (id: string, ticketData: Partial<Ticket>): Promise<Ticket> => {
  const response = await axiosInstance.patch<Ticket>(`${TICKETS.TICKETS}/${id}`, ticketData);
  return response.data;
};

/**
 * Elimina un ticket de la base de datos.
 */
export const deleteTicket = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${TICKETS.TICKETS}/${id}`);
};

/**
 * Consulta pública de tickets por correo o número de ticket.
 */
export const queryTicketsPublic = async (params: { email?: string; ticketNumber?: string }): Promise<Ticket[]> => {
  const queryParams = new URLSearchParams();
  if (params.email) queryParams.append('email', params.email);
  if (params.ticketNumber) queryParams.append('ticketNumber', params.ticketNumber);
  
  const response = await axiosInstance.get<Ticket[]>(`${TICKETS.TICKETS}/public/query?${queryParams.toString()}`);
  return response.data;
};

export const getHelpdesks = async (): Promise<Helpdesk[]> => {
  const response = await axiosInstance.get<Helpdesk[]>(`${HELPDESKS.HELPDESKS}`);
  return Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
};
