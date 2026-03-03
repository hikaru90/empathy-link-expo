// Earliest possible log when a new bundle runs (helps find rebundle trigger: last effect before this = suspect)
if (__DEV__) console.log('[Layout] >>> NEW BUNDLE <<< _layout.tsx loading', 'id=', Date.now());

function layoutLog(step: string, msg?: string) {
  if (__DEV__) console.log('[Layout]', step, msg ?? '');
}

// Log unhandled errors/rejections so we can see what triggers the Android rebundle (no error is shown otherwise)
if (__DEV__ && typeof global !== 'undefined') {
  const origHandler = (global as unknown as { ErrorUtils?: { getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void } }).ErrorUtils?.getGlobalHandler?.();
  if ((global as unknown as { ErrorUtils?: { setGlobalHandler?: (h: (error: Error, isFatal?: boolean) => void) => void } }).ErrorUtils?.setGlobalHandler) {
    (global as unknown as { ErrorUtils: { setGlobalHandler: (h: (error: Error, isFatal?: boolean) => void) => void } }).ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('[Layout] GLOBAL ERROR (may trigger reload):', error?.message, 'isFatal:', isFatal, 'stack:', error?.stack);
      if (typeof origHandler === 'function') origHandler(error, isFatal);
    });
  }
  const _origRejection = (global as unknown as { onunhandledrejection?: (e: PromiseRejectionEvent) => void }).onunhandledrejection;
  (global as unknown as { onunhandledrejection: (e: PromiseRejectionEvent) => void }).onunhandledrejection = (e) => {
    console.error('[Layout] UNHANDLED REJECTION (may trigger reload):', e?.reason?.message ?? e?.reason, 'reason:', e?.reason);
    if (typeof _origRejection === 'function') _origRejection(e);
  };
}

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import baseColors from '@/baseColors.config';
import {
  getBackendURLOverride,
  getLocalBackendURL,
  resolveBackendURL,
  setResolvedBackendURL,
} from '@/lib/config';
import { initializeI18n } from '@/lib/i18n';
import { posthog } from '@/lib/posthog';
import type { ErrorBoundaryProps } from 'expo-router';

