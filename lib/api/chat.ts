/**
 * API client for chat endpoints
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';

const API_BASE = API_BASE_URL;

/**
 * Helper to make authenticated fetch requests using Better Auth
 * Better Auth's $fetch returns {data, error} format, not a Response object
 */
async function authenticatedFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);

  // Better Auth returns {data: ..., error: ...}
  if (result.error) {
    const err = result.error as { message?: string; error?: string; status?: number; statusCode?: number };
    const errorMessage = typeof result.error === 'string'
      ? result.error
      : err?.message || JSON.stringify(result.error);

    const error = new Error(errorMessage);
    if (err?.status) (error as Error & { status: number }).status = err.status;
    if (err?.statusCode) (error as Error & { statusCode: number }).statusCode = err.statusCode;
    if (err?.error) (error as Error & { code?: string }).code = err.error;

    throw error;
  }

  return result.data as T;
}

export interface HistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: number;
  hidden?: boolean;
  pathMarker?: PathMarker;
}

export interface PathMarker {
  type: 'path_start' | 'path_end' | 'path_switch';
  path: string;
  timestamp: number;
  previousPath?: string;
}

export interface PathState {
  activePath: string | null;
  pathHistory: string[];
  startedAt: number;
  lastSwitch?: number;
}

export interface InitChatRequest {
  locale: string;
  initialPath?: string;
}

export interface InitChatResponse {
  chatId: string;
  systemInstruction: string;
  activePath: string;
  pathState: PathState;
  history: HistoryEntry[];
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
  history: HistoryEntry[];
}

export interface SendMessageResponse {
  response: string;
  timestamp: number;
  history: HistoryEntry[];
  pathSwitched: boolean;
}

export interface GetLatestChatResponse {
  chatId: string;
  systemInstruction: string;
  activePath: string;
  pathState: PathState;
  history: HistoryEntry[];
}

export interface Feeling {
  id: string;
  nameDE: string;
  nameEN: string;
  category: string;
  positive: boolean;
  sort: number;
}

export interface Need {
  id: string;
  nameDE: string;
  nameEN: string;
  category: string;
  categoryDE?: string;
  sort: number;
}

/**
 * Initialize a new chat session
 */
export async function initChat(data: InitChatRequest): Promise<InitChatResponse> {
  return authenticatedFetch<InitChatResponse>(`${API_BASE}/api/ai/bullshift/initChat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Send a message in an existing chat
 */
export async function sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
  return authenticatedFetch<SendMessageResponse>(`${API_BASE}/api/ai/bullshift/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Get the latest active chat session
 */
export async function getLatestChat(): Promise<GetLatestChatResponse | null> {
  try {
    const result = await authenticatedFetch<GetLatestChatResponse>(`${API_BASE}/api/ai/bullshift/getLatestChat`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Validate the response has required fields
    if (!result || !result.chatId) {
      console.warn('getLatestChat returned invalid data:', result);
      return null;
    }

    return result;
  } catch (error: any) {
    // If 404 or no active chat, return null (this is expected for fresh accounts)
    const statusCode = error?.status || error?.statusCode;
    if (statusCode === 404 || error?.message?.includes('404') || error?.message?.includes('No active chat')) {
      console.log('No active chat found (this is normal for fresh accounts)');
      return null;
    }
    throw error;
  }
}

/**
 * Get chat history (optional - for refresh)
 */
export async function getChatHistory(chatId: string): Promise<{ history: HistoryEntry[]; pathState: PathState }> {
  return authenticatedFetch<{ history: HistoryEntry[]; pathState: PathState }>(`${API_BASE}/api/ai/bullshift/getHistory?chatId=${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get all feelings
 */
export async function getFeelings(): Promise<Feeling[]> {
  const data = await authenticatedFetch<{ feelings: Feeling[] }>(`${API_BASE}/api/data/feelings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data.feelings;
}

/**
 * Get all needs
 */
export async function getNeeds(): Promise<Need[]> {
  const data = await authenticatedFetch<{ needs: Need[] }>(`${API_BASE}/api/data/needs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data.needs;
}

export interface AnalysisResponse {
  analysis: {
    id: string;
    title: string;
    observation?: string;
    feelings?: string[];
    needs?: string[];
    request?: string;
    created: string;
  };
  initiatedChat: {
    chatId: string;
    history: HistoryEntry[];
  };
}

/**
 * Analyze a completed chat
 */
export async function analyzeChat(chatId: string, locale: string): Promise<AnalysisResponse> {
  try {
    return await authenticatedFetch<AnalysisResponse>(`${API_BASE}/api/ai/bullshift/analyzeChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, locale }),
    });
  } catch (error) {
    // Check if this is a 404 (endpoint not implemented)
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('Chat-Analyse Endpunkt ist noch nicht implementiert. Bitte implementiere POST /api/ai/bullshift/analyzeChat im Backend.');
    }
    throw error;
  }
}

/**
 * Update chat history (for reopening chats)
 */
export async function updateChatHistory(
  chatId: string,
  history: HistoryEntry[],
  pathState?: PathState
): Promise<{ success: boolean }> {
  return authenticatedFetch<{ success: boolean }>(`${API_BASE}/api/ai/bullshift/updateHistory`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatId, history, pathState }),
  });
}

/**
 * Extract memories from chat history
 */
export async function extractMemories(): Promise<{ success: boolean }> {
  return authenticatedFetch<{ success: boolean }>(`${API_BASE}/api/ai/bullshift/extractMemories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
}

export interface ChatSettings {
  aiAnswerLength: 'short' | 'medium' | 'long';
  toneOfVoice: 'heartfelt' | 'analytical';
  nvcKnowledge: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Get user chat settings
 */
export async function getChatSettings(): Promise<ChatSettings> {
  return authenticatedFetch<ChatSettings>(`${API_BASE}/api/user/chat-settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Update user chat settings
 */
export async function updateChatSettings(settings: ChatSettings): Promise<{ success: boolean; message?: string }> {
  return authenticatedFetch<{ success: boolean; message?: string }>(`${API_BASE}/api/user/chat-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
}
