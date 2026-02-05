import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider, usePostHog } from 'posthog-react-native';

import baseColors from '@/baseColors.config';
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
    </AuthContext.Provider>
  );
}

function RootLayoutContentNoPostHog() {
  const authProvider = useAuthProvider();
  return (
    <AuthContext.Provider value={authProvider}>
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
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  // Initialize i18n on app start
  useEffect(() => {
    initializeI18n();
  }, []);

  // Configure hash-based routing for web to prevent 404s on reload
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.pathname !== '/' && !window.location.hash) {
      const path = window.location.pathname + window.location.search;
      if (window.location.search && window.location.pathname.includes('/login')) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const params: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            params[key] = value;
          });
          sessionStorage.setItem('login_query_params', JSON.stringify(params));
        } catch (e) {
          // Ignore
        }
      }
      window.location.replace(`#${path}`);
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
