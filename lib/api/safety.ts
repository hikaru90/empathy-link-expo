/**
 * API client for safety mechanism (crisis resources, appeal, status)
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';

const API_BASE = API_BASE_URL;

export interface SafetyStatus {
  level: number;
  suspended: boolean;
  showResources: boolean;
  limits: { dailyMessages: number; cooldownMinutes: number } | null;
}

export interface CrisisResource {
  name: string;
  description: string;
  phone?: string;
  url?: string;
}

async function authenticatedFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);

  if ((result as { error?: unknown }).error) {
    const err = (result as { error: { message?: string; error?: string } }).error;
    const error = new Error(err?.message || 'Request failed');
    (error as Error & { code?: string }).code = err?.error;
    throw error;
  }
  return (result as { data: T }).data;
}

/**
 * Get current user's safety status (call when loading chat)
 */
export async function getSafetyStatus(): Promise<SafetyStatus> {
  return authenticatedFetch<SafetyStatus>(`${API_BASE}/api/safety/status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Get crisis resources (public, for flagged users). Pass lang for localized resources.
 */
export async function getCrisisResources(lang = 'de'): Promise<{ resources: CrisisResource[] }> {
  const result = await authClient.$fetch(
    `${API_BASE}/api/safety/resources?lang=${lang.slice(0, 2)}`,
    { method: 'GET' }
  );

  if ((result as { error?: unknown }).error) {
    const err = (result as { error: { message?: string } }).error;
    throw new Error(err?.message || 'Failed to fetch resources');
  }
  return (result as { data: { resources: CrisisResource[] } }).data;
}

/**
 * Request appeal (user can request reset after cooldown)
 */
export async function requestAppeal(): Promise<{ success: boolean; message: string }> {
  return authenticatedFetch<{ success: boolean; message: string }>(
    `${API_BASE}/api/safety/appeal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
