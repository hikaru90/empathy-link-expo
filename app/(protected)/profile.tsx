import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import baseColors from '@/baseColors.config';
import StatsSuperCommunicator, { type SuperCommunicatorData } from '@/components/stats/StatsSuperCommunicator';
import { useAuthGuard } from '@/hooks/use-auth';
import { getAllAnalyses } from '@/lib/api/analysis';
import { getSuperCommunicatorData } from '@/lib/api/stats';
import { calculateSuperCommunicatorData } from '@/lib/utils/super-communicator-calculator';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const [superCommunicatorData, setSuperCommunicatorData] = useState<SuperCommunicatorData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuperCommunicatorData();
    }
  }, [user]);

  const fetchSuperCommunicatorData = async () => {
    try {
      setLoadingData(true);
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
    } finally {
      setLoadingData(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={baseColors.lilac} />
          <Text style={styles.loadingText}>Lade Profil...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[baseColors.background, 'rgba(231, 217, 249, 0.8)', 'rgba(231, 217, 249, 0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerGradient}
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(protected)/(tabs)/stats');
            }
          }}
        >
          <ChevronLeft size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Super-Kommunikator</Text>
            <Text style={styles.sectionDescription}>
              Verfolge deinen Fortschritt auf dem Weg zur Kommunikationsmeisterschaft. Jeder Chat und jede Lerneinheit bringt dich weiter.
            </Text>
            <StatsSuperCommunicator data={superCommunicatorData} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' || Platform.OS === 'android' ? 58 : 16,
    paddingBottom: 16,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: -1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  sectionsContainer: {
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

