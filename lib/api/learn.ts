/**
 * API client for learn section endpoints
 * Uses PocketBase to fetch topics and categories (content)
 * Uses backend API for learning sessions (user progress)
 */

import { authClient } from '../auth';
import { API_BASE_URL } from '../config';
import { POCKETBASE_URL } from '../pocketbase';

export interface TopicCategory {
  id: string;
  nameDE: string;
  nameEN?: string;
  color?: string;
  order?: number;
  created: string;
  updated: string;
}

export interface TopicVersion {
  id: string;
  titleDE: string;
  titleEN?: string;
  content: any[];
  image?: string;
  category?: string;
  expand?: {
    category?: TopicCategory;
  };
  collectionId: string;
  created: string;
  updated: string;
}

export interface Topic {
  id: string;
  slug: string;
  order?: number;
  currentVersion?: string;
  expand?: {
    currentVersion?: TopicVersion;
  };
  position?: number;
  created: string;
  updated: string;
}

export interface LearningSession {
  id: string;
  userId: string;
  topicId: string;
  topicVersionId: string;
  currentPage: number;
  completed: boolean;
  responses?: Array<{
    blockIndex: number;
    blockType: string;
    response: any;
    timestamp: string;
    topicVersionId: string;
    blockContent: any;
  }>;
  feedback?: any;
  completedAt?: string;
  created: string;
  updated: string;
}

/**
 * Helper to make authenticated fetch requests using Better Auth
 */
async function authenticatedFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const result = await authClient.$fetch(url, options);

    if (result.error) {
      // Handle different error formats
      let errorMessage: string;
      if (typeof result.error === 'string') {
        errorMessage = result.error;
      } else if (result.error.message) {
        errorMessage = result.error.message;
      } else if (result.error.status && result.error.statusText) {
        // HTTP error with status code
        errorMessage = `${result.error.statusText} (${result.error.status})`;
      } else {
        errorMessage = JSON.stringify(result.error);
      }
      throw new Error(errorMessage);
    }

    return result.data as T;
  } catch (error: any) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Handle other error formats
    if (error?.status && error?.statusText) {
      throw new Error(`${error.statusText} (${error.status})`);
    }
    throw new Error(error?.message || String(error));
  }
}

/**
 * Get all topic categories (public access - no auth required)
 */
export async function getCategories(): Promise<TopicCategory[]> {
  const { pb } = await import('../pocketbase');
  return pb.collection('topicCategory').getFullList<TopicCategory>({
    sort: 'order',
  });
}

/**
 * Get all topics with their current versions and categories (public access - no auth required)
 */
export async function getTopics(): Promise<Topic[]> {
  const { pb } = await import('../pocketbase');
  return pb.collection('topics').getFullList<Topic>({
    sort: 'order',
    expand: 'currentVersion,currentVersion.category',
  });
}

/**
 * Get a single topic by slug (public access - no auth required)
 */
export async function getTopicBySlug(slug: string): Promise<Topic> {
  const { pb } = await import('../pocketbase');
  return pb.collection('topics').getFirstListItem<Topic>(
    `slug = "${slug}"`,
    {
      expand: 'currentVersion,currentVersion.category',
    }
  );
}

/**
 * Get completion status for all topics for the current user
 * Uses backend API with Better Auth authentication
 */
export async function getCompletionStatus(): Promise<Record<string, boolean>> {
  try {
    const response = await authenticatedFetch<{ completionStatus: Record<string, boolean> }>(
      `${API_BASE_URL}/api/learn/sessions/completion-status`
    );
    return response.completionStatus || {};
  } catch (error: any) {
    console.warn('Could not fetch completion status:', error?.message || error);
    return {};
  }
}

/**
 * Get the latest learning session for a user/topic combo
 * Uses backend API with Better Auth authentication
 */
export async function getLatestLearningSession(
  userId: string,
  topicId: string
): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions?userId=${encodeURIComponent(
        userId
      )}&topicId=${encodeURIComponent(topicId)}`
    );
    return response.session || null;
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.includes('404')) {
      return null;
    }
    console.error('Failed to load learning session:', error?.message || error);
    return null;
  }
}

/**
 * Create a new learning session for a topic (forces creation of a new session)
 * Uses backend API with Better Auth authentication
 */
export async function createLearningSession(
  userId: string,
  topicId: string,
  topicVersionId: string
): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, topicId, topicVersionId }),
      }
    );
    return response.session || null;
  } catch (error: any) {
    console.error('Failed to create learning session:', error?.message || error);
    return null;
  }
}

/**
 * Update learning session current page
 * Uses backend API with Better Auth authentication
 */
export async function updateLearningSessionPage(
  sessionId: string,
  currentPage: number
): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage }),
      }
    );
    return response.session || null;
  } catch (error: any) {
    console.warn('Failed to update learning session page:', error?.message || error);
    return null;
  }
}

/**
 * Get a learning session by ID
 * Uses backend API with Better Auth authentication
 */
export async function getLearningSessionById(sessionId: string): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions/by-id/${sessionId}`
    );
    return response.session || null;
  } catch (error: any) {
    console.error('Failed to get learning session:', error?.message || error);
    return null;
  }
}

