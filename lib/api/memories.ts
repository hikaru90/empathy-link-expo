/**
 * API client for memories endpoints
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';

const API_BASE = API_BASE_URL;

/**
 * Helper to make authenticated fetch requests using Better Auth
 */
async function authenticatedFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);

  if (result.error) {
    throw new Error(result.error.message || result.error);
  }

  return result.data as T;
}

export interface Memory {
  id: string;
  userId: string;
  confidence: 'certain' | 'likely' | 'uncertain';
  type: string;
  priority: number;
  key: string | null;
  value: string;
  chatId: string | null;
  relevanceScore: number;
  accessCount: number;
  lastAccessed: string | null;
  expiresAt: string | null;
  created: string;
  updated: string;
}

export interface StatsResponse {
  analyses: any[];
  memories: Memory[];
}

/**
 * Get all memories for the current user (via stats endpoint)
 */
export async function getMemories(): Promise<Memory[]> {
  try {
    const response = await authenticatedFetch<StatsResponse>(
      `${API_BASE}/api/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.memories;
  } catch (error) {
    console.error('Failed to fetch memories:', error);
    throw error;
  }
}
