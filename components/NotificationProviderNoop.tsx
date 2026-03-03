import React from 'react';
import { NotificationContext } from '@/lib/notification-context';

const noopValue = {
  enabled: false,
  isSupported: false,
  isLoading: false,
  setEnabled: async (_value: boolean) => {},
};

/** No-op notification provider for Expo Go; avoids loading expo-notifications (which causes endless reload on Android). */
export function NotificationProviderNoop({ children }: { children: React.ReactNode }) {
  if (__DEV__) console.log('[Layout] NotificationProviderNoop render');
  return (
    <NotificationContext.Provider value={noopValue}>
      {children}
    </NotificationContext.Provider>
  );
}
