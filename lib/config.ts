/**
 * Environment configuration
 *
 * Single source of truth for backend URL: EXPO_PUBLIC_BACKEND in .env.
 * Dev = Tailscale URL, prod = real backend URL. Used everywhere (API + Better Auth).
 * For production builds set EXPO_PUBLIC_BACKEND in EAS env.
 */

import { Platform } from 'react-native';

const LOCAL_PORT = 4000;

/** Backend URL from EXPO_PUBLIC_BACKEND. Single source of truth. */
export function getBackendURLOverride(): string | null {
  const url = process.env.EXPO_PUBLIC_BACKEND?.trim();
  if (!url) return null;
  return url.replace(/\/$/, '');
}

/** Resolved backend URL after resolveBackendURL(); set by setResolvedBackendURL(). */
let _resolvedUrl: string | null = null;

export function setResolvedBackendURL(url: string): void {
  if (__DEV__) console.log('[Config] setResolvedBackendURL called, url:', url);
  _resolvedUrl = url;
}

/**
 * Local backend candidate: web = localhost; Android = 10.0.2.2 (emulator's host); other native = null.
 */
export function getLocalBackendURL(): string | null {
  if (Platform.OS === 'web') {
    return `http://localhost:${LOCAL_PORT}`;
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${LOCAL_PORT}`;
  }
  return null;
}

/**
 * Check if a backend URL is reachable (HEAD request with timeout).
 */
export async function isReachable(
  baseUrl: string,
  timeoutMs = 2500
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(id);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

/**
 * Resolve backend URL. If EXPO_PUBLIC_BACKEND is set, returns it. Otherwise tries local only.
 * Never throws when override is set. When only local is available, returns local URL even if unreachable.
 */
export async function resolveBackendURL(): Promise<string> {
  if (__DEV__) console.log('[Config] resolveBackendURL() started');
  try {
    const url = getBackendURLOverride();
    if (url) {
      if (__DEV__) console.log('[Config] resolveBackendURL() using EXPO_PUBLIC_BACKEND:', url);
      if (__DEV__) console.log('[Config] resolveBackendURL() about to return (sync)');
      return url;
    }
    const L = getLocalBackendURL();
    if (L) {
      const reachable = await isReachable(L);
      if (__DEV__) console.log('[Config] resolveBackendURL() local reachability:', reachable, 'URL:', L);
      if (reachable) return L;
      if (__DEV__) console.warn('[Config] resolveBackendURL() local unreachable, using anyway:', L);
      return L;
    }
    if (__DEV__) console.error('[Config] resolveBackendURL() no override and no local URL');
    throw new Error('Set EXPO_PUBLIC_BACKEND in .env');
  } catch (e) {
    if (__DEV__) console.error('[Config] resolveBackendURL() threw:', e);
    throw e;
  }
}

/**
 * Get the backend URL (resolved, or EXPO_PUBLIC_BACKEND). Throws if unset.
 */
export function getBackendURL(): string {
  if (_resolvedUrl) return _resolvedUrl;
  const url = getBackendURLOverride();
  if (url) return url;
  const local = getLocalBackendURL();
  if (local) return local;
  return 'http://localhost:4000'; // Final fallback to avoid top-level crash
}

/** Proxy that forwards all property access (including .replace) to the string from getter. */
function stringProxy(getter: () => string): string {
  return new Proxy(
    {} as Record<string, unknown>,
    {
      get(_, prop: string) {
        const s = getter();
        const v = (s as unknown as Record<string, unknown>)[prop];
        if (typeof v === 'function') return (v as (...args: unknown[]) => unknown).bind(s);
        return v;
      },
    }
  ) as unknown as string;
}

/** API base URL (dynamic: reflects resolved URL after setResolvedBackendURL). */
export const API_BASE_URL = stringProxy(getBackendURL);

/** Get the Better Auth base URL. Same as backend (EXPO_PUBLIC_BACKEND or resolved/local). */
export function getBetterAuthURL(): string {
  return getBackendURL();
}

/** Better Auth base URL (dynamic: reflects resolved URL after setResolvedBackendURL). */
export const BETTER_AUTH_URL = stringProxy(getBetterAuthURL);

/**
 * Get the Expo app URL for callback URLs (e.g., email verification links)
 * For web: uses localhost:8081 or window.location.origin
 * For native: uses deep link scheme (empathy-link://)
 */
export function getExpoAppURL(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return 'http://localhost:8081';
  }
  return 'empathy-link://';
}

export const EXPO_APP_URL = getExpoAppURL();

if (__DEV__) {
  try {
    const url = getBackendURL();
    console.log(
      '[Config] module load - URL in use:',
      url,
      _resolvedUrl ? '(from setResolvedBackendURL)' : '(from EXPO_PUBLIC_BACKEND or local fallback; layout effect will set _resolvedUrl next)'
    );
  } catch (e) {
    console.log('[Config] module load - getBackendURL threw:', (e as Error)?.message);
  }
}
