import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '@/components/Header';
import TabBar from '@/components/TabBar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hasPrefetchedRef = React.useRef(false);
  
  // Use a ref to store the bottom inset, but only lock it after we get a non-zero value
  // This prevents locking to 0 on first render when insets haven't initialized yet
  const bottomInsetRef = React.useRef<number | null>(null);
  
  // Only update the ref if we haven't set it yet, OR if the current value is 0 and we get a non-zero value
  // This ensures we capture the actual safe area inset once it's available
  if (bottomInsetRef.current === null || (bottomInsetRef.current === 0 && insets.bottom > 0)) {
    bottomInsetRef.current = Platform.OS === 'android' ? insets.bottom : 0;
  }
  
  const tabBarBottom = bottomInsetRef.current;
  
  // Debug: Log safe area insets to track inconsistencies
  React.useEffect(() => {
    console.log('[TabLayout] Safe area insets:', {
      platform: Platform.OS,
      currentBottom: insets.bottom,
      usedBottom: tabBarBottom,
      top: insets.top,
      left: insets.left,
      right: insets.right,
      isInitialized: bottomInsetRef.current !== null,
      willUpdate: bottomInsetRef.current === 0 && insets.bottom > 0,
    });
  }, [insets.bottom, tabBarBottom]);

  React.useEffect(() => {
    if (hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;

    const timeout = setTimeout(() => {
      // Keep chat as first paint, then warm up other tabs in background.
      (router as any).prefetch?.('/(protected)/(tabs)/stats');
      (router as any).prefetch?.('/(protected)/(tabs)/learn');
      (router as any).prefetch?.('/(protected)/(tabs)/feedback');
    }, 250);

    return () => clearTimeout(timeout);
  }, [router]);
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1001 }}>
        <Header />
      </View>
      <Tabs
          tabBar={() => <TabBar />}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}>
      <Tabs.Screen name="index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="stats" options={{ title: 'Statistik' }} />
      <Tabs.Screen name="learn" options={{ title: 'Lernen' }} />
      <Tabs.Screen name="feedback" options={{ title: 'Feedback' }} />
    </Tabs>
    </View>
  );
}
