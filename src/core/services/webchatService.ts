import axiosInstance from '@core/axios/axiosInstance';

const urlBase = (import.meta.env.VITE_BASE_URL || '') + '/api/webchat';

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

export interface WebChatTranscribeResponse {
    text: string;
    transcript: string;
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

export async function transcribeWebChatAudio(
    audioBlob: Blob
): Promise<WebChatTranscribeResponse> {
    const mime = (audioBlob.type || '').toLowerCase();
    let ext = 'webm';
    if (mime.includes('mp4') || mime.includes('m4a')) ext = 'mp4';
    else if (mime.includes('ogg')) ext = 'ogg';
    else if (mime.includes('wav')) ext = 'wav';

    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-note.${ext}`);

    const response = await axiosInstance.post<WebChatTranscribeResponse>(
        `${urlBase}/transcribe`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000,
        }
    );
    return response.data;
}
