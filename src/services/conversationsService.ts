import axiosInstance from '../core/axios/axiosInstance';

const urlBase = (import.meta.env.VITE_BASE_URL || 'http://localhost:3091') + '/api/conversations';

export async function getConversations(): Promise<any[]> {
    const response = await axiosInstance.get(urlBase);
    return response.data;
}

export async function getConversationMessages(id: string): Promise<any[]> {
    const response = await axiosInstance.get(`${urlBase}/${id}/messages`);
    return response.data;
}

export async function sendMessage(id: string, content: string): Promise<any> {
    const response = await axiosInstance.post(`${urlBase}/${id}/messages`, { content });
    return response.data;
}

export async function toggleBotStatus(id: string, botActive: boolean): Promise<any> {
    const response = await axiosInstance.patch(`${urlBase}/${id}/bot-status`, { botActive });
    return response.data;
}

export async function assignConversation(id: string, assignedUserId: string): Promise<any> {
    const response = await axiosInstance.patch(`${urlBase}/${id}/assign`, { assignedUserId });
    return response.data;
}

export async function getAiAgentConfig(): Promise<any> {
    const response = await axiosInstance.get(`${urlBase}/ai-config`);
    return response.data;
}

export async function saveAiAgentConfig(config: any): Promise<any> {
    const response = await axiosInstance.post(`${urlBase}/ai-config`, config);
    return response.data;
}

export async function simulateIncomingMessage(channel: string, externalId: string, clientNickname: string, text: string): Promise<any> {
    const response = await axiosInstance.post(`${urlBase}/test-receive`, {
        channel,
        externalId,
        clientNickname,
        text
    });
    return response.data;
}
