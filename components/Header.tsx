import FlameIconImage from '@/assets/icons/Flame.png';
import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';
import { getAllAnalyses } from '@/lib/api/analysis';
import { getSuperCommunicatorData, type SuperCommunicatorData } from '@/lib/api/stats';
import { getStreak, type StreakResponse } from '@/lib/api/streak';
import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';
import { calculateSuperCommunicatorData } from '@/lib/utils/super-communicator-calculator';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Brain, FileText, LogOut, UserRoundCog } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SparklePill from './SparklePill';
import StatsStreak from './stats/StatsStreak';
import SuperCommunicatorBadge from './stats/SuperCommunicatorBadge';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState(false);
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [superCommunicatorData, setSuperCommunicatorData] = useState<SuperCommunicatorData | null>(null);

  // Animation for modal slide-up
  const slideAnim = useState(new Animated.Value(300))[0];
  const streakSlideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    fetchUnreadCount();
    fetchStreakData();
    fetchSuperCommunicatorData();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    const streakInterval = setInterval(fetchStreakData, 60 * 1000);
    const superCommInterval = setInterval(fetchSuperCommunicatorData, 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(streakInterval);
      clearInterval(superCommInterval);
    };
  }, []);

  useEffect(() => {
    if (isStreakSheetOpen) {
      Animated.spring(streakSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(streakSlideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isStreakSheetOpen]);

  useEffect(() => {
    if (isUserMenuOpen || isNotificationsOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isUserMenuOpen, isNotificationsOpen]);

  async function fetchUnreadCount() {
    try {
      const result = await authClient.$fetch(`${API_BASE_URL}/api/messages?unread=true&perPage=1`);

      // Better Auth returns {data: ..., error: ...}
      if (result.error) {
        console.error('Failed to fetch unread count:', result.error);
        return;
      }

      setUnreadCount((result.data as { unreadCount: number }).unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }

  async function fetchStreakData() {
    try {
      const streak = await getStreak();
      setStreakData(streak);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
      // Set default streak data on error
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        lastChatDate: null,
        totalChatsCompleted: 0,
        chatDates: [],
      });
    }
  }

  async function fetchSuperCommunicatorData() {
    try {
      // Try to fetch from backend first
      const backendData = await getSuperCommunicatorData();
      
      if (backendData) {
        setSuperCommunicatorData(backendData);
        return;
      }

      // Fallback: Calculate from analyses on frontend
      const allAnalyses = await getAllAnalyses();
      const calculatedData = calculateSuperCommunicatorData(allAnalyses || []);
      setSuperCommunicatorData(calculatedData);
    } catch (err) {
      console.error('Error fetching super communicator data:', err);
      // Try fallback calculation
      try {
        const allAnalyses = await getAllAnalyses();
        const calculatedData = calculateSuperCommunicatorData(allAnalyses || []);
        setSuperCommunicatorData(calculatedData);
      } catch (fallbackErr) {
        console.error('Fallback calculation also failed:', fallbackErr);
        const emptyData = calculateSuperCommunicatorData([]);
        setSuperCommunicatorData(emptyData);
      }
    }
  }

  function handleLogout() {
    setIsUserMenuOpen(false);
    signOut();
  }

  function handleMemoryNavigation() {
    setIsUserMenuOpen(false);
    router.push('/memories');
  }

  function handleProfileNavigation() {
    setIsUserMenuOpen(false);
    router.push('/profile');
  }

  return (
    <>
      <View style={styles.nav}>
        <View style={styles.navBackground} className="pointer-events-none">
          <LinearGradient
            colors={[baseColors.background, baseColors.background+'ee', baseColors.background+'00']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ height: 100, position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: -1 }}
          >
          </LinearGradient>
        </View>
        <View className="flex-row gap-2">
          {/* User Menu Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsUserMenuOpen(true)}
          >
            <UserRoundCog size={12} color="white" />
          </TouchableOpacity>
          <View className="size-8 bg-white rounded-full opacity-0 pointer-events-none" />
        </View>

        {/* Logo/Sparkle Pill */}
        {/* <GradientImage style={styles.logo} fast /> */}
        <SparklePill />

        <View className="flex-row gap-2">
          {/* Streak Button */}
          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onPress={() => setIsStreakSheetOpen(true)}
          >

            <Image source={FlameIconImage} style={{ width: 34, height: 34 }} />

            {streakData && streakData.currentStreak > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {streakData.currentStreak > 9 ? '9+' : streakData.currentStreak}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsNotificationsOpen(true)}
          >
            <Bell size={12} color="white" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isUserMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUserMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsUserMenuOpen(false)}
        >
          <Animated.View
            style={[
              styles.drawerContent,
              { transform: [{ translateY: slideAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Profil</Text>
              {user && (
                <Text style={styles.drawerSubtitle}>{user.email}</Text>
              )}
            </View>
            <View style={styles.drawerBody}>
              {/* Super Communicator Badge */}
              <SuperCommunicatorBadge 
                data={superCommunicatorData} 
                onPress={handleProfileNavigation}
              />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleMemoryNavigation}
              >
                <Text style={styles.menuItemText}>Erinnerungsspeicher</Text>
                <Brain size={16} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleProfileNavigation}
              >
                <Text style={styles.menuItemText}>Profil</Text>
                <UserRoundCog size={16} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>Chat Settings</Text>
                <FileText size={16} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemDark}
                onPress={handleLogout}
              >
                <Text style={styles.menuItemTextDark}>Logout</Text>
                <LogOut size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isNotificationsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNotificationsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsNotificationsOpen(false)}
        >
          <Animated.View
            style={[
              styles.drawerContent,
              styles.drawerContentTall,
              { transform: [{ translateY: slideAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Messages</Text>
            </View>
            <ScrollView style={styles.drawerBody}>
              {/* Inbox component would go here */}
              <Text style={styles.placeholderText}>No new messages</Text>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Streak Modal */}
      <Modal
        visible={isStreakSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStreakSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsStreakSheetOpen(false)}
        >
          <Animated.View
            style={[
              styles.drawerContent,
              { transform: [{ translateY: streakSlideAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Streak</Text>
            </View>
            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              {streakData ? (
                <StatsStreak
                  data={{
                    currentStreak: streakData.currentStreak,
                    longestStreak: streakData.longestStreak,
                    lastChatDate: streakData.lastChatDate,
                    totalChatsCompleted: streakData.totalChatsCompleted,
                  }}
                />
              ) : (
                <Text style={styles.placeholderText}>Loading streak data...</Text>
              )}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const shadow = {
  // shadowColor: '#000',
  shadowColor: baseColors.background,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 10,
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' || Platform.OS === 'android' ? 58 : 16, // Account for status bar
    // backdropFilter: 'blur(10px)', // For web blur effect
  },
  navBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: baseColors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadow,
  },
  logo: {
    width: 32,
    height: 16,
    borderRadius: 8,
    boxShadow: 'inset 0 0 5px 0 rgba(255, 255, 255, 0.1), 0 4px 20px 0 rgba(163, 102, 255, 0.3)',
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    width: 'auto',
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: baseColors.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: baseColors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 32,
  },
  drawerContentTall: {
    height: '80%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: baseColors.black+'33',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginLeft: 8
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  drawerBody: {
    paddingHorizontal: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: baseColors.white+'88',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 14,
    color: '#000',
  },
  menuItemDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: baseColors.forest,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  menuItemTextDark: {
    fontSize: 14,
    color: '#fff',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
});
