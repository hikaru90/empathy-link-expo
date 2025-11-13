/**
 * API client for stats endpoints
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
    // Handle different error formats
    const errorMessage =
      result.error.message ||
      (typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
    throw new Error(errorMessage);
  }

  return result.data as T;
}

export interface InspirationalQuote {
  quote: string;
  author?: string;
}

/**
 * Get an inspirational quote
 */
export async function getInspirationalQuote(): Promise<InspirationalQuote> {
  return authenticatedFetch<InspirationalQuote>(`${API_BASE}/api/stats/inspirational-quote`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Generate and save a new inspirational quote for the user
 * This fetches a new quote from the endpoint, which should generate and save it to the user table
 */
export async function generateAndSaveQuote(): Promise<InspirationalQuote> {
  // The GET endpoint should generate a new quote and save it to the user table
  return getInspirationalQuote();
}

export interface SuperCommunicatorData {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
  recentPoints?: Array<{
    date: string;
    points: number;
    source: 'chat' | 'learning' | 'resolution';
  }>;
}

/**
 * Get super communicator progress data
 * This will calculate points from analyses and learning sessions
 */
export async function getSuperCommunicatorData(): Promise<SuperCommunicatorData | null> {
  try {
    return authenticatedFetch<SuperCommunicatorData>(`${API_BASE}/api/stats/super-communicator`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    // If endpoint doesn't exist yet, return null (frontend can calculate)
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      console.warn('Super communicator endpoint not yet implemented, using frontend calculation');
      return null;
    }
    throw error;
  }
}

export interface TrackedNeed {
  id: string;
  needId: string;
  needName: string;
  userId: string;
  created: string;
  updated: string;
}

export interface NeedFillLevel {
  id: string;
  trackedNeedId: string;
  fillLevel: number; // 0-100
  date: string;
  created: string;
}

export interface NeedTimeseriesData {
  id: string;
  date: Date;
  fillLevel: number;
  strategies?: string[];
}

/**
 * Get user's tracked needs (the 3 selected needs)
 */
export async function getTrackedNeeds(): Promise<TrackedNeed[]> {
  try {
    return authenticatedFetch<TrackedNeed[]>(`${API_BASE}/api/stats/tracked-needs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      return [];
    }
    throw error;
  }
}

/**
 * Save or update tracked needs (max 3)
 */
export async function saveTrackedNeeds(needIds: string[]): Promise<TrackedNeed[]> {
  if (needIds.length > 3) {
    throw new Error('Cannot track more than 3 needs');
  }
  return authenticatedFetch<TrackedNeed[]>(`${API_BASE}/api/stats/tracked-needs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ needIds }),
  });
}

/**
 * Delete a single tracked need by its ID
 */
export async function deleteTrackedNeed(trackedNeedId: string): Promise<{ success: boolean }> {
  return authenticatedFetch<{ success: boolean }>(
    `${API_BASE}/api/stats/tracked-needs/${trackedNeedId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Save a fill level for a tracked need
 */
export async function saveNeedFillLevel(
  trackedNeedId: string,
  fillLevel: number,
  date?: string
): Promise<NeedFillLevel> {
  if (fillLevel < 0 || fillLevel > 100) {
    throw new Error('Fill level must be between 0 and 100');
  }
  return authenticatedFetch<NeedFillLevel>(`${API_BASE}/api/stats/need-fill-level`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trackedNeedId, fillLevel, date }),
  });
}

/**
 * Get current fill levels for all tracked needs
 */
export async function getCurrentFillLevels(): Promise<Record<string, number>> {
  try {
    return authenticatedFetch<Record<string, number>>(`${API_BASE}/api/stats/need-fill-levels/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      return {};
    }
    throw error;
  }
}

/**
 * Get current fill levels with last updated timestamps for all tracked needs
 */
