/**
 * API client for conflict resolution endpoints
 * 
 * NOTE: This file now uses the analyses API directly instead of a separate conflict_resolutions table.
 * The resolved and archived states are stored directly on the analyses table.
 */

import { API_BASE_URL } from '../config';
import { authClient } from '../auth';
import { getAllAnalyses, updateAnalysis, type AnalysisDetail } from './analysis';

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
  resolved: boolean;
  archived?: boolean;
  created: string;
  updated: string;
}

/**
 * Get all conflict resolutions for the current user
 * This now filters analyses that have a request field
 */
export async function getConflictResolutions(): Promise<ConflictResolution[]> {
  try {
    const analyses = await getAllAnalyses();
    
    // Filter analyses that have a request
    const resolutions: ConflictResolution[] = analyses
      .filter(analysis => analysis.request && analysis.request.trim().length > 0)
      .map(analysis => ({
        id: analysis.id,
        analysisId: analysis.id,
        request: analysis.request!,
        resolved: analysis.requestResolved || false,
        archived: analysis.requestArchived || false,
        created: analysis.created,
        updated: analysis.updated,
      }));
    
    return resolutions;
  } catch (error) {
    console.warn('Failed to fetch conflict resolutions:', error);
    return [];
  }
}

/**
 * Update a conflict resolution
 * This now updates the analysis directly
 */
export async function updateConflictResolution(
  id: string,
  updates: {
    resolved?: boolean;
    archived?: boolean;
  }
): Promise<ConflictResolution> {
  const analysis = await updateAnalysis(id, {
    requestResolved: updates.resolved,
    requestArchived: updates.archived,
  });

  return {
    id: analysis.id,
    analysisId: analysis.id,
    request: analysis.request || '',
    resolved: analysis.requestResolved || false,
    archived: analysis.requestArchived || false,
    created: analysis.created,
    updated: analysis.updated,
  };
}

/**
 * Create or update a conflict resolution
 * This is now a no-op since resolutions are automatically created when an analysis has a request
 * We just update the resolved/archived state if needed
 */
export async function upsertConflictResolution(
  analysisId: string,
  request: string,
  resolutionDate?: string,
  reminderEnabled?: boolean
): Promise<ConflictResolution> {
  // Since requests are already on analyses, we just need to ensure the analysis exists
  // For now, we'll return the current state or create a mock resolution
  try {
    const analyses = await getAllAnalyses();
    const analysis = analyses.find(a => a.id === analysisId);
    
    if (analysis) {
      return {
        id: analysis.id,
        analysisId: analysis.id,
        request: analysis.request || request,
        resolved: analysis.requestResolved || false,
        archived: analysis.requestArchived || false,
        created: analysis.created,
        updated: analysis.updated,
      };
    }
    
    // If analysis doesn't exist, throw error
    throw new Error('Analysis not found');
  } catch (error) {
    console.error('Failed to upsert conflict resolution:', error);
    throw error;
  }
}

