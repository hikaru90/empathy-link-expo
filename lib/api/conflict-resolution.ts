/**
 * API client for conflict resolution endpoints
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';

const API_BASE = API_BASE_URL;

/**
 * Helper to make authenticated fetch requests using Better Auth
 */
async function authenticatedFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);

  if ((result as any).error) {
    const errorMessage = typeof (result as any).error === 'string'
      ? (result as any).error
      : (result as any).error?.message || 'Unknown error';
    throw new Error(errorMessage);
  }

  return (result as any).data as T;
}

export interface ConflictResolution {
  id: string;
  analysisId: string;
  request: string;
  resolutionDate?: string;
  reminderEnabled: boolean;
  reminderDate?: string;
  resolved: boolean;
  archived?: boolean;
  created: string;
  updated: string;
}

/**
 * Create or update a conflict resolution
 */
export async function upsertConflictResolution(
  analysisId: string,
  request: string,
  resolutionDate?: string,
  reminderEnabled?: boolean
): Promise<ConflictResolution> {
  return authenticatedFetch<ConflictResolution>(
    `${API_BASE}/api/conflict-resolutions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId,
        request,
        resolutionDate,
        reminderEnabled,
      }),
    }
  );
}

/**
 * Get all conflict resolutions for the current user
 */
export async function getConflictResolutions(): Promise<ConflictResolution[]> {
  try {
    const data = await authenticatedFetch<any>(
      `${API_BASE}/api/conflict-resolutions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.resolutions)) {
      return data.resolutions;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // If no array found, return empty array (endpoint might not exist yet)
    return [];
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array instead of throwing
    console.warn('Conflict resolutions endpoint not available:', error);
    return [];
  }
}

/**
 * Update a conflict resolution
 */
export async function updateConflictResolution(
  id: string,
  updates: {
    resolutionDate?: string;
    reminderEnabled?: boolean;
    reminderDate?: string;
    resolved?: boolean;
    archived?: boolean;
  }
): Promise<ConflictResolution> {
  return authenticatedFetch<ConflictResolution>(
    `${API_BASE}/api/conflict-resolutions/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );
}

