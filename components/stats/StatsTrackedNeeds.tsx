import baseColors from '@/baseColors.config';
import { getNeeds, Need } from '@/lib/api/chat';
import { getCurrentFillLevels, getCurrentFillLevelsWithTimestamps, getNeedTimeseries, getTrackedNeeds, saveFillLevelsSnapshot, saveTrackedNeeds, TrackedNeed } from '@/lib/api/stats';
import { Lightbulb } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GroupedNeedsSelector from '../chat/GroupedNeedsSelector';
import NeedCup from './NeedCup';

export default function StatsTrackedNeeds() {
  const [trackedNeeds, setTrackedNeeds] = useState<TrackedNeed[]>([]);
  const [allNeeds, setAllNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNeedSelector, setShowNeedSelector] = useState(false);
  const [selectedNeedIds, setSelectedNeedIds] = useState<string[]>([]);
  const [fillLevels, setFillLevels] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, string | null>>({});
  const [yesterdayFillLevels, setYesterdayFillLevels] = useState<Record<string, number>>({});
  const [lastFillLevels, setLastFillLevels] = useState<Record<string, number>>({}); // Previous fill level for each cup
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasFilledToday, setHasFilledToday] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [needs, tracked, fillLevelsData] = await Promise.all([
        getNeeds(),
        getTrackedNeeds(),
        getCurrentFillLevelsWithTimestamps().catch(() => {
          // Fallback to old API if new one doesn't exist
          return getCurrentFillLevels().then(levels => {
            const result: Record<string, { fillLevel: number; lastUpdated: string | null }> = {};
            Object.entries(levels).forEach(([key, value]) => {
              result[key] = { fillLevel: value, lastUpdated: null };
            });
            return result;
          });
        }).catch(() => ({} as Record<string, { fillLevel: number; lastUpdated: string | null }>)),
      ]);
      setAllNeeds(needs);
      setTrackedNeeds(tracked);
      
      // Initialize fill levels and timestamps from API or default to 0
      const levels: Record<string, number> = {};
      const timestamps: Record<string, string | null> = {};
      const yesterdayLevels: Record<string, number> = {};
      
      // Check if we have today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let hasTodayData = false;
      
      tracked.forEach(tn => {
        const data = fillLevelsData[tn.id];
        if (data) {
          levels[tn.id] = data.fillLevel || 0;
          timestamps[tn.id] = data.lastUpdated || null;
          
          // Check if last updated is today
          if (data.lastUpdated) {
            const lastUpdatedDate = new Date(data.lastUpdated);
            lastUpdatedDate.setHours(0, 0, 0, 0);
            if (lastUpdatedDate.getTime() === today.getTime()) {
              hasTodayData = true;
            }
          }
        } else {
          levels[tn.id] = 0;
          timestamps[tn.id] = null;
        }
      });
      
      setFillLevels(levels);
      setLastUpdated(timestamps);
      setHasFilledToday(hasTodayData);
      
      // Load last fill levels for all tracked needs (previous entry in timeseries, excluding today)
      const lastLevels: Record<string, number> = {};
      await Promise.all(
        tracked.map(async (tn) => {
          try {
            const timeseries = await getNeedTimeseries(tn.id);
            if (timeseries.length > 1) {
              // Get the second-to-last entry (previous fill level)
              // Sort by date to ensure we get the correct order
              const sorted = [...timeseries].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA; // Most recent first
              });
              
              // Skip today's entry and get the previous one
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              for (const entry of sorted) {
                const entryDate = new Date(entry.date);
                entryDate.setHours(0, 0, 0, 0);
                if (entryDate.getTime() !== today.getTime()) {
                  lastLevels[tn.id] = entry.fillLevel;
                  break;
                }
              }
            } else if (timeseries.length === 1) {
              // Only one entry - use it as last fill level
              lastLevels[tn.id] = timeseries[0].fillLevel;
            }
          } catch (error) {
            // Ignore errors - just don't show last fill level
          }
        })
      );
      setLastFillLevels(lastLevels);
      
      // Load yesterday's values if not filled today
      if (!hasTodayData && tracked.length > 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayISO = yesterday.toISOString();
        const tomorrow = new Date(yesterday);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowISO = tomorrow.toISOString();
        
        const yesterdayLevels: Record<string, number> = {};
        await Promise.all(
          tracked.map(async (tn) => {
            try {
              const timeseries = await getNeedTimeseries(tn.id, yesterdayISO, tomorrowISO);
              if (timeseries.length > 0) {
                // Get the most recent value from yesterday
                const yesterdayValue = timeseries[timeseries.length - 1];
                yesterdayLevels[tn.id] = yesterdayValue.fillLevel;
              }
            } catch (error) {
              // Ignore errors - just don't show yesterday's value
            }
          })
        );
        setYesterdayFillLevels(yesterdayLevels);
      } else {
        setYesterdayFillLevels({});
      }
    } catch (error) {
      console.error('Error loading needs data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrackedNeeds = async () => {
    try {
      const saved = await saveTrackedNeeds(selectedNeedIds);
      setTrackedNeeds(saved);
      setShowNeedSelector(false);
      setSelectedNeedIds([]);
      
      // Initialize fill levels for new tracked needs
      const levels: Record<string, number> = {};
      saved.forEach(tn => {
        levels[tn.id] = fillLevels[tn.id] || 0;
      });
      setFillLevels(levels);
    } catch (error) {
      console.error('Error saving tracked needs:', error);
    }
  };

  const handleFillLevelChange = (trackedNeedId: string, fillLevel: number) => {
    setFillLevels(prev => ({
      ...prev,
      [trackedNeedId]: fillLevel,
    }));
    // Update last updated timestamp when fill level changes
    setLastUpdated(prev => ({
      ...prev,
      [trackedNeedId]: new Date().toISOString(),
    }));
  };

  const handleAddNeed = () => {
    // Pre-select already tracked needs
    const currentNeedIds = trackedNeeds.map(tn => tn.needId);
    setSelectedNeedIds(currentNeedIds);
    setShowNeedSelector(true);
  };

  const handleEditModeToggle = async () => {
    if (isEditMode) {
      // Exiting edit mode - save snapshot
      try {
        await saveFillLevelsSnapshot(fillLevels);
        setHasFilledToday(true);
        setYesterdayFillLevels({}); // Clear yesterday's values since we just saved today
        // Update last updated timestamps
        const now = new Date().toISOString();
        const newTimestamps: Record<string, string | null> = {};
        trackedNeeds.forEach(tn => {
          newTimestamps[tn.id] = now;
        });
        setLastUpdated(newTimestamps);
      } catch (error) {
        console.error('Error saving fill levels snapshot:', error);
      }
    }
    setIsEditMode(!isEditMode);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={baseColors.lilac} />
            <Text style={styles.loadingText}>Lade Bedürfnisse...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Top Bedürfnisse</Text>
          </View>
          {trackedNeeds.length > 0 && (
            <TouchableOpacity
              style={[styles.editButton, isEditMode && styles.editButtonActive]}
              onPress={handleEditModeToggle}
            >
              <Text style={styles.editButtonText}>
                {isEditMode ? 'Bearbeitung abschließen' : 'Schalen füllen'}
              </Text>
            </TouchableOpacity>
          )}
        </View>


        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {isEditMode
              ? 'Tippe auf eine Schale, um den Füllstand zu setzen. Die Position deines Klicks bestimmt den Füllstand.'
              : 'Wähle bis zu 3 Top Bedürfnisse aus und verfolge, wie gut sie erfüllt sind. Tippe auf eine Schale, um den Verlauf zu sehen.'}
          </Text>
          {!isEditMode && trackedNeeds.length > 0 && !hasFilledToday && (
            <View
              style={[
                styles.dailyNotice,
                { backgroundColor: baseColors.orange + '15' }
              ]}
            >
              <Lightbulb size={16} color={baseColors.orange} strokeWidth={2} />
              <Text style={[styles.dailyNoticeText, { color: baseColors.orange }]}>
                Du kannst heute deine Schalen füllen! Nutze die Gelegenheit, um deine Bedürfnisse zu reflektieren.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cupsContainer}>
          {trackedNeeds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Wähle bis zu 3 Top Bedürfnisse aus, die du verfolgen möchtest.
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={handleAddNeed}
              >
                <Text style={styles.selectButtonText}>Bedürfnisse auswählen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cupsRow}>
              {trackedNeeds.map((trackedNeed) => (
                <NeedCup
                  key={trackedNeed.id}
                  trackedNeed={{
                    id: trackedNeed.id,
                    needId: trackedNeed.needId,
                    needName: trackedNeed.needName,
                  }}
                  currentFillLevel={fillLevels[trackedNeed.id] || 0}
                  onFillLevelChange={(fillLevel) => handleFillLevelChange(trackedNeed.id, fillLevel)}
                  isEditMode={isEditMode}
                  lastUpdated={lastUpdated[trackedNeed.id]}
                  lastFillLevel={lastFillLevels[trackedNeed.id]}
                />
              ))}
              {trackedNeeds.length < 3 && (
                <TouchableOpacity
                  style={styles.addCupButton}
                  onPress={handleAddNeed}
                >
                  <View style={styles.addCupIcon}>
                    <Text style={styles.addCupIconText}>+</Text>
                  </View>
                  <Text style={styles.addCupText}>Hinzufügen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Need Selector Modal */}
      <Modal
        visible={showNeedSelector}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowNeedSelector(false);
          setSelectedNeedIds([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bedürfnisse auswählen ({selectedNeedIds.length}/3)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNeedSelector(false);
                  setSelectedNeedIds([]);
                }}
                style={styles.closeIcon}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.needSelectorScroll}>
              <GroupedNeedsSelector
                needs={allNeeds}
                onNeedPress={(needName) => {
                  const need = allNeeds.find(n => n.nameDE === needName);
                  if (need) {
                    if (selectedNeedIds.includes(need.id)) {
                      setSelectedNeedIds(selectedNeedIds.filter(id => id !== need.id));
                    } else if (selectedNeedIds.length < 3) {
                      setSelectedNeedIds([...selectedNeedIds, need.id]);
                    }
                  }
                }}
                isLoading={false}
                selectedNeedIds={selectedNeedIds}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  selectedNeedIds.length === 0 && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveTrackedNeeds}
                disabled={selectedNeedIds.length === 0}
              >
                <Text style={[
                  styles.saveButtonText,
                  selectedNeedIds.length === 0 && styles.saveButtonTextDisabled,
                ]}>
                  Speichern
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  card: {
    borderRadius: 16,
    backgroundColor: baseColors.offwhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonActive: {
    backgroundColor: '#86efac',
    borderColor: '#000',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  dailyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  dailyNoticeText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  cupWrapper: {
    position: 'relative',
    alignItems: 'center',
    width: 80,
  },
  yesterdayCupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  cupsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cupsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#86efac',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  addCupButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 80,
  },
  addCupIcon: {
    width: 80,
    height: 120,
    borderWidth: 3,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  addCupIconText: {
    fontSize: 32,
    color: '#9ca3af',
    fontWeight: '300',
  },
  addCupText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: baseColors.offwhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 18,
    color: '#000',
  },
  needSelectorScroll: {
    maxHeight: 400,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#86efac',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
});

