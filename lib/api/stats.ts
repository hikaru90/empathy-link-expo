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

