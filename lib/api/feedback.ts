/**
 * API client for user feedback (bugs, improvements, etc.)
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';

export type FeedbackType = 'bug' | 'improvement' | 'other';

export interface SubmitFeedbackInput {
  type: FeedbackType;
  /** NVC step 1: Was hast du beobachtet? */
  observation?: string;
  /** NVC step 2: Wie hast du dich gefühlt? */
  feelings?: string;
  /** NVC step 3: Welches Bedürfnis? */
  needs?: string;
  /** NVC step 4: Hast du eine Bitte? */
  request?: string;
  /** Legacy: short title (optional when using NVC steps) */
  title?: string;
  /** Legacy: message (optional when using NVC steps) */
  message?: string;
  metadata?: { appVersion?: string; platform?: string };
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  created: string;
}

async function authenticatedFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const result = await authClient.$fetch(url, options);
  if ((result as { error?: unknown }).error) {
    const err = (result as { error: { message?: string } }).error;
    throw new Error(err?.message || 'Request failed');
  }
  return (result as { data: T }).data;
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackResponse> {
  return authenticatedFetch<SubmitFeedbackResponse>(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function listMyFeedback(): Promise<{ feedback: FeedbackItem[] }> {
  return authenticatedFetch<{ feedback: FeedbackItem[] }>(`${API_BASE_URL}/api/feedback`);
}
