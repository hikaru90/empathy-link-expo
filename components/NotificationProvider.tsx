import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import {
  NotificationContext,
  useNotificationProvider,
} from '@/hooks/use-notifications';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '@/lib/notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const value = useNotificationProvider(!!user);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const received = addNotificationReceivedListener((notification) => {
      if (__DEV__) {
        console.log('[Notifications] Received:', notification.request.content);
      }
    });

    const response = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.path && typeof data.path === 'string') {
        router.push(data.path as never);
      }
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, [router]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
