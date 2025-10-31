import { Tabs } from 'expo-router';
import { BarChart3, Book, BotMessageSquare, Users } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';

import InvertedBorder from '@/assets/icons/InvertedBorder';
import baseColors from '@/baseColors.config';
import { HapticTab } from '@/components/haptic-tab';

const ICON_SIZE = 18;

export default function TabLayout() {
  
  return (
    <View style={{ flex: 1 }}>
      {/* Add your custom view here */}
      <InvertedBorder color="#f2f2f2" style={{ zIndex: 1002, position: 'absolute', bottom: 70, left: 0, height: 28, width: 28 }} />
      <InvertedBorder color="#f2f2f2" style={{ zIndex: 1002, position: 'absolute', bottom: 70, right: 0, height: 28, width: 28, transform: [{ scaleX: -1 }] }} />
      <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#222222',
            tabBarInactiveTintColor: '#999999',
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              backgroundColor: baseColors.offwhite,
              borderTopColor: 'transparent',
              paddingTop: 2,
              height: 70,
              
              ...Platform.select({
                ios: {
                  paddingBottom: 8,
                  position: 'absolute',
                },
                android: {
                },
              }),
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '500',
            },
            tabBarLabelPosition: 'below-icon',
          }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <BotMessageSquare size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistik',
          tabBarIcon: ({ color }) => <BarChart3 size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Lernen',
          tabBarIcon: ({ color }) => <Book size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <Users size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
    </View>
  );
}
