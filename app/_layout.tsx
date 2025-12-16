import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import baseColors from '@/baseColors.config';
import { AuthContext, useAuthProvider } from '@/hooks/use-auth';
import { initializeI18n } from '@/lib/i18n';
// Import global CSS for NativeWind
import '../global.css';

export default function RootLayout() {
  const authProvider = useAuthProvider();

  // Initialize i18n on app start
  React.useEffect(() => {
    initializeI18n();
  }, []);

  // Configure hash-based routing for web to prevent 404s on reload
  // Convert pathname-based routes to hash-based before React renders
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.pathname !== '/' && !window.location.hash) {
      const path = window.location.pathname + window.location.search;
      
      // Store query params in sessionStorage before redirect (for login page to read)
      if (window.location.search && window.location.pathname.includes('/login')) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const params: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            params[key] = value;
          });
          sessionStorage.setItem('login_query_params', JSON.stringify(params));
        } catch (e) {
          // Ignore sessionStorage errors
        }
      }
      
      window.location.replace(`#${path}`);
      // Return null to prevent rendering until redirect completes
      return null;
    }
  }


  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthContext.Provider value={authProvider}>
          <View style={{ flex: 1, backgroundColor: baseColors.background }}>
            <ThemeProvider value={DefaultTheme}>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: baseColors.background },
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(protected)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="light" />
            </ThemeProvider>
          </View>
        </AuthContext.Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