/**
 * Save a response to a learning session
 * Uses backend API with Better Auth authentication
 */
export async function saveLearningSessionResponse(
  sessionId: string,
  blockIndex: number,
  blockType: string,
  response: any,
  topicVersionId: string,
  blockContent: any
): Promise<LearningSession | null> {
  try {
    // Get current session first to update responses array
    const session = await getLearningSessionById(sessionId);
    if (!session) {
      return null;
    }
    
    // Update responses array
    const existingResponses = session.responses || [];
    const updatedResponses = existingResponses.filter(
      (r) =>
        !(
          r.blockType === blockType &&
          JSON.stringify(r.blockContent) === JSON.stringify(blockContent)
        )
    );
    
    updatedResponses.push({
      blockIndex,
      blockType,
      response,
      timestamp: new Date().toISOString(),
      topicVersionId,
      blockContent,
    });
    
    const updateResponse = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: updatedResponses }),
      }
    );
    return updateResponse.session || null;
  } catch (error: any) {
    console.error('Failed to save learning session response:', error?.message || error);
    return null;
  }
}

/**
 * Mark learning session as completed
 * Uses backend API with Better Auth authentication
 */
export async function completeLearningSession(sessionId: string): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }
    );
    return response.session || null;
  } catch (error: any) {
    console.warn('Failed to complete learning session:', error?.message || error);
    return null;
  }
}

/**
 * Save feedback for a learning session
 * Uses backend API with Better Auth authentication
 */
export async function saveLearningSessionFeedback(
  sessionId: string,
  feedback: any
): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      }
    );
    return response.session || null;
  } catch (error: any) {
    console.error('Failed to save learning session feedback:', error?.message || error);
    return null;
  }
}

/**
 * Reset a learning session to start fresh
 * Uses backend API with Better Auth authentication
 */
export async function resetLearningSession(sessionId: string): Promise<LearningSession | null> {
  try {
    const response = await authenticatedFetch<{ session: LearningSession }>(
      `${API_BASE_URL}/api/learn/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: false,
          currentPage: 0,
          responses: [],
          feedback: null,
          completedAt: null,
        }),
      }
    );
    return response.session || null;
  } catch (error: any) {
    console.error('Failed to reset learning session:', error?.message || error);
    return null;
  }
}

/**
 * Delete a learning session
 * Uses backend API with Better Auth authentication
 */
export async function deleteLearningSession(sessionId: string): Promise<{ success: boolean }> {
  try {
    await authenticatedFetch<{ success: boolean }>(
      `${API_BASE_URL}/api/learn/sessions/${sessionId}`,
      {
        method: 'DELETE',
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete learning session:', error?.message || error);
    return { success: false };
  }
}

/**
 * Ask AI a question based on user's answer
 * Uses backend API with Better Auth authentication
 */
export async function askAIQuestion(
  question: string,
  userAnswer: string,
  systemPrompt: string
): Promise<string> {
  try {
    const response = await authenticatedFetch<{ response: string }>(
      `${API_BASE_URL}/api/ai/learn/askQuestion`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userAnswer,
          systemPrompt,
        }),
      }
    );
    return response.response || '';
  } catch (error: any) {
    console.error('Failed to ask AI question:', error?.message || error);
    // Provide a more helpful error message
    const errorMessage = error?.message || error?.statusText || 'Failed to get AI response';
    if (error?.status === 404) {
      throw new Error('AI question endpoint not found. Please ensure the backend API is running and the endpoint is implemented.');
    }
    throw new Error(errorMessage);
  }
}

/**
 * Feelings Detective API - Get AI reflection or summary
 */
export async function feelingsDetectiveAI(
  step: 'reflection' | 'summary',
  situation?: string,
  thoughts?: string,
  feelings?: string[]
): Promise<string> {
  try {
    const body: any = { step };
    if (step === 'reflection' && situation) {
      body.situation = situation;
    } else if (step === 'summary' && situation && thoughts && feelings) {
      body.situation = situation;
      body.thoughts = thoughts;
      body.feelings = feelings;
    }

    const response = await authenticatedFetch<{ response: string }>(
      `${API_BASE_URL}/api/ai/learn/feelingsDetective`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return response.response || '';
  } catch (error: any) {
    console.error('Failed to get feelings detective AI response:', error?.message || error);
    throw error;
  }
}

/**
 * Get image URL for a PocketBase file
 */
export function getPocketBaseFileUrl(
  collectionId: string,
  recordId: string,
  filename: string
): string {
  return `${POCKETBASE_URL}/api/files/${collectionId}/${recordId}/${filename}`;
}

