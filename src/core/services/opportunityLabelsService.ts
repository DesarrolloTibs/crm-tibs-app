import axiosInstance from "../core/axios/axiosInstance";
import type { OpportunityLabel } from "../core/models/OpportunityLabel";
import { OPPORTUNITY_LABELS } from "../global/endpoints";

export const getOpportunityLabels = async (): Promise<OpportunityLabel[]> => {
  const response = await axiosInstance.get<OpportunityLabel[]>(OPPORTUNITY_LABELS.OPPORTUNITY_LABELS);
  return response.data;
};

export const updateOpportunityLabel = async (id: string, strname: string): Promise<OpportunityLabel> => {
  const response = await axiosInstance.patch<OpportunityLabel>(
    `${OPPORTUNITY_LABELS.OPPORTUNITY_LABELS}/${id}`,
    { strname }
  );
  return response.data;
};
