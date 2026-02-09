import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider, usePostHog } from 'posthog-react-native';

import baseColors from '@/baseColors.config';
import { NotificationProvider } from '@/components/NotificationProvider';
import { AuthContext, useAuthProvider } from '@/hooks/use-auth';
import { initializeI18n } from '@/lib/i18n';
import { posthog } from '@/lib/posthog';
// Import global CSS for NativeWind
import '../global.css';

function RootLayoutContent() {
  const authProvider = useAuthProvider();
  const posthogClient = usePostHog();

  // Sync authenticated user to PostHog (identify on login, reset on logout)
  useEffect(() => {
    if (!posthogClient) return;
    if (authProvider.user) {
      posthogClient.identify(authProvider.user.id, {
        email: authProvider.user.email,
        ...(authProvider.user.name ? { name: authProvider.user.name } : {}),
      });
    } else {
      posthogClient.reset();
    }
  }, [authProvider.user, posthogClient]);

  return (
    <AuthContext.Provider value={authProvider}>
      <NotificationProvider>
        <View style={{ flex: 1, backgroundColor: baseColors.background }}>
          <ThemeProvider value={DefaultTheme}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: baseColors.background },
                animation: 'fade',
                animationDuration: 400,
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </View>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

function RootLayoutContentNoPostHog() {
  const authProvider = useAuthProvider();
  return (
    <AuthContext.Provider value={authProvider}>
      <NotificationProvider>
        <View style={{ flex: 1, backgroundColor: baseColors.background }}>
          <ThemeProvider value={DefaultTheme}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: baseColors.background },
                animation: 'fade',
                animationDuration: 400,
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </View>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  // Initialize i18n on app start
  useEffect(() => {
    initializeI18n();
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

  const content = posthog ? (
    <PostHogProvider client={posthog}>
      <RootLayoutContent />
    </PostHogProvider>
  ) : (
    <RootLayoutContentNoPostHog />
  );

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {content}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
