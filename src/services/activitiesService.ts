
import axiosInstance from '../core/axios/axiosInstance';
import type { Activity, TypeActivity } from '../core/models/Activity';
import { ACTIVITIES } from '../global/endpoints';


export async function getActivities(params?: { userId?: string; opportunityId?: string }): Promise<Activity[]> {
    const response = await axiosInstance.get(ACTIVITIES.ACTIVITIES, { params });
    return response.data;
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
