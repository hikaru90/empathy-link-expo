import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import baseColors from '@/baseColors.config';
import { LinearGradient } from 'expo-linear-gradient';
import StatsInsights from '@/components/stats/StatsInsights';
import { getMemories, type Memory } from '@/lib/api/memories';

export default function MemoriesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const data = await getMemories();
      console.log('[Memories] Fetched memories count:', data.length);
      console.log('[Memories] Sample data:', data.slice(0, 3));
      setMemories(data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Erinnerungsspeicher</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={baseColors.lilac} />
            <Text style={styles.loadingText}>Lade Erinnerungen...</Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {/* Insights Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Beziehungsinsights</Text>
              <Text style={styles.sectionDescription}>
                Erkenntnisse über deine Kommunikationsmuster
              </Text>
              {memories.filter(m => m.type === 'relationship' || m.type === 'identity').length > 0 ? (
                <StatsInsights data={memories} />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Noch keine Beziehungsinsights vorhanden. Führe Gespräche, um Insights zu sammeln.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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
  emptyState: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
