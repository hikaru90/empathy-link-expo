import baseColors from '@/baseColors.config';
import { getConflictResolutions, updateConflictResolution, upsertConflictResolution, type ConflictResolution } from '@/lib/api/conflict-resolution';
import { useRouter } from 'expo-router';
import { Archive, CheckCircle, Circle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface RequestItem {
  id: string;
  analysisId: string;
  request: string;
  title: string;
  created: string;
}

interface StatsConflictResolutionProps {
  requests: RequestItem[];
}

interface SwipeableRowProps {
  item: RequestItem;
  isResolved: boolean;
  isUpdating: boolean;
  onToggleResolved: () => void;
  onArchive: () => void;
  isLast: boolean;
  CheckboxComponent: React.ReactNode;
}

const SWIPE_THRESHOLD = 100;

function SwipeableRow({ item, isResolved, isUpdating, onToggleResolved, onArchive, isLast, CheckboxComponent }: SwipeableRowProps) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = React.useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
    }
  );

  React.useEffect(() => {
    const listener = translateX.addListener(({ value }) => {
      // Clamp to only allow left swipes (negative values)
      if (value > 0) {
        translateX.setValue(0);
      }
    });

    return () => {
      translateX.removeListener(listener);
    };
  }, []);

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const translationX = event.nativeEvent.translationX || 0;
      const velocityX = event.nativeEvent.velocityX || 0;

      // If swiped left enough or with enough velocity, archive
      if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
        Animated.spring(translateX, {
          toValue: -Dimensions.get('window').width,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start(() => {
          onArchive();
          // Reset after a delay
          setTimeout(() => {
            translateX.setValue(0);
            setSwiped(false);
          }, 300);
        });
        setSwiped(true);
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
    }
  };

  return (
    <View style={[styles.rowWrapper, isLast && styles.lastRowWrapper]}>
      {/* Archive background that shows when swiping */}
      <View style={styles.archiveBackground}>
        <Archive size={20} color="#fff" />
        <Text style={styles.archiveText}>Archivieren</Text>
      </View>
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={-10}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={[
            styles.row,
            isLast && styles.lastRow,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.rowContent}
            onPress={onToggleResolved}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            <View style={styles.textContainer}>
              <Text
                style={[styles.cellText, isResolved && styles.cellTextResolved]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.request}
              </Text>
              <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </View>
            {CheckboxComponent}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

export default function StatsConflictResolution({ requests }: StatsConflictResolutionProps) {
  const router = useRouter();
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadResolutions();
  }, []);

  const loadResolutions = async () => {
    try {
      setLoading(true);
      const data = await getConflictResolutions();
      // Ensure data is always an array
      setResolutions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load conflict resolutions:', error);
      // Ensure resolutions remains an array even on error
      setResolutions([]);
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
        // Update existing resolution
        await updateConflictResolution(existingResolution.id, {
          resolved: newResolvedState,
        });
      } else {
        // For now, just create it as resolved/unresolved
        // The backend should handle creating with resolved state
        // If backend doesn't support this yet, we'll create then update
        try {
          await upsertConflictResolution(
            request.analysisId,
            request.request,
            undefined,
            false
          );
          // Try to update if creation succeeded
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
          // If endpoint doesn't exist yet, just update local state optimistically
          console.warn('Could not create conflict resolution, endpoint may not exist:', createError);
        }
      }
      // Reload resolutions to get updated state
      await loadResolutions();
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
      await loadResolutions();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={baseColors.lilac} />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Noch keine Bitten in deinen Gesprächen. Bitten sind wichtig für konkrete Konfliktlösungen.
        </Text>
      </View>
    );
  }

  // Filter out archived conflicts for display
  const nonArchivedRequests = requests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return !resolution?.archived;
  });

  // Calculate statistics (excluding archived)
  const resolvedCount = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return resolution?.resolved || false;
  }).length;
  const totalCount = nonArchivedRequests.length;
  const unresolvedCount = totalCount - resolvedCount;

  // Separate resolved and unresolved requests (excluding archived)
  const unresolvedRequests = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return !resolution?.resolved;
  });

  // Show only 3 unresolved by default
  const displayedUnresolved = unresolvedRequests.slice(0, 3);

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Deine Bitten</Text>
            {totalCount > 0 && (
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push('/(protected)/conflict-resolutions')}
              >
                <Text style={styles.seeAllText}>Alle anzeigen</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Statistics row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Gesamt</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberResolved]}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>Gelöst</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberUnresolved]}>{unresolvedCount}</Text>
              <Text style={styles.statLabel}>Offen</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {displayedUnresolved.map((item, index) => {
            const resolution = getResolutionForRequest(item.analysisId);
            const isResolved = resolution?.resolved || false;
            const isUpdating = updatingIds.has(item.analysisId);

            const checkboxComponent = (
              <View style={styles.checkboxContainer}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={baseColors.lilac} />
                ) : (
                  <>
                    {isResolved ? (
                      <CheckCircle size={20} color="#10b981" fill="#10b981" />
                    ) : (
                      <Circle size={20} color={baseColors.lilac} strokeWidth={2} />
                    )}
                  </>
                )}
              </View>
            );

            return (
              <SwipeableRow
                key={item.id}
                item={item}
                isResolved={isResolved}
                isUpdating={isUpdating}
                onToggleResolved={() => handleToggleResolved(item)}
                onArchive={() => handleToggleArchive(item)}
                isLast={index === displayedUnresolved.length - 1}
                CheckboxComponent={checkboxComponent}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: baseColors.offwhite,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  container: {
    borderRadius: 16,
    backgroundColor: baseColors.offwhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  seeAllText: {
    fontSize: 12,
    color: '#000',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  statNumberResolved: {
    color: '#10b981',
  },
  statNumberUnresolved: {
    color: baseColors.lilac,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  rowWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  lastRowWrapper: {
    borderBottomWidth: 0,
  },
  archiveBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    backgroundColor: baseColors.lilac,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  archiveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkboxContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  cellText: {
    fontSize: 12,
    color: '#000',
    lineHeight: 16,
  },
  cellTextResolved: {
    textDecorationLine: 'line-through',
    color: '#666',
    opacity: 0.6,
  },
  titleText: {
    fontSize: 10,
    color: '#999',
  },
});
