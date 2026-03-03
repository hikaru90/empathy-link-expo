import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import { useAuthGuard } from '@/hooks/use-auth';
import { deleteAnalysis, getAllAnalyses } from '@/lib/api/analysis';

interface Analysis {
  id: string;
  title: string;
  created: string;
}

export default function AnalysesListScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyses();
    }
  }, [isAuthenticated]);

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      const data = await getAllAnalyses();
      setAnalyses(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analyses:', err);
      setError('Analysen konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    Alert.alert(
      'Analyse löschen',
      `Möchtest du "${title}" wirklich löschen?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnalysis(id);
              setAnalyses(prev => prev.filter(a => a.id !== id));
            } catch (err) {
              console.error('Error deleting analysis:', err);
              Alert.alert('Fehler', 'Analyse konnte nicht gelöscht werden');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const renderRightActions = (analysis: Analysis) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(analysis.id, analysis.title)}
      >
        <Trash2 size={20} color="#fff" />
      </TouchableOpacity>
    );
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(protected)/(tabs)/stats');
            }
          }}
        >
          <ChevronLeft size={16} color="#000" />
          <Text style={styles.backButtonText}>zurück</Text>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Meine Reflektionen</Text>
          <Text style={styles.subtitle}>
            {analyses.length} {analyses.length === 1 ? 'Reflexion' : 'Reflexionen'}
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : analyses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Noch keine Reflexionen vorhanden</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {analyses.map((analysis) => (
                <Swipeable
                  key={analysis.id}
                  renderRightActions={() => renderRightActions(analysis)}
                  overshootRight={false}
                >
                  <TouchableOpacity
                    style={styles.analysisItem}
                    onPress={() => router.push(`/analysis/${analysis.id}`)}
                  >
                    <View style={styles.analysisContent}>
                      <Text style={styles.analysisTitle} numberOfLines={1}>
                        {analysis.title}
                      </Text>
                      <Text style={styles.analysisDate}>
                        {formatDate(analysis.created)}
                      </Text>
                    </View>
                    <View style={styles.iconButton}>
                      <ChevronRight size={12} color="#000" />
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: baseColors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? 80 : Platform.OS === 'android' ? 160 : 120,
    paddingBottom: Platform.OS === 'ios' ? 120 : 110,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 14,
    color: '#000',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    gap: 8,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  analysisContent: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  analysisDate: {
    fontSize: 12,
    color: '#666',
  },
  iconButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
});
