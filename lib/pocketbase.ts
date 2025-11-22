/**
 * PocketBase client instance
 * 
 * This client connects to the same PocketBase instance used by the empathy-link web app.
 * 
 * Note: PocketBase uses its own authentication system. For now, we'll use it for
 * public data access. User-specific data will require PocketBase authentication,
 * which can be synced with Better Auth users if needed.
 */

import PocketBase from 'pocketbase';
import { storage } from './storage';

/**
 * Get PocketBase URL from environment variable or use default
 */
function getPocketBaseURL(): string {
  // Check for environment variable (EXPO_PUBLIC_ prefix required for Expo)
  const pbUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;
  if (pbUrl) {
    // Ensure URL has protocol
    if (pbUrl.startsWith('http://') || pbUrl.startsWith('https://')) {
      return pbUrl;
    }
    return `https://${pbUrl}`;
  }
  
  // Default PocketBase URL from the other repo
  return 'https://pbempathy.clustercluster.de';
}

export const POCKETBASE_URL = getPocketBaseURL();

/**
 * Create a PocketBase instance with persistent auth storage
 */
export function createPocketBaseClient(): PocketBase {
  const pb = new PocketBase(POCKETBASE_URL);
  
  // Load auth from storage
  const loadAuth = async () => {
    try {
      const authData = await storage.getItem('pb_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.token && parsed.model) {
          pb.authStore.save(parsed.token, parsed.model);
        }
      }
    } catch (error) {
      console.warn('Failed to load PocketBase auth:', error);
    }
  };
  
  // Save auth to storage when it changes
  pb.authStore.onChange((token, model) => {
    if (token && model) {
      // Store auth data as JSON string
      const authData = JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      });
      storage.setItem('pb_auth', authData);
    } else {
      storage.removeItem('pb_auth');
    }
  });
  
  // Load auth on initialization
  loadAuth();
  
  return pb;
}

/**
 * Authenticate PocketBase client with user credentials
 * This attempts to authenticate using the Better Auth user's email
 */
export async function authenticatePocketBase(email: string, password?: string): Promise<PocketBase> {
  const pb = createPocketBaseClient();
  
  // If already authenticated, return
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
      return pb;
    } catch (error) {
      console.warn('Failed to refresh PocketBase auth, will re-authenticate:', error);
      pb.authStore.clear();
    }
  }
  
  // Try to authenticate with email/password if provided
  if (password) {
    try {
      await pb.collection('users').authWithPassword(email, password);
      console.log('✅ Authenticated with PocketBase');
      return pb;
    } catch (error: any) {
      console.warn('Failed to authenticate with PocketBase:', error?.message || error);
      // Continue without auth - some collections might be public
      throw error; // Re-throw so caller knows auth failed
    }
  }
  
  // If no password provided, return unauthenticated client
  return pb;
  
  return pb;
}

/**
 * Get authenticated PocketBase client
 * This will use stored PocketBase auth if available
 * For user-specific operations, you should call authenticatePocketBase first
 */
export async function getAuthenticatedPocketBase(): Promise<PocketBase> {
  const pb = createPocketBaseClient();
  
  // Try to refresh auth if we have a token
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
    } catch (error) {
      console.warn('Failed to refresh PocketBase auth:', error);
      // Clear invalid auth
      pb.authStore.clear();
    }
  }
  
  return pb;
}

// Default export for convenience
export const pb = createPocketBaseClient();

