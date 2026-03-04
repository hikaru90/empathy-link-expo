import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * Root index: single entry point. Redirects to login or main app based on auth state.
 */
export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: baseColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={baseColors.primary} />
        <Text style={{ marginTop: 12, color: baseColors.black }}>Laden…</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return <Redirect href="/(protected)/(tabs)" />;
}
