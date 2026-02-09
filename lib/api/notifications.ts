/**
 * API client for push notification registration
 *
 * Backend: Implement POST /api/notifications/register to store the token.
 * Expected body: { token: string }. The user ID comes from the auth session.
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';

async function authenticatedFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);

  if (result.error) {
    throw new Error(result.error.message || String(result.error));
  }

  return result.data as T;
}

export async function registerPushToken(token: string): Promise<void> {
  await authenticatedFetch(`${API_BASE_URL}/api/notifications/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

/**
 * Unregister the push token (call when user disables notifications)
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await authenticatedFetch(`${API_BASE_URL}/api/notifications/unregister`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Non-critical – token may already be removed
  }
}
