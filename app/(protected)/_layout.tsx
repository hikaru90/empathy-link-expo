import FeelingsDrawer from '@/components/FeelingsDrawer';
import { useAuth } from '@/hooks/use-auth';
import { ChatProvider } from '@/hooks/use-chat';
import { FeelingsDrawerProvider } from '@/hooks/use-feelings-drawer';
import { RestartDrawerProvider } from '@/hooks/use-restart-drawer';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return (
    <ChatProvider>
      <RestartDrawerProvider>
        <FeelingsDrawerProvider>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 400,
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="analysis/[id]" />
              <Stack.Screen name="learn/[slug]" />
              <Stack.Screen name="memories" />
              <Stack.Screen name="modal" />
              <Stack.Screen name="conflict-resolutions" />
              <Stack.Screen name="chat-settings" />
              <Stack.Screen name="profile" />
            </Stack>
            <FeelingsDrawer />
          </View>
        </FeelingsDrawerProvider>
      </RestartDrawerProvider>
    </ChatProvider>
  );
}
