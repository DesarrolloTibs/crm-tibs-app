
import axiosInstance from '../core/axios/axiosInstance';
import type { Activity } from '../core/models/Activity';
import { ACTIVITIES } from '../global/endpoints';


export async function getActivities(params?: { userId?: string; opportunityId?: string }): Promise<Activity[]> {
    const response = await axiosInstance.get(ACTIVITIES.ACTIVITIES, { params });
    return response.data;
}

export async function createActivity(activity: Partial<Activity>): Promise<Activity> {
    const response = await axiosInstance.post(ACTIVITIES.ACTIVITIES, activity);
    return response.data;
}

export async function updateActivity(id: string, activity: Partial<Activity>): Promise<Activity> {
    const response = await axiosInstance.patch(`${ACTIVITIES.ACTIVITIES}/${id}`, activity);
    return response.data;
}

export async function deleteActivity(id: string): Promise<void> {
    await axiosInstance.delete(`${ACTIVITIES.ACTIVITIES}/${id}`);
}
