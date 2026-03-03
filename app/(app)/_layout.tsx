/**
 * Auth + Stack live here so the root _layout never mounts auth (avoids Expo #24248-style rebundle).
 * Static imports (no require()) to keep Metro dependency graph stable.
 */
import LayoutContentAndroidDev from '@/components/layout-content-android-dev';
import {
  RootLayoutContent,
  RootLayoutContentNoPostHog,
} from '@/components/layout-content-default';
import { posthog } from '@/lib/posthog';
import React from 'react';
import { Platform } from 'react-native';

const isAndroidDev = __DEV__ && Platform.OS === 'android';

export default function AppLayout() {
  if (isAndroidDev) {
    return <LayoutContentAndroidDev />;
  }
  if (posthog) {
    return <RootLayoutContent />;
  }
  return <RootLayoutContentNoPostHog />;
}
