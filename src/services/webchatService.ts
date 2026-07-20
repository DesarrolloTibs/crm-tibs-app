import axiosInstance from '../core/axios/axiosInstance';

const urlBase = (import.meta.env.VITE_BASE_URL || 'http://localhost:3091') + '/api/webchat';

export interface WebChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface DashboardRedirect {
    tab?: string;
    executiveId?: string;
    dateStart?: string;
    dateEnd?: string;
    pipelineId?: string;
    helpdeskId?: string;
}

export interface WebChatResponse {
    answer: string;
    data?: Record<string, any>[];
    dashboardRedirect?: DashboardRedirect | null;
}

export async function queryWebChat(
    question: string,
    conversationHistory?: WebChatMessage[]
): Promise<WebChatResponse> {
    const response = await axiosInstance.post<WebChatResponse>(
        `${urlBase}/query`,
        { question, conversationHistory },
        { timeout: 60000 }
    );
    return response.data;
}
