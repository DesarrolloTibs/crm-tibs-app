import axiosInstance from "../core/axios/axiosInstance";
import { PIPELINES } from "../global/endpoints";
import type { Stage } from "../core/models/Opportunity";
import { configStore } from "../store/useConfigStore";

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

export const updateMainPipeline = async (data: Partial<Pipeline>): Promise<Pipeline> => {
  const response = await axiosInstance.patch<Pipeline>(`${PIPELINES.PIPELINES}/main`, data);
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
