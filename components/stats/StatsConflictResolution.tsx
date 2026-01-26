import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import { getConflictResolutions, updateConflictResolution, type ConflictResolution } from '@/lib/api/conflict-resolution';
import { useFocusEffect, useRouter } from 'expo-router';
import { Archive, CheckCircle, Circle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';
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
    <View className={`overflow-hidden relative ${isLast ? '' : 'border-b border-black/5'}`}>
      {/* Archive background that shows when swiping */}
      <View
        className="absolute right-0 top-0 bottom-0 flex-row items-center justify-end pr-5 gap-2 rounded-lg"
        style={{
          width: '100%',
          backgroundColor: baseColors.lilac
        }}
      >
        <Archive size={20} color="#fff" />
        <Text className="text-white text-sm font-semibold">Archivieren</Text>
      </View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={-10}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={{
            transform: [{ translateX }],
            backgroundColor: baseColors.offwhite,
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 16,
            gap: 12,
            borderRadius: 8,
            position: 'relative',
          }}
        >
          <TouchableOpacity
            className="flex-row items-center gap-3 flex-1 w-full"
            onPress={onToggleResolved}
            disabled={isUpdating}
          >
            <View className="flex-1 gap-1">
              <Text
                className={`text-sm text-black mb-2 ${isResolved ? 'line-through text-black/60 opacity-60' : ''}`}
              >
                {item.request}
              </Text>
              <Text className="text-xs text-black/60" numberOfLines={1} ellipsizeMode="tail">
                {new Date(item.created).toLocaleDateString()} - {item.title}
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
    loadResolutions(true);
  }, []);

  // Reload data when screen comes into focus (e.g., when returning from conflict-resolutions page)
  useFocusEffect(
    useCallback(() => {
      loadResolutions(false);
    }, [])
  );

  const loadResolutions = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await getConflictResolutions();
      // Ensure data is always an array
      setResolutions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load conflict resolutions:', error);
      // Ensure resolutions remains an array even on error
      setResolutions([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
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
      // Update the analysis directly - no need to check if resolution exists
      // since analyses with requests always have resolution data
      await updateConflictResolution(request.analysisId, {
        resolved: newResolvedState,
      });
      // Reload resolutions to get updated state (without showing loading spinner)
      await loadResolutions(false);
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

    // Optimistically update the resolutions state immediately
    setResolutions(prev => {
      const updated = [...prev];
      const index = updated.findIndex(r => r.analysisId === request.analysisId);
      if (index !== -1) {
        // Update existing resolution
        updated[index] = { ...updated[index], archived: newArchivedState };
      }
      return updated;
    });

    try {
      // Update the analysis directly
      await updateConflictResolution(request.analysisId, {
        archived: newArchivedState,
      });
      await loadResolutions(false);
    } catch (error) {
      console.error('Failed to archive conflict resolution:', error);
      // Revert optimistic update on error
      await loadResolutions(false);
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
      <View className="p-5 items-center">
        <LoadingIndicator />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View className="p-5 rounded-xl items-center" style={{ backgroundColor: baseColors.offwhite }}>
        <Text className="text-sm text-gray-600 text-center leading-5">
          Noch keine Bitten in deinen Gesprächen. Bitten sind wichtig für konkrete Konfliktlösungen.
        </Text>
      </View>
    );
  }

  // Filter out archived conflicts for display
  // Keep items that are updating visible to prevent layout shift
  const nonArchivedRequests = requests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    const isArchived = resolution?.archived || false;
    const isUpdating = updatingIds.has(req.analysisId);
    // Keep items that are updating in the list to prevent layout shift
    return !isArchived || isUpdating;
  });

  // Calculate statistics (excluding archived, but including items being updated)
  const resolvedCount = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    return resolution?.resolved || false;
  }).length;
  const totalCount = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    // Don't count items being archived in total
    return !resolution?.archived || updatingIds.has(req.analysisId);
  }).length;
  const unresolvedCount = totalCount - resolvedCount;

  // Separate resolved and unresolved requests
  // Keep updating items visible to prevent layout shift
  const unresolvedRequests = nonArchivedRequests.filter(req => {
    const resolution = getResolutionForRequest(req.analysisId);
    const isUpdating = updatingIds.has(req.analysisId);
    // Show unresolved items, or items that are currently updating (to prevent layout shift)
    return !resolution?.resolved || isUpdating;
  });

  // Show only 3 unresolved by default
  const displayedUnresolved = unresolvedRequests.slice(0, 3);

  return (
    <View>
      <View
        className="rounded-2xl overflow-hidden shadow-lg shadow-black/10"
        style={{ backgroundColor: baseColors.offwhite }}
      >
        <View className="px-5 pt-4 pb-3 border-b border-black/5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-black">Deine Bitten</Text>
            {totalCount > 0 && (
              <View className="flex-row items-center gap-2">
                {updatingIds.size > 0 && (
                  <LoadingIndicator />
                )}
                <TouchableOpacity
                  className="px-3 py-1 rounded-full border border-black/10"
                  onPress={() => router.push('/(protected)/conflict-resolutions')}
                >
                  <Text className="text-xs text-black">Alle anzeigen</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Statistics row */}
          <View className="flex-row gap-2 mt-1">
            <View className="flex-1 items-center py-2 px-2 bg-white rounded-lg">
              <Text className="text-lg font-bold text-black mb-0.5">{totalCount}</Text>
              <Text className="text-[10px] text-gray-600 font-medium">Gesamt</Text>
            </View>
            <View className="flex-1 items-center py-2 px-2 bg-white rounded-lg">
              <Text className="text-lg font-bold text-emerald-500 mb-0.5">{resolvedCount}</Text>
              <Text className="text-[10px] text-gray-600 font-medium">Gelöst</Text>
            </View>
            <View className="flex-1 items-center py-2 px-2 bg-white rounded-lg">
              <Text className="text-lg font-bold mb-0.5" style={{ color: baseColors.lilac }}>{unresolvedCount}</Text>
              <Text className="text-[10px] text-gray-600 font-medium">Offen</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-2 pb-3">
          {displayedUnresolved.map((item, index) => {
            const resolution = getResolutionForRequest(item.analysisId);
            const isResolved = resolution?.resolved || false;
            const isUpdating = updatingIds.has(item.analysisId);

            const checkboxComponent = (
              <View className="w-6 items-center justify-center">
                {isResolved ? (
                  <CheckCircle size={20} color="#10b981" fill="#10b981" />
                ) : (
                  <Circle size={20} color={baseColors.lilac} strokeWidth={2} />
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


