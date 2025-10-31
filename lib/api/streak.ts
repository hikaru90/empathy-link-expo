/**
 * API client for streak endpoints
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
    throw new Error(result.error.message || result.error);
  }

  return result.data as T;
}

export interface StreakData {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastChatDate: string | null;
  totalChatsCompleted: number;
  chatDates: string[];
  created: string;
  updated: string;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastChatDate: string | null;
  totalChatsCompleted: number;
  chatDates: string[];
}

/**
 * Get current streak data for the authenticated user
 */
export async function getStreak(): Promise<StreakResponse> {
  return authenticatedFetch<StreakResponse>(`${API_BASE}/api/streaks`, {
    method: 'GET',
  });
}

/**
 * Update streak after chat completion
 * This is typically called internally after a chat is analyzed
 */
export async function updateStreak(completionDate?: Date): Promise<StreakData> {
  return authenticatedFetch<StreakData>(`${API_BASE}/api/streaks/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      completionDate: completionDate?.toISOString(),
    }),
  });
}

/**
 * Backfill streak data from existing chat history
 * This can be called once to populate historical streak data
 */
export async function backfillStreak(): Promise<{ message: string; streak: StreakData }> {
  return authenticatedFetch<{ message: string; streak: StreakData }>(
    `${API_BASE}/api/streaks/backfill`,
    {
      method: 'POST',
    }
  );
}
