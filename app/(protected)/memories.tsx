import baseColors from '@/baseColors.config';
import { deleteMemories, getMemories, type Memory } from '@/lib/api/memories';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ListFilter, ListTodo, Trash, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const brickImage = require('@/assets/images/background-brick-highres.png');
const jungleImage = require('@/assets/images/Jungle.jpg');

type MemoryTypeFilter = 'all' | 'relationship' | 'identity' | 'value' | 'emotion' | 'preference' | 'pattern' | 'core_identity';

const memoryTypeOptions: Array<{ value: MemoryTypeFilter; label: string }> = [
  { value: 'all', label: 'Alle Erinnerungen' },
  { value: 'relationship', label: 'Beziehungen' },
  { value: 'identity', label: 'Identität' },
  { value: 'value', label: 'Werte' },
  { value: 'emotion', label: 'Emotionen' },
  { value: 'preference', label: 'Präferenzen' },
  { value: 'pattern', label: 'Muster' },
  { value: 'core_identity', label: 'Kernidentität' },
];

export default function MemoriesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<MemoryTypeFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const filterButtonRef = useRef<View>(null);
  const filterTooltipOpacity = useState(new Animated.Value(0))[0];
  const checkboxOpacity = useState(new Animated.Value(0))[0];
  const checkboxWidth = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchMemories();
  }, []);

  useEffect(() => {
    if (isSelectionMode) {
      Animated.parallel([
        Animated.spring(checkboxOpacity, {
          toValue: 1,
          useNativeDriver: false, // width animation can't use native driver
          tension: 65,
          friction: 11,
        }),
        Animated.spring(checkboxWidth, {
          toValue: 28, // 20px checkbox + 4px margin + 4px padding
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

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const data = await getMemories();
      console.log('[Memories] Fetched memories count:', data.length);
      console.log('[Memories] Sample data:', data.slice(0, 3));
      setMemories(data);
      setSelectedMemories([]);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectMemory = (id: string) => {
    if (!isSelectionMode) return;
    if (selectedMemories.includes(id)) {
      setSelectedMemories(selectedMemories.filter((memId) => memId !== id));
    } else {
      setSelectedMemories([...selectedMemories, id]);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedMemories([]);
    }
  };

  const handleLongPress = (memoryId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    if (!selectedMemories.includes(memoryId)) {
      setSelectedMemories([...selectedMemories, memoryId]);
    }
  };

  const handleDeleteMemories = async () => {
    if (selectedMemories.length === 0) return;

    console.log(`[MemoriesPage] Deleting ${selectedMemories.length} memories:`, selectedMemories);
    try {
      setIsDeleting(true);
      await deleteMemories(selectedMemories);
      console.log('[MemoriesPage] Bulk delete successful');
      await fetchMemories();
    } catch (error) {
      console.error('[MemoriesPage] Failed to delete memories:', error);
    } finally {
      setIsDeleting(false);
    }
  };


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

  const handleFilterSelect = (value: MemoryTypeFilter) => {
    setMemoryTypeFilter(value);
    setIsFilterOpen(false);
  };

  // Filter memories based on selected type
  const filteredMemories = memoryTypeFilter === 'all'
    ? memories
    : memories.filter((memory) => memory.type === memoryTypeFilter);

  return (
    <View style={{ flex: 1, backgroundColor: baseColors.background }}>
      {/* Header */}
      <View style={{
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
        zIndex: 1000
      }}>
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
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3
          }}
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
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Erinnerungsspeicher</Text>
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
              {memoryTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: memoryTypeFilter === option.value ? '#f5f5f5' : 'transparent',
                  }}
                  onPress={() => handleFilterSelect(option.value)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#000',
                      fontWeight: memoryTypeFilter === option.value ? '600' : 'normal',
                    }}
                  >
                    {option.label}
                  </Text>
                  {memoryTypeFilter === option.value && (
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
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'android' ? 120 : 80,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
          }}>
            <ActivityIndicator size="large" color={baseColors.lilac} />
            <Text style={{ marginTop: 16, fontSize: 14, color: '#666' }}>Lade Erinnerungen...</Text>
          </View>
        ) : (
          <View style={{ gap: 32 }}>
            {/* Combined Memories List */}
            <View style={{ gap: 12 }}>
              {filteredMemories.length > 0 ? (
                <View style={{ marginBottom: 64 }}>
                  {filteredMemories.map((memory, index) => (
                      <View key={memory.id} className="border-b border-black/10 last:border-b-0 py-1">
                      <Pressable
                        style={{
                          flexDirection: 'row',
                          alignItems: 'stretch',
                          gap: 8,
                          borderRadius: 16,
                          backgroundColor: selectedMemories.includes(memory.id) ? baseColors.black+'11' : '',
                          paddingLeft: 8,
                        }}
                        onPress={() => {
                          if (isSelectionMode) {
                            selectMemory(memory.id);
                          }
                        }}
                        onLongPress={() => handleLongPress(memory.id)}
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
                          onPress={() => selectMemory(memory.id)}
                        >
                          <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: baseColors.black+'22',
                            backgroundColor: baseColors.black+'05',
                            boxShadow: 'inset 0 0 4px 0 rgba(0, 0, 0, 0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: -1,
                          }}>
                            {selectedMemories.includes(memory.id) ? (
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
                        {memory.key && (
                          <Text style={{
                            marginBottom: 8,
                            color: baseColors.black,
                            fontSize: 14,
                          }}>{memory.key}</Text>
                        )}
                        <Text style={{
                          marginBottom: 8,
                          fontSize: 14,
                          color: '#000',
                        }}>{memory.value}</Text>
                      </View>
                    </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 16,
                  padding: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: '#999',
                    textAlign: 'center',
                    lineHeight: 20,
                  }}>
                    {memoryTypeFilter === 'all'
                      ? 'Noch keine Erinnerungen vorhanden. Führe Gespräche, um Erinnerungen zu sammeln.'
                      : `Keine Erinnerungen vom Typ "${memoryTypeOptions.find(o => o.value === memoryTypeFilter)?.label}" gefunden.`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Delete Button */}
      {selectedMemories.length > 0 && (
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
            justifyContent: 'center',
            gap: 12,
            width: '100%',
          }}>
            <TouchableOpacity
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedMemories([]);
              }}
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
              onPress={handleDeleteMemories}
              disabled={isDeleting}
            >
              <ImageBackground
                source={brickImage}
                resizeMode="cover"
                style={{
                  flex: 1,
                  height: '100%',
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
                }}>löschen</Text>
                <Trash size={16} color={baseColors.brick} style={{
                  backgroundColor: baseColors.white + '88',
                  padding: 3,
                  borderRadius: 999,
                }} />
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
