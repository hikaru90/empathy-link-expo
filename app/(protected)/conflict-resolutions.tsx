import baseColors from '@/baseColors.config';
import Header from '@/components/Header';
import { useAuthGuard } from '@/hooks/use-auth';
import { getConflictResolutions, updateConflictResolution, type ConflictResolution } from '@/lib/api/conflict-resolution';
import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';
import { useRouter } from 'expo-router';
import { Archive, ArchiveRestore, CheckCircle, ChevronLeft, Circle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RequestItem {
  id: string;
  analysisId: string;
  request: string;
  title: string;
  created: string;
}

interface StatsData {
  analyses: Array<{
    id: string;
    title: string;
    created: string;
    request?: string;
  }>;
}

export default function ConflictResolutionsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'active' | 'resolved' | 'open' | 'archived'>('active');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stats to get all analyses with requests
      const statsResult = await authClient.$fetch(`${API_BASE_URL}/api/stats`, {
        method: 'GET',
      });

      if ((statsResult as any).error) {
        throw new Error('Failed to load stats');
      }

      const statsData = (statsResult as any).data as StatsData;
      
      // Filter and map requests
      const requestsData = statsData.analyses
        .filter((analysis) => analysis.request && analysis.request.trim().length > 0)
        .map((analysis) => ({
          id: analysis.id,
          analysisId: analysis.id,
          request: analysis.request!,
          title: analysis.title,
          created: analysis.created,
        }));

      setRequests(requestsData);

      // Load resolutions
      const resolutionsData = await getConflictResolutions();
      setResolutions(Array.isArray(resolutionsData) ? resolutionsData : []);
    } catch (error) {
      console.error('Failed to load conflict resolutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResolutionForRequest = (analysisId: string): ConflictResolution | undefined => {
    if (!Array.isArray(resolutions)) {
      return undefined;
    }
    return resolutions.find(r => r.analysisId === analysisId);
  };

  const handleToggleResolved = async (request: RequestItem) => {
    const existingResolution = getResolutionForRequest(request.analysisId);
    const isCurrentlyResolved = existingResolution?.resolved || false;
    const newResolvedState = !isCurrentlyResolved;

    setUpdatingIds(prev => new Set(prev).add(request.analysisId));

    try {
      // Update the analysis directly
      await updateConflictResolution(request.analysisId, {
        resolved: newResolvedState,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to update conflict resolution:', error);
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.analysisId);
        return newSet;
      });
    }
  };

  const handleToggleArchive = async (request: RequestItem, event?: any) => {
    // Prevent the resolved toggle from firing
    if (event) {
      event.stopPropagation?.();
    }

    const existingResolution = getResolutionForRequest(request.analysisId);
    const isCurrentlyArchived = existingResolution?.archived || false;
    const newArchivedState = !isCurrentlyArchived;

    setUpdatingIds(prev => new Set(prev).add(request.analysisId));

    try {
      // Update the analysis directly
      await updateConflictResolution(request.analysisId, {
        archived: newArchivedState,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to archive conflict resolution:', error);
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.analysisId);
        return newSet;
      });
    }
  };

  // Filter out archived conflicts
  const nonArchivedRequests = requests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return !resolution?.archived;
  });

  const archivedRequests = requests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return resolution?.archived || false;
  });

  // Separate resolved and unresolved (excluding archived)
  const unresolvedRequests = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return !resolution?.resolved;
  });

  const resolvedRequests = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return resolution?.resolved || false;
  });

  // Filter requests based on active filter
  const filteredRequests = React.useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return nonArchivedRequests;
      case 'resolved':
        return resolvedRequests;
      case 'open':
        return unresolvedRequests;
      case 'archived':
        return archivedRequests;
      default:
        return nonArchivedRequests;
    }
  }, [activeFilter, nonArchivedRequests, resolvedRequests, unresolvedRequests, archivedRequests]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <ActivityIndicator size="large" color={baseColors.lilac} />
        <Text className="text-gray-600 mt-4">Laden...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Header />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Konfliktlösungen</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              onPress={() => setActiveFilter('active')}
              style={[
                styles.filterPill,
                activeFilter === 'active' && styles.filterPillActive
              ]}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === 'active' && styles.filterPillTextActive
              ]}>
                Aktiv ({nonArchivedRequests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('open')}
              style={[
                styles.filterPill,
                activeFilter === 'open' && styles.filterPillActive
              ]}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === 'open' && styles.filterPillTextActive
              ]}>
                Offen ({unresolvedRequests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('resolved')}
              style={[
                styles.filterPill,
                activeFilter === 'resolved' && styles.filterPillActive
              ]}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === 'resolved' && styles.filterPillTextActive
              ]}>
                Gelöst ({resolvedRequests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('archived')}
              style={[
                styles.filterPill,
                activeFilter === 'archived' && styles.filterPillActive
              ]}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === 'archived' && styles.filterPillTextActive
              ]}>
                Archiviert ({archivedRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filtered Content */}
          {filteredRequests.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.todoContainer}>
                {filteredRequests.map((item: RequestItem) => {
                  const isUpdating = updatingIds.has(item.analysisId);
                  const resolution = getResolutionForRequest(item.analysisId);
                  const isResolved = resolution?.resolved || false;
                  const isArchived = resolution?.archived || false;
                  
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.todoItem,
                        isResolved && styles.todoItemResolved,
                        isArchived && styles.todoItemArchived
                      ]}
                    >
                      <View style={styles.todoContent}>
                        <TouchableOpacity
                          onPress={() => handleToggleResolved(item)}
                          disabled={isUpdating}
                          style={styles.checkbox}
                        >
                          {isUpdating ? (
                            <ActivityIndicator size="small" color={baseColors.lilac} />
                          ) : (
                            <>
                              {isResolved ? (
                                <CheckCircle size={24} color="#10b981" fill="#10b981" />
                              ) : (
                                <Circle size={24} color={isArchived ? "#999" : baseColors.lilac} strokeWidth={2} />
                              )}
                            </>
                          )}
                        </TouchableOpacity>
                        <View style={styles.todoTextContainer}>
                          <Text style={[
                            styles.todoText,
                            isResolved && styles.todoTextResolved,
                            isArchived && styles.todoTextArchived
                          ]}>
                            {item.request}
                          </Text>
                          <Text style={styles.todoTitle}>{item.title}</Text>
                          <Text style={styles.todoDate}>{formatDate(item.created)}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => handleToggleArchive(item, e)}
                          style={styles.archiveButton}
                          disabled={isUpdating}
                        >
                          {isArchived ? (
                            <ArchiveRestore size={18} color="#999" />
                          ) : (
                            <Archive size={18} color="#999" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeFilter === 'active' && 'Noch keine aktiven Bitten in deinen Gesprächen.'}
                {activeFilter === 'open' && 'Keine offenen Konflikte.'}
                {activeFilter === 'resolved' && 'Keine gelösten Konflikte.'}
                {activeFilter === 'archived' && 'Keine archivierten Konflikte.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? 80 : Platform.OS === 'android' ? 160 : 120,
    paddingBottom: 64,
  },
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  filterPillActive: {
    backgroundColor: baseColors.lilac,
    borderColor: baseColors.lilac,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statNumberResolved: {
    color: '#10b981',
  },
  statNumberUnresolved: {
    color: baseColors.lilac,
  },
  statNumberArchived: {
    color: '#999',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  todoContainer: {
    gap: 12,
  },
  todoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todoItemResolved: {
    opacity: 0.6,
  },
  todoItemArchived: {
    opacity: 0.4,
    backgroundColor: '#f5f5f5',
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  checkbox: {
    marginTop: 2,
  },
  todoTextContainer: {
    flex: 1,
    gap: 4,
  },
  todoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    fontWeight: '500',
  },
  todoTextResolved: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  todoTextArchived: {
    color: '#999',
    opacity: 0.7,
  },
  todoTitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  todoDate: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 4,
  },
  archiveButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

