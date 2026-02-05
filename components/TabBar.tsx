import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import { BarChart3, Book, BotMessageSquare, MessageCirclePlus } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import InvertedBorder from '@/assets/icons/InvertedBorder';
import baseColors from '@/baseColors.config';

const ICON_SIZE = 18;

const tabs = [
  { name: 'index', path: '/(protected)/(tabs)/', label: 'Chat', icon: BotMessageSquare, highlight: false },
  { name: 'stats', path: '/(protected)/(tabs)/stats', label: 'Statistik', icon: BarChart3, highlight: false },
  { name: 'learn', path: '/(protected)/(tabs)/learn', label: 'Lernen', icon: Book, highlight: false },
  { name: 'feedback', path: '/(protected)/(tabs)/feedback', label: 'Feedback', icon: MessageCirclePlus, highlight: true },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (path: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(path as any);
  };

  const isActive = (path: string) => {
    // Match exact path or if we're on a sub-route of stats
    if (path.includes('/stats')) {
      return pathname.includes('/stats') || pathname.includes('/analysis');
    }
    // Match learn tab or learn detail routes
    if (path.includes('/learn')) {
      return pathname.includes('/learn');
    }
    // Match feedback tab
    if (path.includes('/feedback')) {
      return pathname.includes('/feedback');
    }
    // Index (Chat): active when we're on the root tab (pathname varies by platform/routing)
    const onStats = pathname.includes('/stats') || pathname.includes('/analysis');
    const onLearn = pathname.includes('/learn');
    const onFeedback = pathname.includes('/feedback');
    return !onStats && !onLearn && !onFeedback;
  };

  return (
    <View style={styles.container}>
      <InvertedBorder color={baseColors.white} style={styles.borderLeft} />
      <InvertedBorder color={baseColors.white} style={styles.borderRight} />
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          const isHighlight = tab.highlight === true;
          const color = isHighlight
            ? (active ? baseColors.primary : baseColors.purple)
            : (active ? '#222222' : '#999999');

          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, isHighlight && styles.tabHighlight]}
              onPress={() => handleTabPress(tab.path)}
            >
              <Icon size={ICON_SIZE} color={color} />
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  borderLeft: {
    zIndex: 1002,
    position: 'absolute',
    bottom: 70,
    left: 0,
    height: 28,
    width: 28,
  },
  borderRight: {
    zIndex: 1002,
    position: 'absolute',
    bottom: 70,
    right: 0,
    height: 28,
    width: 28,
    transform: [{ scaleX: -1 }],
  },
  tabBar: {
    position:'relative',
    zIndex: 1000,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopColor: 'transparent',
    paddingTop: 2,
    height: 70,
    paddingBottom: 8,
    // ...Platform.select({
    //   ios: {
    //   },
    //   android: {},
    // }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabHighlight: {
    marginHorizontal: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
