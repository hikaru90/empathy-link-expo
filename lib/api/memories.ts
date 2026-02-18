/**
 * API client for memories endpoints
 */

import { authClient } from '../auth';
import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

/**
 * Helper to make authenticated fetch requests using Better Auth
 */
async function authenticatedFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);

  if (result.error) {
    const error = result.error as any;
    throw new Error(error.message || (typeof error === 'string' ? error : 'Unknown error'));
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

/**
 * Delete a single memory by ID
 */
export async function deleteMemory(memoryId: string): Promise<{ success: boolean }> {
  try {
    console.log('[deleteMemory] Deleting memory with ID:', memoryId);
    const result = await authenticatedFetch<{ success: boolean }>(
      `${API_BASE}/api/memories/${memoryId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[deleteMemory] Delete result:', result);
    return result;
  } catch (error) {
    console.error('[deleteMemory] Failed to delete memory:', error);
    console.error('[deleteMemory] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      memoryId,
      url: `${API_BASE}/api/memories/${memoryId}`,
    });
    throw error;
  }
}

/**
 * Delete multiple memories by IDs
 */
export async function deleteMemories(memoryIds: string[]): Promise<{ success: boolean; deletedCount?: number }> {
  try {
    return await authenticatedFetch<{ success: boolean; deletedCount?: number }>(
      `${API_BASE}/api/memories/bulk`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: memoryIds }),
      }
    );
  } catch (error) {
    console.error('Failed to delete memories:', error);
    throw error;
  }
}
