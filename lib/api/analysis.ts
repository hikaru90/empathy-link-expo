/**
 * API client for analysis endpoints
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
    const error = result.error as any;
    throw new Error(error.message || (typeof error === 'string' ? error : 'Unknown error'));
  }

  return result.data as T;
}

export interface AnalysisDetail {
  id: string;
  userId: string;
  chatId: string;
  title: string;
  observation?: string;
  feelings?: string[];
  needs?: string[];
  request?: string;
  requestResolved?: boolean;
  requestArchived?: boolean;
  conversationGoal?: string;
  dailyWin?: string;
  emotionalShift?: string;
  iStatementMuscle?: number;
  clarityOfAsk?: string;
  empathyAttempt?: boolean;
  feelingVocabulary?: number;
  sentimentPolarity?: number;
  intensityRatio?: number;
  emotionalBalance?: number;
  triggerCount?: number;
  resolutionCount?: number;
  escalationRate?: number;
  empathyRate?: number;
  messageLength?: number;
  readabilityScore?: number;
  created: string;
  updated: string;
  chatHistory?: any[];
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(analysisId: string): Promise<AnalysisDetail> {
  try {
    const response = await authenticatedFetch<AnalysisDetail>(
      `${API_BASE}/api/analyses/${analysisId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('Analyse nicht gefunden. Bitte implementiere GET /api/analyses/:id im Backend.');
    }
    throw error;
  }
}

/**
 * Get all analyses for the current user
 */
export async function getAllAnalyses(): Promise<AnalysisDetail[]> {
  const response = await authenticatedFetch<{ analyses: AnalysisDetail[] }>(
    `${API_BASE}/api/analyses`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.analyses;
}

/**
 * Delete an analysis by ID
 */
export async function deleteAnalysis(analysisId: string): Promise<{ success: boolean }> {
  return authenticatedFetch<{ success: boolean }>(
    `${API_BASE}/api/analyses/${analysisId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Update an analysis (specifically request_resolved and request_archived)
 */
export async function updateAnalysis(
  analysisId: string,
  updates: {
    requestResolved?: boolean;
    requestArchived?: boolean;
  }
): Promise<AnalysisDetail> {
  return authenticatedFetch<AnalysisDetail>(
    `${API_BASE}/api/analyses/${analysisId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );
}
