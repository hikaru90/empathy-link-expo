import baseColors from '@/baseColors.config';
import { useAuthGuard } from '@/hooks/use-auth';
import { getConflictResolutions, updateConflictResolution, type ConflictResolution } from '@/lib/api/conflict-resolution';
import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Archive, Check, CheckCircle, ChevronLeft, ListFilter, ListTodo, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

type FilterType = 'resolved' | 'open' | 'archived';

const filterOptions: Array<{ value: FilterType; label: string }> = [
  { value: 'open', label: 'Offen' },
  { value: 'resolved', label: 'Gelöst' },
  { value: 'archived', label: 'Archiviert' },
];

export default function ConflictResolutionsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('open');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const filterButtonRef = useRef<View>(null);
  const filterTooltipOpacity = useState(new Animated.Value(0))[0];
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const checkboxOpacity = useState(new Animated.Value(0))[0];
  const checkboxWidth = useState(new Animated.Value(0))[0];

  const greenImage = require('@/assets/images/background-exposure-highres.png');
  const jungleImage = require('@/assets/images/Jungle.jpg');
  const whiteImage = require('@/assets/images/background-white-highres.png');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (isSelectionMode) {
      Animated.parallel([
        Animated.spring(checkboxOpacity, {
          toValue: 1,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }),
        Animated.spring(checkboxWidth, {
          toValue: 28,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(checkboxOpacity, {
          toValue: 0,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }),
        Animated.spring(checkboxWidth, {
          toValue: 0,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    }
  }, [isSelectionMode]);

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
      setSelectedRequests([]);
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

  const selectRequest = (analysisId: string) => {
    if (!isSelectionMode) return;
    if (selectedRequests.includes(analysisId)) {
      setSelectedRequests(selectedRequests.filter((id) => id !== analysisId));
    } else {
      setSelectedRequests([...selectedRequests, analysisId]);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRequests([]);
    }
  };

  const handleLongPress = (analysisId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    if (!selectedRequests.includes(analysisId)) {
      setSelectedRequests([...selectedRequests, analysisId]);
    }
  };

  const handleMarkAsResolved = async () => {
    if (selectedRequests.length === 0) return;

    try {
      setIsProcessing(true);
      await Promise.all(
        selectedRequests.map(analysisId =>
          updateConflictResolution(analysisId, { resolved: true })
        )
      );
      await loadData();
      setIsSelectionMode(false);
      setSelectedRequests([]);
    } catch (error) {
      console.error('Failed to mark as resolved:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (selectedRequests.length === 0) return;

    try {
      setIsProcessing(true);
      await Promise.all(
        selectedRequests.map(analysisId =>
          updateConflictResolution(analysisId, { archived: true })
        )
      );
      await loadData();
      setIsSelectionMode(false);
      setSelectedRequests([]);
    } catch (error) {
      console.error('Failed to archive:', error);
    } finally {
      setIsProcessing(false);
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
      case 'resolved':
        return resolvedRequests;
      case 'open':
        return unresolvedRequests;
      case 'archived':
        return archivedRequests;
      default:
        return unresolvedRequests;
    }
  }, [activeFilter, nonArchivedRequests, resolvedRequests, unresolvedRequests, archivedRequests]);

  useEffect(() => {
    if (isFilterOpen) {
      Animated.spring(filterTooltipOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(filterTooltipOpacity, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isFilterOpen]);

  const handleFilterButtonPress = () => {
    filterButtonRef.current?.measureInWindow((pageX, pageY, width, height) => {
      setFilterButtonLayout({ x: pageX, y: pageY, width, height });
      setIsFilterOpen(true);
    });
  };

  const handleFilterSelect = (value: FilterType) => {
    setActiveFilter(value);
    setIsFilterOpen(false);
  };

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
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[baseColors.background, baseColors.background + '00']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            zIndex: -1,
          }}
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
        <Text style={styles.title}>Deine Bitten</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelectionMode ? baseColors.black+'11' : '',
          }}
          onPress={toggleSelectionMode}
        >
          <ListTodo size={18} color={baseColors.black} />
        </TouchableOpacity>
        <View ref={filterButtonRef} collapsable={false}>
          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleFilterButtonPress}
          >
            <ListFilter size={18} color={baseColors.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={() => setIsFilterOpen(false)}
        >
          <Animated.View
            style={{
              position: 'absolute',
              backgroundColor: '#fff',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 12,
              zIndex: 2000,
              width: 180,
              opacity: filterTooltipOpacity,
              top: filterButtonLayout.y + filterButtonLayout.height + 8,
              left: filterButtonLayout.x + filterButtonLayout.width - 180,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{
              position: 'absolute',
              top: -8,
              right: 20,
              width: 0,
              height: 0,
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderBottomWidth: 8,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#fff',
            }} />
            <View style={{ padding: 8 }}>
              {filterOptions.map((option) => {
                const count = option.value === 'open' ? unresolvedRequests.length
                  : option.value === 'resolved' ? resolvedRequests.length
                  : archivedRequests.length;
                
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: activeFilter === option.value ? '#f5f5f5' : 'transparent',
                    }}
                    onPress={() => handleFilterSelect(option.value)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#000',
                        fontWeight: activeFilter === option.value ? '600' : 'normal',
                      }}
                    >
                      {option.label} ({count})
                    </Text>
                    {activeFilter === option.value && (
                      <View style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: baseColors.lilac,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>

          {/* Filtered Content */}
          {filteredRequests.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 64 }}>
              {filteredRequests.map((item: RequestItem, index: number) => {
                const resolution = getResolutionForRequest(item.analysisId);
                const isResolved = resolution?.resolved || false;
                const isArchived = resolution?.archived || false;
                const isLast = index === filteredRequests.length - 1;
                
                  return (
                  <View
                    key={item.id}
                    className={isLast ? '' : 'border-b border-black/10'}
                    style={{ paddingVertical: 4 }}
                  >
                    <Pressable
                      style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        gap: 8,
                        borderRadius: 16,
                        backgroundColor: selectedRequests.includes(item.analysisId) ? baseColors.black+'11' : '',
                        paddingLeft: 8,
                      }}
                      onPress={() => {
                        if (isSelectionMode) {
                          selectRequest(item.analysisId);
                        }
                      }}
                      onLongPress={() => handleLongPress(item.analysisId)}
                      delayLongPress={500}
                    >
                      <Animated.View
                        style={{
                          opacity: checkboxOpacity,
                          width: checkboxWidth,
                          overflow: 'hidden',
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            paddingVertical: 8,
                            marginRight: 4,
                            justifyContent: 'flex-start',
                          }}
                          onPress={() => selectRequest(item.analysisId)}
                        >
                          <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: baseColors.black+'22',
                            backgroundColor: baseColors.black+'05',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: -1,
                          }}>
                            {selectedRequests.includes(item.analysisId) ? (
                              <Check size={12} color="#000" />
                            ) : (
                              <View style={{ width: 12, height: 12 }} />
                            )}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                      <View style={{
                        flex: 1,
                        paddingVertical: 8,
                        gap: 8,
                      }}>
                        <Text style={{
                          marginBottom: 8,
                          fontSize: 14,
                          color: isResolved ? '#666' : isArchived ? '#999' : '#000',
                          textDecorationLine: isResolved ? 'line-through' : 'none',
                          opacity: isArchived ? 0.7 : 1,
                        }}>
                          {item.request}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: '#999',
                        }}>
                          {formatDate(item.created)} - {item.title}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeFilter === 'open' && 'Keine offenen Konflikte.'}
                {activeFilter === 'resolved' && 'Keine gelösten Konflikte.'}
                {activeFilter === 'archived' && 'Keine archivierten Konflikte.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      {selectedRequests.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          paddingTop: 16,
          paddingHorizontal: 20,
          elevation: 8,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            width: '100%',
          }}>
            <View style={{ flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedRequests([]);
                }}
                disabled={isProcessing}
              >
                <ImageBackground
                  source={jungleImage}
                  resizeMode="cover"
                  style={{
                    flex: 1,
                    height: '100%',
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    paddingVertical: 8,
                    paddingLeft: 16,
                    paddingRight: 8,
                    borderRadius: 999,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    color: baseColors.offwhite,
                  }}>Abbrechen</Text>
                  <X size={16} color="#fff" style={{
                    backgroundColor: baseColors.white + '44',
                    padding: 3,
                    borderRadius: 999,
                  }} />
                </ImageBackground>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMarkAsResolved}
                disabled={isProcessing}
              >
                <ImageBackground
                  source={greenImage}
                  resizeMode="cover"
                  style={{
                    flex: 1,
                    height: '100%',
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    paddingVertical: 8,
                    paddingLeft: 16,
                    paddingRight: 8,
                    borderRadius: 999,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    color: baseColors.offwhite,
                  }}>Abhaken</Text>
                  <CheckCircle size={16} color={baseColors.jungle} style={{
                    backgroundColor: baseColors.white + '88',
                    padding: 3,
                    borderRadius: 999,
                  }} />
                </ImageBackground>
              </TouchableOpacity>
            <TouchableOpacity
              onPress={handleArchive}
              disabled={isProcessing}
            >
              <ImageBackground
                source={whiteImage}
                resizeMode="cover"
                style={{
                  width: 32.5,
                  height: 32.5,
                  borderRadius: 22,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <Archive size={16} color={baseColors.black} style={{
                    backgroundColor: baseColors.white + '88',
                    borderRadius: 999,
                  }} />
              </ImageBackground>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 120 : 80,
    paddingBottom: 64,
  },
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' || Platform.OS === 'android' ? 58 : 16,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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

