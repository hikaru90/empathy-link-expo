import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

const isAndroidDev = __DEV__ && Platform.OS === 'android';

/**
 * Root index: single entry point so the app always opens here first.
 * Redirects to login or main app based on auth state, avoiding redirect loops
 * that can occur when (protected) layout mounts and redirects repeatedly.
 */
export default function IndexScreen() {
  if (__DEV__) console.log('[Index] IndexScreen render start');
  const mountCount = useRef(0);
  useEffect(() => {
    if (isAndroidDev) return; // No effect on Android dev - prevents rebundle loop (trigger is after Redirect → login mount)
    if (__DEV__) console.log('[Index] effect START (last log before rebundle = likely trigger)');
    mountCount.current += 1;
    if (__DEV__) console.log('[Index] mount #' + mountCount.current);
    if (__DEV__) console.log('[Index] effect END');
    return () => {
      if (__DEV__) console.log('[Index] effect CLEANUP (unmounting)');
    };
  }, []);

  if (__DEV__) console.log('[Index] about to call useAuth()');
  const { user, isLoading } = useAuth();
  if (__DEV__) console.log('[Index] render isLoading=', isLoading, 'user=', user ? user.email : null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: baseColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={baseColors.primary} />
        <Text style={{ marginTop: 12, color: baseColors.black }}>Laden…</Text>
      </View>
    );
  }

  if (!user) {
    if (__DEV__) console.log('[Index] returning Redirect to /(auth)/login');
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return <Redirect href="/(protected)/(tabs)" />;
}
