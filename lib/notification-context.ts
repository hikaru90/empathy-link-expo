import { createContext, useContext } from 'react';

export interface NotificationContextType {
  enabled: boolean;
  isSupported: boolean;
  isLoading: boolean;
  setEnabled: (value: boolean) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
