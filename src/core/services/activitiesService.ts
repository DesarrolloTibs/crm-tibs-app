
import axiosInstance from '../core/axios/axiosInstance';
import type { Activity, TypeActivity } from '../core/models/Activity';
import { ACTIVITIES } from '../global/endpoints';
import { configStore } from '../store/useConfigStore';

let activitiesCache: Record<string, { data: Activity[]; timestamp: number }> = {};
let pendingActivitiesPromises: Record<string, Promise<Activity[]>> = {};

export const clearActivitiesCache = () => {
  activitiesCache = {};
};

export async function getActivities(params?: { userId?: string; opportunityId?: string }, forceRefresh = false): Promise<Activity[]> {
    const selectedTenant = configStore.getSelectedTenant();
    const currentSchema = selectedTenant?.schema_name || 'public';
    const cacheKey = `${currentSchema}:${params?.userId || ''}:${params?.opportunityId || ''}`;
    const now = Date.now();

    if (!forceRefresh && activitiesCache[cacheKey] && now - activitiesCache[cacheKey].timestamp < 3000) {
      return activitiesCache[cacheKey].data;
    }

    if (cacheKey in pendingActivitiesPromises) {
      return pendingActivitiesPromises[cacheKey];
    }

    const promise = (async () => {
      try {
        const response = await axiosInstance.get(ACTIVITIES.ACTIVITIES, { params });
        const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Activity[];
        activitiesCache[cacheKey] = { data, timestamp: Date.now() };
        return data;
      } finally {
        delete pendingActivitiesPromises[cacheKey];
      }
    })();

    pendingActivitiesPromises[cacheKey] = promise;
    return promise;
}

export async function createActivity(activity: Partial<Activity>): Promise<Activity> {
    const {
        id: _,
        user: _1,
        typeActivity: _2,
        opportunity: _3,
        client: _4,
        company: _5,
        contacts: _6,
        createdAt: _7,
        updatedAt: _8,
        userId: _9,
        ...cleanActivity
    } = activity as any;
    // reminder se incluye en cleanActivity para enviarlo al backend
    const response = await axiosInstance.post(ACTIVITIES.ACTIVITIES, cleanActivity);
    return response.data;
}

export async function updateActivity(id: string, activity: Partial<Activity>): Promise<Activity> {
    const {
        id: _,
        user: _1,
        typeActivity: _2,
        opportunity: _3,
        client: _4,
        company: _5,
        contacts: _6,
        createdAt: _7,
        updatedAt: _8,
        userId: _9,
        ...cleanActivity
    } = activity as any;
    // reminder se incluye en cleanActivity para enviarlo al backend
    const response = await axiosInstance.patch(`${ACTIVITIES.ACTIVITIES}/${id}`, cleanActivity);
    return response.data;
}

export async function deleteActivity(id: string): Promise<void> {
    await axiosInstance.delete(`${ACTIVITIES.ACTIVITIES}/${id}`);
}
export async function getActivitiesByOpportunity(params?: { opportunityId?: string }): Promise<Activity[]> {
    const response = await axiosInstance.get(ACTIVITIES.ACTIVITIES, { params });
    return response.data;
}

export async function getActivityTypes(): Promise<TypeActivity[]> {
    const response = await axiosInstance.get(`${ACTIVITIES.ACTIVITIES}/types`);
    return response.data;
}

export async function createActivityType(type: Partial<TypeActivity>): Promise<TypeActivity> {
    const response = await axiosInstance.post(`${ACTIVITIES.ACTIVITIES}/types`, type);
    return response.data;
}

export async function updateActivityType(id: number, type: Partial<TypeActivity>): Promise<TypeActivity> {
    const response = await axiosInstance.patch(`${ACTIVITIES.ACTIVITIES}/types/${id}`, type);
    return response.data;
}

export async function deleteActivityType(id: number): Promise<void> {
    await axiosInstance.delete(`${ACTIVITIES.ACTIVITIES}/types/${id}`);
}
