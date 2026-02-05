/**
 * PostHog analytics and error tracking
 *
 * Set EXPO_PUBLIC_POSTHOG_API_KEY in .env to the **Project API key** (Project settings → Project API key).
 * Do not use a Personal API key—it will return 401. Optional: EXPO_PUBLIC_POSTHOG_HOST (default: https://us.i.posthog.com)
 *
 * Storage: On web, expo-file-system isn't supported, so we use AsyncStorage
 * (localStorage-backed). On native, PostHog uses expo-file-system by default.
 * SecureStore is not used here—it's for small secrets and isn't available on web.
 *
 * @see https://posthog.com/docs/libraries/react-native
 * @see https://posthog.com/docs/error-tracking
 * @see https://posthog.com/docs/error-tracking/installation/react-native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export const posthog =
  apiKey && apiKey.length > 0
    ? new PostHog(apiKey, {
        host,
        // Web: expo-file-system isn't supported; use AsyncStorage (localStorage-backed)
        ...(Platform.OS === 'web' && { customStorage: AsyncStorage }),
        // Disable in local dev to avoid noise (optional; remove to always send)
        disabled: __DEV__ && !process.env.EXPO_PUBLIC_POSTHOG_DEV_ENABLED,
        // Error tracking: autocapture uncaught exceptions, unhandled rejections, console error/warn
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: ['error', 'warn'],
          },
        },
        // Optional: capture app lifecycle (installed, updated, opened, backgrounded)
        captureAppLifecycleEvents: true,
      })
    : null;

export function captureException(error: unknown): void {
  if (posthog && error != null) {
    posthog.captureException(error);
  }
}
