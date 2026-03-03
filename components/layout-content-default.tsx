/**
 * Default layout content (iOS, web, production). Imports hooks/use-auth.
 * Only required when !isAndroidDev so use-auth is not loaded on Android dev.
 * Lives in components/ so Expo Router does NOT treat it as a route (avoids "missing default export" and rebundle).
 */
import { NotificationWrapper } from '@/components/NotificationWrapper';
import { AuthContext, useAuthProvider } from '@/hooks/use-auth';
import baseColors from '@/baseColors.config';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';

export function RootLayoutContentNoPostHog() {
  const authProvider = useAuthProvider();
  const isLoggedIn = !!authProvider.user;
  const [stackReady] = useState(true);
  return (
    <AuthContext.Provider value={authProvider}>
      <NotificationWrapper>
        <View style={{ flex: 1, backgroundColor: baseColors.background }}>
          <ThemeProvider value={DefaultTheme}>
            {stackReady ? (
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: baseColors.background },
                  animation: 'fade',
                  animationDuration: 400,
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                </Stack.Protected>
                <Stack.Protected guard={isLoggedIn}>
                  <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                </Stack.Protected>
              </Stack>
            ) : (
              <View style={{ flex: 1, backgroundColor: baseColors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#A366FF" />
              </View>
            )}
            <StatusBar style="light" />
          </ThemeProvider>
        </View>
      </NotificationWrapper>
    </AuthContext.Provider>
  );
}

function RootLayoutContentInner() {
  const authProvider = useAuthProvider();
  const posthogClient = usePostHog();
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
  const isLoggedIn = !!authProvider.user;
  return (
    <AuthContext.Provider value={authProvider}>
      <NotificationWrapper>
        <View style={{ flex: 1, backgroundColor: baseColors.background }}>
          <ThemeProvider value={DefaultTheme}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: baseColors.background },
                animation: 'fade',
                animationDuration: 400,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Protected guard={!isLoggedIn}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              </Stack.Protected>
              <Stack.Protected guard={isLoggedIn}>
                <Stack.Screen name="(protected)" options={{ headerShown: false }} />
              </Stack.Protected>
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </View>
      </NotificationWrapper>
    </AuthContext.Provider>
  );
}

export function RootLayoutContent() {
  return (
    <PostHogProvider client={posthog!}>
      <RootLayoutContentInner />
    </PostHogProvider>
  );
}
