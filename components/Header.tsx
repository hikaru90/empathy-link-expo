import FlameIconImage from '@/assets/icons/Flame.png';
import baseColors from '@/baseColors.config';
import BottomDrawer from '@/components/BottomDrawer';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useRestartDrawer } from '@/hooks/use-restart-drawer';
import { getAllAnalyses } from '@/lib/api/analysis';
import { createLearningSession } from '@/lib/api/learn';
import { getSuperCommunicatorData, type SuperCommunicatorData } from '@/lib/api/stats';
import { getStreak, type StreakResponse } from '@/lib/api/streak';
import { authClient } from '@/lib/auth';
import { API_BASE_URL, EXPO_APP_URL } from '@/lib/config';
import { calculateSuperCommunicatorData } from '@/lib/utils/super-communicator-calculator';
import * as Clipboard from 'expo-clipboard';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Brain, FileText, LogOut, RotateCcw, RotateCcwSquare, UserPlus, UserRoundCog } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SparklePill from './SparklePill';
import StatsStreak from './stats/StatsStreak';
import SuperCommunicatorBadge from './stats/SuperCommunicatorBadge';

const jungleImage = require('@/assets/images/Jungle.jpg');

interface HeaderProps {
  className?: string;
}

function Header({ className }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { restartOnboarding } = useOnboarding();
  const router = useRouter();
  const { isOpen: isRestartDrawerOpen, selectedTopic, closeDrawer: closeRestartDrawer } = useRestartDrawer();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState(false);
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [superCommunicatorData, setSuperCommunicatorData] = useState<SuperCommunicatorData | null>(null);
  const [isRestartingTopic, setIsRestartingTopic] = useState(false);
  const [inviteCopyFeedback, setInviteCopyFeedback] = useState(false);
  const inviteFlashAnim = useRef(new Animated.Value(0)).current;
  const inviteTextOpacity = useRef(new Animated.Value(0)).current;

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

  function handleChatSettingsNavigation() {
    setIsUserMenuOpen(false);
    router.push('/chat-settings');
  }

  async function handleRestartOnboarding() {
    setIsUserMenuOpen(false);
    await restartOnboarding();
  }

  async function handleInviteFriend() {
    const inviteText = `Empathy Link – Mach Empathie  zu deiner Superpower. ${EXPO_APP_URL}`;
    await Clipboard.setStringAsync(inviteText);
    setInviteCopyFeedback(true);

    // Flash button background
    inviteFlashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(inviteFlashAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
      Animated.timing(inviteFlashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Fade in "Link copied" text (with delay)
    inviteTextOpacity.setValue(0);
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(inviteTextOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out and reset after 2.5s
    setTimeout(() => {
      Animated.timing(inviteTextOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setInviteCopyFeedback(false));
    }, 2500);
  }

  async function handleRestartTopic() {
    if (!user?.id || !selectedTopic?.expand?.currentVersion?.id || isRestartingTopic) {
      return;
    }

    setIsRestartingTopic(true);
    try {
      const newSession = await createLearningSession(
        user.id,
        selectedTopic.id,
        selectedTopic.expand.currentVersion.id
      );

      if (newSession) {
        closeRestartDrawer();
        router.push(`/(protected)/learn/${selectedTopic.slug}` as any);
      } else {
        console.error('Failed to create a new learning session.');
      }
    } catch (error) {
      console.error('Failed to restart topic:', error);
    } finally {
      setIsRestartingTopic(false);
    }
  }

  function handleViewResults() {
    if (selectedTopic) {
      closeRestartDrawer();
      router.push(`/(protected)/learn/${selectedTopic.slug}` as any);
    }
  }

  return (
    <>
      <View style={styles.nav} pointerEvents="box-none">
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

      <BottomDrawer
        visible={isUserMenuOpen}
        onClose={() => {
          setIsUserMenuOpen(false);
          setInviteCopyFeedback(false);
          inviteTextOpacity.setValue(1);
        }}
        title="Profil"
        subtitle={user?.email}
      >
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
          onPress={handleChatSettingsNavigation}
        >
          <Text style={styles.menuItemText}>Chat-Einstellungen</Text>
          <FileText size={16} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleRestartOnboarding}
        >
          <Text style={styles.menuItemText}>Onboarding erneut starten</Text>
          <RotateCcwSquare size={16} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { overflow: 'hidden' }]}
          onPress={handleInviteFriend}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.inviteFlashOverlay,
              {
                opacity: inviteFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.35],
                }),
              },
            ]}
          />
          <View style={styles.menuItemContent}>
            <Animated.Text
              style={[
                styles.menuItemText,
                inviteCopyFeedback && styles.inviteFeedback,
                { opacity: inviteCopyFeedback ? inviteTextOpacity : 1 },
              ]}
            >
              {inviteCopyFeedback ? 'Link in Zwischenablage kopiert' : 'Freund einladen'}
            </Animated.Text>
            <UserPlus size={16} color="#000" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItemDark}
          onPress={handleLogout}
        >
          <Text style={styles.menuItemTextDark}>Logout</Text>
          <LogOut size={16} color="#ef4444" />
        </TouchableOpacity>
      </BottomDrawer>

      <BottomDrawer
        visible={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Messages"
        tall
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.placeholderText}>No new messages</Text>
        </ScrollView>
      </BottomDrawer>

      <BottomDrawer
        visible={isStreakSheetOpen}
        onClose={() => setIsStreakSheetOpen(false)}
        title="Streak"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
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
      </BottomDrawer>

      <BottomDrawer
        visible={isRestartDrawerOpen}
        onClose={closeRestartDrawer}
        title="Modul neu starten?"
      >
        <Text style={{ marginLeft: 8 }}>
          Möchtest du das Modul "{selectedTopic?.expand?.currentVersion?.titleDE?.split('||')[0]?.trim()}" neu starten oder deine bisherigen Ergebnisse ansehen?
        </Text>
        <View style={{ gap: 12, marginTop: 16 }}>
          <TouchableOpacity
            testID="restart-drawer-view-results"
            onPress={handleViewResults}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemText}>Ergebnisse ansehen</Text>
            <FileText size={16} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            testID="restart-drawer-restart"
            onPress={handleRestartTopic}
            disabled={isRestartingTopic}
            style={{ opacity: isRestartingTopic ? 0.5 : 1 }}
          >
            <ImageBackground
              source={jungleImage}
              resizeMode="cover"
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 16,
                paddingRight: 12,
                paddingVertical: 10,
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.1)',
              }}
            >
              {isRestartingTopic ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 14, color: baseColors.offwhite }}>
                    Neu starten
                  </Text>
                  <RotateCcw size={16} color="#fff" style={{ position: 'relative', backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                </>
              )}
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </BottomDrawer>
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
    backgroundColor: baseColors.zest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: baseColors.forest,
    fontSize: 8,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
  },
  inviteFeedback: {
    color: baseColors.purple,
  },
  inviteFlashOverlay: {
    backgroundColor: baseColors.forest,
    borderRadius: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    zIndex: 1,
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
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    position: 'relative',
    zIndex: 10,
    borderColor: 'white',
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
});

export default React.memo(Header);
