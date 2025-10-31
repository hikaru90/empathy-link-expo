import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

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

  return (
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
  );
}