export async function getCurrentFillLevelsWithTimestamps(): Promise<Record<string, { fillLevel: number; lastUpdated: string | null }>> {
  try {
    return authenticatedFetch<Record<string, { fillLevel: number; lastUpdated: string | null }>>(`${API_BASE}/api/stats/need-fill-levels/current-with-timestamps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    // Silently handle 404 - endpoint doesn't exist yet
    if (error?.message?.includes('404') || error?.message?.includes('not found') || error?.status === 404) {
      // Fallback: try to get just fill levels without timestamps
      try {
        const levels = await getCurrentFillLevels();
        const result: Record<string, { fillLevel: number; lastUpdated: string | null }> = {};
        Object.entries(levels).forEach(([key, value]) => {
          result[key] = { fillLevel: value, lastUpdated: null };
        });
        return result;
      } catch {
        return {};
      }
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Save all fill levels as a snapshot for today
 * This saves all three fill levels at once with today's date
 */
export async function saveFillLevelsSnapshot(
  fillLevels: Record<string, number>
): Promise<{ date: string; saved: NeedFillLevel[]; count: number }> {
  return authenticatedFetch<{ date: string; saved: NeedFillLevel[]; count: number }>(
    `${API_BASE}/api/stats/need-fill-levels/snapshot`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fillLevels }),
    }
  );
}

/**
 * Get timeseries data for a tracked need
 */
export async function getNeedTimeseries(
  trackedNeedId: string,
  startDate?: string,
  endDate?: string
): Promise<NeedTimeseriesData[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const url = `${API_BASE}/api/stats/need-timeseries/${trackedNeedId}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const data = await authenticatedFetch<Array<{ id: string; date: string; fillLevel: number; strategies?: string[] }>>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return data.map(item => ({
      id: item.id,
      date: new Date(item.date),
      fillLevel: item.fillLevel,
      strategies: item.strategies || [],
    }));
  } catch (error: any) {
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      return [];
    }
    throw error;
  }
}

/**
 * Update strategies for a fill level entry
 */
export async function updateFillLevelStrategies(
  fillLevelId: string,
  strategies: string[]
): Promise<{ id: string; strategies: string[] }> {
  return authenticatedFetch<{ id: string; strategies: string[] }>(
    `${API_BASE}/api/stats/need-fill-levels/${fillLevelId}/strategies`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ strategies }),
    }
  );
}

export interface BlindSpotInsight {
  id?: string;
  analysis: string;
  patterns: string[];
  situations: string[];
  advice: string;
  created?: string;
  hasInsight: boolean;
  message?: string;
  canGenerateNew?: boolean;
  nextAvailableDate?: string;
  daysUntilNext?: number;
  isAdmin?: boolean;
}

/**
 * Get blind spots analysis
 * This endpoint analyzes chats and memories to identify recurring patterns and blind spots
 * It will only generate a new insight if a new chat was created after the last analysis
 */
export async function getBlindSpotsAnalysis(): Promise<BlindSpotInsight> {
  try {
    return authenticatedFetch<BlindSpotInsight>(`${API_BASE}/api/stats/blind-spots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      return {
        analysis: '',
        patterns: [],
        situations: [],
        advice: '',
        hasInsight: false,
        message: 'Starte deine erste Konversation, um Muster und Blind Spots zu erkennen.'
      };
    }
    throw error;
  }
}

/**
 * Force generate a new blind spots analysis
 * Admins can bypass the weekly limit
 */
export async function generateBlindSpotsAnalysis(): Promise<BlindSpotInsight> {
  try {
    const result = await authClient.$fetch(`${API_BASE}/api/stats/blind-spots/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (result.error) {
      // Extract the user-friendly message if available
      const errorData = result.error as any;
      const errorMessage = errorData?.message || errorData || 'Fehler beim Erstellen der Analyse';
      throw new Error(errorMessage);
    }

    return result.data as BlindSpotInsight;
  } catch (error: any) {
    // If it's already an Error object, just re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, create a new error with a user-friendly message
    throw new Error('Fehler beim Erstellen der Analyse');
  }
}
