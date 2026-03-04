import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

import '../global.css';
import { installWebAuthDebug } from '@/lib/auth-debug';

if (__DEV__ && Platform.OS === 'web') {
  installWebAuthDebug();
}

export default function RootLayout() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { pathname, hash, search } = window.location;
    if (pathname === '/' && hash && hash.startsWith('#/') && hash.length > 2) {
      const pathFromHash = hash.slice(1);
      window.location.replace(window.location.origin + pathFromHash + search);
      return null;
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
