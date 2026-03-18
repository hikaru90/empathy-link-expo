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

/**
 * Frontend/App origin override (web only).
 *
 * Use this when your web origin is NOT stable/derivable (SSR/tests) or when you explicitly
 * want to force a single origin (e.g. Tailscale URL) without any localhost fallbacks.
 */
export function getFrontendURLOverride(): string | null {
  const url =
    process.env.EXPO_PUBLIC_APP_URL?.trim() ||
    process.env.EXPO_PUBLIC_FRONTEND_URL?.trim() ||
    null;
  if (!url) return null;
  return url.replace(/\/$/, '');
}

/** Resolved backend URL after resolveBackendURL(); set by setResolvedBackendURL(). */
let _resolvedUrl: string | null = null;

const _overrideAtLoad = getBackendURLOverride();
if (_overrideAtLoad) {
  _resolvedUrl = _overrideAtLoad;
}

export function setResolvedBackendURL(url: string): void {
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
  try {
    const url = getBackendURLOverride();
    if (url) return url;
    const L = getLocalBackendURL();
    if (L) {
      const reachable = await isReachable(L);
      return reachable ? L : L;
    }
    throw new Error('Set EXPO_PUBLIC_BACKEND in .env');
  } catch (e) {
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
 * For web: uses EXPO_PUBLIC_APP_URL/EXPO_PUBLIC_FRONTEND_URL, otherwise window.location.origin
 * For native: uses deep link scheme (empathy-link://)
 */
export function getExpoAppURL(): string {
  if (Platform.OS === 'web') {
    // Web runtime should always have a location/origin. Do not hardcode localhost fallbacks.
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    // Some environments may expose `location` without `window` (or during early init).
    if (typeof location !== 'undefined' && (location as any)?.origin) {
      return (location as any).origin as string;
    }
    // Last resort: unknown at this moment. Call sites that need it run in-browser anyway.
    return '';
  }
  return 'empathy-link://';
}

/** Expo app URL (dynamic: reflects override or current window.location.origin). */
export const EXPO_APP_URL = stringProxy(getExpoAppURL);