/** Custom error UI. Not exported: expo-router uses it when exported, which with AuthProvider can cause infinite re-render/rebundle (expo/expo#24242, #24317). Use default router error handling to avoid loop. */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error('[Layout] ErrorBoundary caught error (no reload):', error?.message);
  return (
    <View style={{ flex: 1, backgroundColor: baseColors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ color: baseColors.black, textAlign: 'center', marginBottom: 16 }}>
        {error?.message ?? 'Something went wrong.'}
      </Text>
      <Text style={{ color: baseColors.black, fontSize: 12, textAlign: 'center', marginBottom: 24 }}>
        Backend unreachable? Check connection. No automatic reload.
      </Text>
      {typeof retry === 'function' && (
        <TouchableOpacity onPress={retry} style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: baseColors.primary, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
// Import global CSS for NativeWind
import '../global.css';

if (__DEV__) console.log('[Layout] _layout.tsx imports done, posthog:', !!posthog);

const isAndroidDev = __DEV__ && Platform.OS === 'android';

export default function RootLayout() {
  if (__DEV__) console.log('[Layout] RootLayout render called');
  const [backendReady, setBackendReady] = useState(false);
  // Defer mounting Stack/auth by one frame on Android dev to avoid reload loop (router/native may reload when Stack mounts in same commit as setBackendReady).
  const [contentReady, setContentReady] = useState(false);

  // Log when RootLayout unmounts (helps confirm reload = unmount)
  useEffect(() => {
    if (__DEV__) console.log('[Layout] RootLayout mount complete');
    return () => {
      if (__DEV__) console.log('[Layout] *** UNMOUNT (rebundle imminent - see next >>> NEW BUNDLE <<<) ***');
    };
  }, []);

  // Initialize i18n on app start
  useEffect(() => {
    if (__DEV__) console.log('[Layout] i18n effect running, calling initializeI18n()');
    initializeI18n();
    if (__DEV__) console.log('[Layout] i18n effect done');
    return () => {
      if (__DEV__) console.log('[Layout] i18n effect cleanup');
    };
  }, []);

  // Resolve backend URL before rendering auth-dependent tree (so auth client gets resolved URL).
  // When EXPO_PUBLIC_BACKEND is set, set state synchronously to avoid a microtask/timer tick that
  // was observed to trigger RootLayout unmount + full Android rebundle in dev.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (__DEV__) console.log('[Layout] Backend resolution effect started');

    const override = getBackendURLOverride();
    if (override) {
      if (__DEV__) console.log('[Layout] EXPO_PUBLIC_BACKEND set, setting backend+content ready synchronously');
      setResolvedBackendURL(override);
      setBackendReady(true);
      setContentReady(true);
      return () => {
        if (__DEV__) console.log('[Layout] Backend resolution effect cleanup (sync path)');
      };
    }

    const promise = resolveBackendURL();
    if (__DEV__) console.log('[Layout] resolveBackendURL() returned promise, attaching .then()');
    promise
      .then((url) => {
        try {
          if (__DEV__) console.log('[Layout] .then() entered, url:', url, 'cancelled:', cancelled);
          if (cancelled) {
            if (__DEV__) console.log('[Layout] .then() bailing (cancelled)');
            return;
          }
          if (__DEV__) console.log('[Layout] calling setResolvedBackendURL(url)');
          setResolvedBackendURL(url);
          if (__DEV__) console.log('[Layout] scheduling setTimeout(0) for setBackendReady(true)');
          timeoutId = setTimeout(() => {
            if (__DEV__) console.log('[Layout] setTimeout fired, cancelled:', cancelled);
            if (!cancelled) {
              if (__DEV__) console.log('[Layout] calling setBackendReady(true) and setContentReady(true)');
              setBackendReady(true);
              setContentReady(true);
            }
          }, 0);
          if (__DEV__) console.log('[Layout] .then() finished');
        } catch (e) {
          if (__DEV__) console.error('[Layout] .then() sync error (may trigger reload):', e instanceof Error ? e.message : e);
          throw e;
        }
      })
      .catch((err: unknown) => {
        if (__DEV__) console.error('[Layout] .catch() Backend resolution failed:', err instanceof Error ? err.message : err);
        if (cancelled) return;
        try {
          const fallback = getBackendURLOverride() ?? getLocalBackendURL();
          if (fallback) setResolvedBackendURL(fallback);
          timeoutId = setTimeout(() => {
            if (!cancelled) {
              setBackendReady(true);
              setContentReady(true);
            }
          }, 0);
        } catch (e) {
          if (__DEV__) console.error('[Layout] .catch() sync error:', e instanceof Error ? e.message : e);
        }
      });
    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      if (__DEV__) console.log('[Layout] Backend resolution effect cleanup (timeoutId was:', timeoutId, ')');
    };
  }, []);

  // Configure web routing: normalize hash-based URLs so Expo Router receives the correct path
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { pathname, hash, search } = window.location;

    // When pathname is / and hash is #/path (e.g. /#/analysis/xxx), redirect to path-based URL.
    // Expo Router's getStateFromPath uses pathname for matching and ignores hash, so /#/analysis/xxx
    // incorrectly matches / (chat) instead of /analysis/xxx. Path-based URLs work correctly.
    if (pathname === '/' && hash && hash.startsWith('#/') && hash.length > 2) {
      const pathFromHash = hash.slice(1); // Remove leading #
      window.location.replace(window.location.origin + pathFromHash + search);
      return null;
    }
  }

  if (!backendReady || !contentReady) {
    if (__DEV__) console.log('[Layout] RootLayout showing loading (backendReady=%s, contentReady=%s)', backendReady, contentReady);
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#ECECDE', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#A366FF" />
          <Text style={{ marginTop: 12, color: '#021212', fontSize: 16 }}>Laden…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (__DEV__) console.log('[Layout] RootLayout render - backendReady=true, contentReady=true, choosing content');
  const usePostHogHere = posthog && !isAndroidDev;
  if (__DEV__) console.log('[Layout] RootLayout usePostHogHere=', usePostHogHere, 'isAndroidDev=', isAndroidDev, '-> rendering', usePostHogHere ? 'PostHog+RootLayoutContent' : isAndroidDev ? 'LayoutContentAndroidDev (no use-auth)' : 'RootLayoutContentNoPostHog');
  let content: React.ReactNode;
  try {
    if (isAndroidDev) {
      layoutLog('content step: requiring layout-content-android-dev');
      const LayoutContentAndroidDev = require('@/components/layout-content-android-dev').default;
      layoutLog('content step: rendering LayoutContentAndroidDev');
      content = <LayoutContentAndroidDev />;
    } else if (usePostHogHere) {
      layoutLog('content step: requiring layout-content-default (RootLayoutContent)');
      const { RootLayoutContent } = require('@/components/layout-content-default');
      layoutLog('content step: rendering RootLayoutContent');
      content = <RootLayoutContent />;
    } else {
      layoutLog('content step: requiring layout-content-default (RootLayoutContentNoPostHog)');
      const { RootLayoutContentNoPostHog } = require('@/components/layout-content-default');
      layoutLog('content step: rendering RootLayoutContentNoPostHog');
      content = <RootLayoutContentNoPostHog />;
    }
  } catch (contentErr) {
    if (__DEV__) console.error('[Layout] content require/render FAILED (may trigger rebundle):', contentErr instanceof Error ? contentErr.message : contentErr);
    throw contentErr;
  }

  layoutLog('RootLayout returning SafeAreaProvider + content');
  try {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {content}
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  } catch (returnErr) {
    if (__DEV__) console.error('[Layout] RootLayout return (JSX) threw (may trigger rebundle):', returnErr instanceof Error ? returnErr.message : returnErr);
    throw returnErr;
  }
}
