// Earliest possible log when a new bundle runs (helps find rebundle trigger)
if (__DEV__) console.log('[Layout] >>> NEW BUNDLE <<< _layout.tsx loading', 'id=', Date.now());

// Log unhandled errors/rejections so we can see what triggers the Android rebundle
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

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

import '../global.css';

if (__DEV__) console.log('[Layout] _layout.tsx imports done');

export default function RootLayout() {
  if (__DEV__) console.log('[Layout] RootLayout render called');

  useEffect(() => {
    if (__DEV__) console.log('[Layout] RootLayout mount complete');
    return () => {
      if (__DEV__) console.log('[Layout] *** UNMOUNT (rebundle imminent - see next >>> NEW BUNDLE <<<) ***');
    };
  }, []);

  // i18n init moved to (app)/_layout — calling it in root's useEffect triggers Android rebundle.

  // Web: normalize hash-based URLs so Expo Router gets the correct path
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { pathname, hash, search } = window.location;
    if (pathname === '/' && hash && hash.startsWith('#/') && hash.length > 2) {
      const pathFromHash = hash.slice(1);
      window.location.replace(window.location.origin + pathFromHash + search);
      return null;
    }
  }

  // No setState in root: backend is resolved at config module load when EXPO_PUBLIC_BACKEND is set (avoids Android rebundle trigger).
  if (__DEV__) console.log('[Layout] RootLayout rendering Stack with (app) only (no auth here)');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
