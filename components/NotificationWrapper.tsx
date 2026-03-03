import { NotificationProviderNoop } from '@/components/NotificationProviderNoop';
import Constants from 'expo-constants';
import React from 'react';
import { Platform } from 'react-native';

/** Use noop in Expo Go or in __DEV__ on Android to avoid endless reload; real NotificationProvider otherwise. */
export function NotificationWrapper({ children }: { children: React.ReactNode }) {
  if (__DEV__) console.log('[Layout] NotificationWrapper render');
  const isExpoGo = Constants.appOwnership === 'expo';
  const useNoop = isExpoGo || (__DEV__ && Platform.OS === 'android');
  if (useNoop) return <NotificationProviderNoop>{children}</NotificationProviderNoop>;
  const { NotificationProvider } = require('@/components/NotificationProvider');
  return <NotificationProvider>{children}</NotificationProvider>;
}
