import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ChatProvider } from '@/hooks/use-chat';

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
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="analysis/[id]" />
        <Stack.Screen name="learn/[slug]" />
        <Stack.Screen name="memories" />
        <Stack.Screen name="modal" />
        <Stack.Screen name="conflict-resolutions" />
      </Stack>
    </ChatProvider>
  );
}
