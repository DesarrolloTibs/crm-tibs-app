import axiosInstance from "@core/axios/axiosInstance";
import { PIPELINES } from "@/global/endpoints";
import type { Stage } from "@core/models/Opportunity";
import { configStore } from "@/store/useConfigStore";

export interface Pipeline {
  id: string;
  strname: string;
  strdescription: string | null;
  blnstatus: boolean;
  stages: Stage[];
}

let mainPipelineCache: Record<string, { data: Pipeline; timestamp: number }> = {};
let pendingMainPipelinePromises: Record<string, Promise<Pipeline>> = {};

let pipelinesListCache: Record<string, { data: Pipeline[]; timestamp: number }> = {};
let pendingPipelinesListPromises: Record<string, Promise<Pipeline[]>> = {};

export const clearPipelinesCache = () => {
  mainPipelineCache = {};
  pipelinesListCache = {};
};

export const getMainPipeline = async (forceRefresh = false): Promise<Pipeline> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && mainPipelineCache[currentSchema] && now - mainPipelineCache[currentSchema].timestamp < 3000) {
    return mainPipelineCache[currentSchema].data;
  }

  if (currentSchema in pendingMainPipelinePromises) {
    return pendingMainPipelinePromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get<Pipeline>(`${PIPELINES.PIPELINES}/main`);
      const raw = (response.data as any)?.data ?? response.data;
      const data = raw as Pipeline;
      mainPipelineCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingMainPipelinePromises[currentSchema];
    }
  })();

  pendingMainPipelinePromises[currentSchema] = promise;
  return promise;
};

export const getActiveStages = async (): Promise<Stage[]> => {
  const response = await axiosInstance.get<Stage[]>(`${PIPELINES.PIPELINES}/main/stages/active`);
  return Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
};

export interface UpdateMainPipelineStagePayload {
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

export interface UpdateMainPipelinePayload {
  strname?: string;
  strdescription?: string | null;
  blnstatus?: boolean;
  stages?: UpdateMainPipelineStagePayload[];
}

const sanitizePipelineStage = (
  stage: Partial<Stage> & { bln_show_dashboard?: boolean }
): UpdateMainPipelineStagePayload => {
  const clean: UpdateMainPipelineStagePayload = {
    strname: (stage.strname || '').trim(),
    blnstatus: Boolean(stage.blnstatus),
    display_order: Math.trunc(Number(stage.display_order ?? 0)),
    strcolor: stage.strcolor ?? '#3b82f6',
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

export const updateMainPipeline = async (
  data: Partial<Omit<Pipeline, 'stages'>> & { stages?: Partial<Stage>[] }
): Promise<Pipeline> => {
  const payload: UpdateMainPipelinePayload = {};
  if (data.strname !== undefined) payload.strname = data.strname.trim();
  if (data.strdescription !== undefined) {
    payload.strdescription =
      typeof data.strdescription === 'string' ? data.strdescription.trim() : data.strdescription;
  }
  if (data.blnstatus !== undefined) payload.blnstatus = Boolean(data.blnstatus);
  if (Array.isArray(data.stages)) {
    payload.stages = data.stages.map(sanitizePipelineStage);
  }

  const response = await axiosInstance.patch<Pipeline>(`${PIPELINES.PIPELINES}/main`, payload);
  clearPipelinesCache();
  return response.data;
};

export const getPipelines = async (forceRefresh = false): Promise<Pipeline[]> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && pipelinesListCache[currentSchema] && now - pipelinesListCache[currentSchema].timestamp < 3000) {
    return pipelinesListCache[currentSchema].data;
  }

  if (currentSchema in pendingPipelinesListPromises) {
    return pendingPipelinesListPromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get<Pipeline[]>(`${PIPELINES.PIPELINES}`);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Pipeline[];
      pipelinesListCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingPipelinesListPromises[currentSchema];
    }
  })();

  pendingPipelinesListPromises[currentSchema] = promise;
  return promise;
};
