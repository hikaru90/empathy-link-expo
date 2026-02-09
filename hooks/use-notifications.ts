import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { registerAndSyncPushToken } from '@/lib/notifications';
import { unregisterPushToken } from '@/lib/api/notifications';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const NOTIFICATIONS_TOKEN_KEY = 'notifications_token';

interface NotificationContextType {
  enabled: boolean;
  isSupported: boolean;
  isLoading: boolean;
  setEnabled: (value: boolean) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

export function useNotificationProvider(isAuthenticated: boolean): NotificationContextType {
  const [enabled, setEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isSupported = Platform.OS !== 'web';

  const loadPreference = useCallback(async () => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setEnabledState(stored === 'true');
    } catch {
      setEnabledState(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  const setEnabled = useCallback(
    async (value: boolean) => {
      if (!isSupported) return;

      setIsLoading(true);
      try {
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(value));

        if (value) {
          const token = await registerAndSyncPushToken();
          if (token) await AsyncStorage.setItem(NOTIFICATIONS_TOKEN_KEY, token);
          setEnabledState(true);
        } else {
          const storedToken = await AsyncStorage.getItem(NOTIFICATIONS_TOKEN_KEY);
          if (storedToken) {
            await unregisterPushToken(storedToken);
            await AsyncStorage.removeItem(NOTIFICATIONS_TOKEN_KEY);
          }
          setEnabledState(false);
        }
      } catch (e) {
        console.warn('[Notifications] Failed to update preference:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported]
  );

  // Register when user logs in and notifications are enabled
  useEffect(() => {
    if (!isAuthenticated || !isSupported || !enabled) return;

    registerAndSyncPushToken().then(async (token) => {
      if (token) await AsyncStorage.setItem(NOTIFICATIONS_TOKEN_KEY, token);
    });
  }, [isAuthenticated, enabled, isSupported]);

  return {
    enabled,
    isSupported,
    isLoading,
    setEnabled,
  };
}
