import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { CheckCircle, Circle, ChevronLeft, Archive, ArchiveRestore } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import baseColors from '@/baseColors.config';
import Header from '@/components/Header';
import { useAuthGuard } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';
import { getConflictResolutions, updateConflictResolution, upsertConflictResolution, type ConflictResolution } from '@/lib/api/conflict-resolution';

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
      if (existingResolution) {
        await updateConflictResolution(existingResolution.id, {
          resolved: newResolvedState,
        });
      } else {
        try {
          await upsertConflictResolution(
            request.analysisId,
            request.request,
            undefined,
            false
          );
          const updated = await getConflictResolutions();
          const newResolution = Array.isArray(updated) 
            ? updated.find(r => r.analysisId === request.analysisId)
            : undefined;
          if (newResolution) {
            await updateConflictResolution(newResolution.id, {
              resolved: newResolvedState,
            });
          }
        } catch (createError) {
          console.warn('Could not create conflict resolution:', createError);
        }
      }
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
      if (existingResolution) {
        await updateConflictResolution(existingResolution.id, {
          archived: newArchivedState,
        });
      } else {
        try {
          await upsertConflictResolution(
            request.analysisId,
            request.request,
            undefined,
            false
          );
          const updated = await getConflictResolutions();
          const newResolution = Array.isArray(updated) 
            ? updated.find(r => r.analysisId === request.analysisId)
            : undefined;
          if (newResolution) {
            await updateConflictResolution(newResolution.id, {
              archived: newArchivedState,
            });
          }
        } catch (createError) {
          console.warn('Could not create conflict resolution:', createError);
        }
      }
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

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{nonArchivedRequests.length}</Text>
              <Text style={styles.statLabel}>Aktiv</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberResolved]}>{resolvedRequests.length}</Text>
              <Text style={styles.statLabel}>Gelöst</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberUnresolved]}>{unresolvedRequests.length}</Text>
              <Text style={styles.statLabel}>Offen</Text>
            </View>
            {archivedRequests.length > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.statNumberArchived]}>{archivedRequests.length}</Text>
                <Text style={styles.statLabel}>Archiviert</Text>
              </View>
            )}
          </View>

          {/* Unresolved Section */}
          {unresolvedRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offene Konflikte</Text>
              <View style={styles.todoContainer}>
                {unresolvedRequests.map((item) => {
                  const isUpdating = updatingIds.has(item.analysisId);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.todoItem}
                      onPress={() => handleToggleResolved(item)}
                      disabled={isUpdating}
                    >
                      <View style={styles.todoContent}>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={baseColors.lilac} style={styles.checkbox} />
                        ) : (
                          <View style={styles.checkbox}>
                            <Circle size={24} color={baseColors.lilac} strokeWidth={2} />
                          </View>
                        )}
                        <View style={styles.todoTextContainer}>
                          <Text style={styles.todoText}>{item.request}</Text>
                          <Text style={styles.todoTitle}>{item.title}</Text>
                          <Text style={styles.todoDate}>{formatDate(item.created)}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => handleToggleArchive(item, e)}
                          style={styles.archiveButton}
                          disabled={isUpdating}
                        >
                          <Archive size={18} color="#999" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Resolved Section */}
          {resolvedRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gelöste Konflikte</Text>
              <View style={styles.todoContainer}>
                {resolvedRequests.map((item) => {
                  const isUpdating = updatingIds.has(item.analysisId);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.todoItem, styles.todoItemResolved]}
                      onPress={() => handleToggleResolved(item)}
                      disabled={isUpdating}
                    >
                      <View style={styles.todoContent}>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={baseColors.lilac} style={styles.checkbox} />
                        ) : (
                          <View style={styles.checkbox}>
                            <CheckCircle size={24} color="#10b981" fill="#10b981" />
                          </View>
                        )}
                        <View style={styles.todoTextContainer}>
                          <Text style={[styles.todoText, styles.todoTextResolved]}>
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
                          <Archive size={18} color="#999" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Archived Section */}
          {archivedRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Archivierte Konflikte</Text>
              <View style={styles.todoContainer}>
                {archivedRequests.map((item) => {
                  const isUpdating = updatingIds.has(item.analysisId);
                  const resolution = getResolutionForRequest(item.analysisId);
                  const isResolved = resolution?.resolved || false;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.todoItem, styles.todoItemArchived]}
                      onPress={() => handleToggleResolved(item)}
                      disabled={isUpdating}
                    >
                      <View style={styles.todoContent}>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={baseColors.lilac} style={styles.checkbox} />
                        ) : (
                          <View style={styles.checkbox}>
                            {isResolved ? (
                              <CheckCircle size={24} color="#10b981" fill="#10b981" />
                            ) : (
                              <Circle size={24} color="#999" strokeWidth={2} />
                            )}
                          </View>
                        )}
                        <View style={styles.todoTextContainer}>
                          <Text style={[styles.todoText, styles.todoTextArchived]}>
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
                          <ArchiveRestore size={18} color="#999" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {requests.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Noch keine Bitten in deinen Gesprächen.
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
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
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

