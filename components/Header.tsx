import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';
import { getStreak, type StreakResponse } from '@/lib/api/streak';
import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Brain, FileText, Flame, LogOut, UserRoundCog } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GradientImage from './GradientImage';
import StatsStreak from './stats/StatsStreak';

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

  // Animation for modal slide-up
  const slideAnim = useState(new Animated.Value(300))[0];
  // Animation for tooltip fade
  const tooltipOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchUnreadCount();
    fetchStreakData();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    const streakInterval = setInterval(fetchStreakData, 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(streakInterval);
    };
  }, []);

  useEffect(() => {
    if (isStreakSheetOpen) {
      // Animate tooltip fade in
      Animated.spring(tooltipOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Animate tooltip fade out
      Animated.spring(tooltipOpacity, {
        toValue: 0,
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

  function handleLogout() {
    setIsUserMenuOpen(false);
    signOut();
  }

  function handleMemoryNavigation() {
    setIsUserMenuOpen(false);
    router.push('/memories');
  }

  return (
    <>
      <View style={styles.nav}>
        <View style={styles.navBackground} className="pointer-events-none">
          <LinearGradient
            colors={[baseColors.background, 'rgba(231, 217, 249, 0.8)', 'rgba(231, 217, 249, 0)']}
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
        <GradientImage style={styles.logo} fast />

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
            <Flame size={34} color={baseColors.pink} fill={baseColors.pink} style={{ marginTop: -4 }} />
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
              <Text style={styles.drawerTitle}>User</Text>
              {user && (
                <Text style={styles.drawerSubtitle}>{user.email}</Text>
              )}
            </View>
            <View style={styles.drawerBody}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleMemoryNavigation}
              >
                <Text style={styles.menuItemText}>Erinnerungsspeicher</Text>
                <Brain size={16} color="#000" />
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

      {/* Streak Tooltip */}
      {isStreakSheetOpen && (
        <Modal
          visible={isStreakSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsStreakSheetOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0)' }}
            onPress={() => setIsStreakSheetOpen(false)}
          >
            <Animated.View
              style={[
                styles.tooltipContent,
                {
                  opacity: tooltipOpacity,
                  top: Platform.OS === 'ios' ? 78 : 58, // Position below header
                  right: 20, // Align with right side buttons
                  maxWidth: 320,
                  backgroundColor: baseColors.rose,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Tooltip arrow */}
              <View style={{
                position: 'absolute',
                top: -8,
                right: 47,
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderBottomWidth: 8,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: baseColors.rose,
              }} />

              {streakData ? (
                <ScrollView style={{maxHeight: 400}} showsVerticalScrollIndicator={false}>
                  <StatsStreak
                    data={{
                      currentStreak: streakData.currentStreak,
                      longestStreak: streakData.longestStreak,
                      lastChatDate: streakData.lastChatDate,
                      totalChatsCompleted: streakData.totalChatsCompleted,
                    }}
                  />
                </ScrollView>
              ) : (
                <View style={{maxHeight: 400}}>
                  <Text style={styles.placeholderText}>Loading streak data...</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const shadow = {
  // shadowColor: '#000',
  shadowColor: baseColors.lilac,
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
    backgroundColor: baseColors.black,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#fff',
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
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#000',
  },
  menuItemDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingHorizontal: 12,
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
  tooltipContent: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 2000,
  },
});
