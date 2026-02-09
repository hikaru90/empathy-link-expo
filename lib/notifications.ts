/**
 * Push notification registration and handling
 *
 * Requires a development build (not Expo Go). Push notifications do not work on web.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken } from './api/notifications';

// Foreground: show banner, play sound, update badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Register for push notifications and return the Expo push token.
 * Returns null on web, simulator, or when permission is denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    console.warn('[Notifications] Push requires a physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.warn('[Notifications] Project ID not found – configure EAS project');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e) {
    console.warn('[Notifications] Failed to get push token:', e);
    return null;
  }
}

/**
 * Register for push notifications and send the token to the backend.
 * Call when the user is logged in and has enabled notifications.
 */
export async function registerAndSyncPushToken(): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return null;

  try {
    await registerPushToken(token);
  } catch (e) {
    console.warn('[Notifications] Failed to sync token to backend:', e);
  }

  return token;
}
