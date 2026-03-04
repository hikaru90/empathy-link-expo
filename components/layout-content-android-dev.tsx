/**
 * Android dev only. Renders auth + Stack without ever importing hooks/use-auth.
 * Required by root _layout via require() so use-auth is not loaded on Android dev.
 * Lives in components/ so Expo Router does NOT treat it as a route (avoids rebundle).
 */
import { AndroidDevAuthProvider } from '@/components/AndroidDevAuthProvider';
import { NotificationProviderNoop } from '@/components/NotificationProviderNoop';
import { useAuth } from '@/lib/auth-context';
import baseColors from '@/baseColors.config';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

function AndroidDevStack() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  return (
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
  );
}

export default function LayoutContentAndroidDev() {
  return (
    <AndroidDevAuthProvider>
      <NotificationProviderNoop>
        <View style={{ flex: 1, backgroundColor: baseColors.background }}>
          <AndroidDevStack />
        </View>
      </NotificationProviderNoop>
    </AndroidDevAuthProvider>
  );
}
