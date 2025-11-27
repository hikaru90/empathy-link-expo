import baseColors from '@/baseColors.config';
import { getNeeds, Need } from '@/lib/api/chat';
import { deleteTrackedNeed, getCurrentFillLevelsWithTimestamps, getNeedTimeseries, getTrackedNeeds, NeedTimeseriesData, saveFillLevelsSnapshot, saveTrackedNeeds, TrackedNeed, updateFillLevelStrategies } from '@/lib/api/stats';
import { getTextColorForBackground } from '@/lib/utils/color-contrast';
import { Lightbulb, Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GroupedNeedsSelector from '../chat/GroupedNeedsSelector';
import NeedCup from './NeedCup';

export default function StatsTrackedNeeds() {
  const [trackedNeeds, setTrackedNeeds] = useState<TrackedNeed[]>([]);
  const [allNeeds, setAllNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNeedSelector, setShowNeedSelector] = useState(false);
  const [selectedNeedIds, setSelectedNeedIds] = useState<string[]>([]);
  const [fillLevels, setFillLevels] = useState<Record<string, number | null>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, string | null>>({});
  const [yesterdayFillLevels, setYesterdayFillLevels] = useState<Record<string, number>>({});
  const [lastFillLevels, setLastFillLevels] = useState<Record<string, number>>({}); // Previous fill level for each cup
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasFilledToday, setHasFilledToday] = useState(false);
  const [hasFilledAllCups, setHasFilledAllCups] = useState(false);
  const [selectedCupId, setSelectedCupId] = useState<string | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<NeedTimeseriesData[]>([]);
  const [isLoadingTimeseries, setIsLoadingTimeseries] = useState(false);
  const [needsError, setNeedsError] = useState<string | null>(null);
  const [currentStrategies, setCurrentStrategies] = useState<string[]>([]);
  const [newStrategyText, setNewStrategyText] = useState('');
  const [isSavingStrategies, setIsSavingStrategies] = useState(false);
  const [currentFillLevelId, setCurrentFillLevelId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [needs, tracked, fillLevelsData] = await Promise.all([
        getNeeds().catch((error) => {
          console.error('Error loading needs:', error);
          const errorMessage = error?.message || error?.toString() || 'Unknown error';
          setNeedsError(`Fehler beim Laden der Bedürfnisse: ${errorMessage}`);
          // Return empty array if needs fail to load
          return [] as Need[];
        }),
        getTrackedNeeds().catch((error) => {
          console.error('Error loading tracked needs:', error);
          // Return empty array if tracked needs fail to load
          return [] as TrackedNeed[];
        }),
        getCurrentFillLevelsWithTimestamps().catch(() => {
          // Fallback already handled in getCurrentFillLevelsWithTimestamps
          // Return empty object if all endpoints fail
          return {} as Record<string, { fillLevel: number; lastUpdated: string | null }>;
        }),
      ]);
      console.log('Loaded needs:', needs.length, 'needs');
      setAllNeeds(needs);
      if (needs.length > 0) {
        setNeedsError(null); // Clear error if needs loaded successfully
      }
      
      // Preserve old tracked needs list before updating (for fill level preservation)
      const oldTrackedNeeds = trackedNeeds;
      setTrackedNeeds(tracked);

      // Initialize fill levels and timestamps from API or preserve existing ones
      // Preserve existing fill levels for tracked needs that still exist (same ID)
      const levels: Record<string, number | null> = {};
      const timestamps: Record<string, string | null> = {};
      const yesterdayLevels: Record<string, number> = {};

      // Check if we have today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let hasTodayData = false;

      tracked.forEach(tn => {
        const data = fillLevelsData[tn.id];
        if (data) {
          // Treat 0 as null (empty state)
          levels[tn.id] = data.fillLevel && data.fillLevel > 0 ? data.fillLevel : null;
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
          // If no data from API, preserve existing fill level if this tracked need still exists (same ID)
          const existingNeed = oldTrackedNeeds.find(etn => etn.id === tn.id);
          if (existingNeed && fillLevels[tn.id] !== undefined) {
            // Preserve existing fill level - this tracked need still exists with same ID
            levels[tn.id] = fillLevels[tn.id];
            timestamps[tn.id] = lastUpdated[tn.id] || null;
          } else {
            // New tracked need or no existing data - set to null
            levels[tn.id] = null;
            timestamps[tn.id] = null;
          }
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
      // Save exactly what's selected - selectedNeedIds already includes existing needs
      // when adding (all existing are pre-selected) or excludes the replaced one when replacing
      const saved = await saveTrackedNeeds(selectedNeedIds);
      setTrackedNeeds(saved);
      setShowNeedSelector(false);
      setSelectedNeedIds([]);

      // Preserve fill levels for tracked needs that still exist
      const levels: Record<string, number | null> = {};
      saved.forEach(tn => {
        // Preserve existing fill level if the tracked need still exists (same ID)
        const existingNeed = trackedNeeds.find(etn => etn.id === tn.id);
        if (existingNeed) {
          levels[tn.id] = fillLevels[tn.id] ?? null;
        } else {
          // New tracked need - initialize to null
          levels[tn.id] = null;
        }
      });
      setFillLevels(levels);
      
      // Update timestamps for existing needs
      const newTimestamps: Record<string, string | null> = {};
      saved.forEach(tn => {
        const existingNeed = trackedNeeds.find(etn => etn.id === tn.id);
        newTimestamps[tn.id] = existingNeed ? lastUpdated[tn.id] || null : null;
      });
      setLastUpdated(newTimestamps);
      
      // Reload data to ensure everything is in sync
      await loadData();
    } catch (error) {
      console.error('Error saving tracked needs:', error);
    }
  };

  const handleFillLevelChange = (trackedNeedId: string, fillLevel: number) => {
    // Only update local state - don't save or update timestamps yet
    // Will be saved when exiting edit mode
    // Treat 0 as null (empty state)
    const normalizedFillLevel = fillLevel === 0 ? null : fillLevel;
    
    setFillLevels(prev => {
      const updated = {
        ...prev,
        [trackedNeedId]: normalizedFillLevel,
      };

      // Check if all cups have been filled (all tracked needs have fillLevel > 0, not null and not 0)
      const allFilled = trackedNeeds.every(tn => {
        const level = tn.id === trackedNeedId ? normalizedFillLevel : updated[tn.id];
        return level !== null && level !== undefined && level > 0;
      });
      setHasFilledAllCups(allFilled);

      return updated;
    });
  };

  const handleAddNeed = () => {
    // Pre-select already tracked needs to preserve them
    const currentNeedIds = trackedNeeds.map(tn => tn.needId);
    setSelectedNeedIds(currentNeedIds);
    setShowNeedSelector(true);
  };

  const handleReplaceNeed = (trackedNeedId: string) => {
    // Pre-select all tracked needs except the one being replaced
    // This ensures existing needs are preserved
    const currentNeedIds = trackedNeeds
      .filter(tn => tn.id !== trackedNeedId)
      .map(tn => tn.needId);
    setSelectedNeedIds(currentNeedIds);
    setShowNeedSelector(true);
  };

  const handleDeleteNeed = async (trackedNeedId: string) => {
    try {
      // Delete the single tracked need (this preserves other tracked needs and their IDs)
      await deleteTrackedNeed(trackedNeedId);
      
      // Clear selected cup and timeseries
      setSelectedCupId(null);
      setTimeseriesData([]);
      setCurrentStrategies([]);
      setCurrentFillLevelId(null);
      
      // Reload data to get updated tracked needs list
      // This preserves fill levels for remaining tracked needs since their IDs don't change
      await loadData();
    } catch (error) {
      console.error('Error deleting tracked need:', error);
      // If DELETE endpoint doesn't exist, fall back to the old method
      // but warn that this will cause issues
      console.warn('DELETE endpoint not available, falling back to replace method (this may cause data loss)');
      
      // Fallback: Get remaining need IDs and save (this recreates entries with new IDs)
      const remainingNeedIds = trackedNeeds
        .filter(tn => tn.id !== trackedNeedId)
        .map(tn => tn.needId);
      
      const saved = await saveTrackedNeeds(remainingNeedIds);
      setTrackedNeeds(saved);
      setSelectedCupId(null);
      setTimeseriesData([]);
      await loadData();
    }
  };

  const handleCupPress = async (trackedNeedId: string) => {
    if (selectedCupId === trackedNeedId) {
      // If clicking the same cup, deselect it
      setSelectedCupId(null);
      setTimeseriesData([]);
      setCurrentStrategies([]);
      setCurrentFillLevelId(null);
      return;
    }

    setSelectedCupId(trackedNeedId);
    setIsLoadingTimeseries(true);
    try {
      const data = await getNeedTimeseries(trackedNeedId);
      setTimeseriesData(data);
      
      // Find today's entry first, otherwise use the most recent entry
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let targetEntry = data.find(item => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      });
      
      // If no today's entry, use the most recent one
      if (!targetEntry && data.length > 0) {
        targetEntry = data[data.length - 1]; // Most recent is last after sorting by date
      }
      
      if (targetEntry) {
        setCurrentFillLevelId(targetEntry.id);
        setCurrentStrategies(targetEntry.strategies || []);
      } else {
        setCurrentFillLevelId(null);
        setCurrentStrategies([]);
      }
    } catch (error) {
      console.error('Error loading timeseries:', error);
      setTimeseriesData([]);
      setCurrentStrategies([]);
      setCurrentFillLevelId(null);
    } finally {
      setIsLoadingTimeseries(false);
    }
  };

  const handleAddStrategy = async () => {
    if (!newStrategyText.trim() || !currentFillLevelId) return;
    
    const updatedStrategies = [...currentStrategies, newStrategyText.trim()];
    setCurrentStrategies(updatedStrategies);
    setNewStrategyText('');
    
    // Save to backend
    setIsSavingStrategies(true);
    try {
      await updateFillLevelStrategies(currentFillLevelId, updatedStrategies);
    } catch (error) {
      console.error('Error saving strategies:', error);
      // Revert on error
      setCurrentStrategies(currentStrategies);
    } finally {
      setIsSavingStrategies(false);
    }
  };

  const handleRemoveStrategy = async (index: number) => {
    if (!currentFillLevelId) return;
    
    const updatedStrategies = currentStrategies.filter((_, i) => i !== index);
    setCurrentStrategies(updatedStrategies);
    
    // Save to backend
    setIsSavingStrategies(true);
    try {
      await updateFillLevelStrategies(currentFillLevelId, updatedStrategies);
    } catch (error) {
      console.error('Error saving strategies:', error);
      // Revert on error
      setCurrentStrategies(currentStrategies);
    } finally {
      setIsSavingStrategies(false);
    }
  };

  const handleEditModeToggle = async () => {
    if (isEditMode) {
      // Exiting edit mode - validate that all cups are filled before saving
      // Check that all tracked needs have fillLevel > 0 (not null and not 0)
      const allFilled = trackedNeeds.every(tn => {
        const level = fillLevels[tn.id];
        return level !== null && level !== undefined && level > 0;
      });
      
      if (!allFilled) {
        // Don't save if not all cups are filled (empty/null state is not saveable)
        return;
      }

      // Save snapshot - only save fill levels that are > 0
      try {
        const fillLevelsForSave: Record<string, number> = {};
        Object.entries(fillLevels).forEach(([key, value]) => {
          // Only save if value is not null and > 0
          if (value !== null && value !== undefined && value > 0) {
            fillLevelsForSave[key] = value;
          }
        });
        await saveFillLevelsSnapshot(fillLevelsForSave);
        setHasFilledToday(true);
        setYesterdayFillLevels({}); // Clear yesterday's values since we just saved today
        // Update last updated timestamps
        const now = new Date().toISOString();
        const newTimestamps: Record<string, string | null> = {};
        trackedNeeds.forEach(tn => {
          newTimestamps[tn.id] = now;
        });
        setLastUpdated(newTimestamps);
        setHasFilledAllCups(false); // Reset for next time
        
        // Reload timeseries data if a cup is selected to get the new fill level entry
        if (selectedCupId) {
          try {
            const data = await getNeedTimeseries(selectedCupId);
            setTimeseriesData(data);
            
            // Find today's entry and load its strategies
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let targetEntry = data.find(item => {
              const itemDate = new Date(item.date);
              itemDate.setHours(0, 0, 0, 0);
              return itemDate.getTime() === today.getTime();
            });
            
            // If no today's entry, use the most recent one
            if (!targetEntry && data.length > 0) {
              targetEntry = data[data.length - 1];
            }
            
            if (targetEntry) {
              setCurrentFillLevelId(targetEntry.id);
              setCurrentStrategies(targetEntry.strategies || []);
            } else {
              setCurrentFillLevelId(null);
              setCurrentStrategies([]);
            }
          } catch (error) {
            console.error('Error reloading timeseries after save:', error);
          }
        }
      } catch (error) {
        console.error('Error saving fill levels snapshot:', error);
      }
    } else {
      // Entering edit mode - clear selected cup
      setSelectedCupId(null);
      setTimeseriesData([]);
    }
    setIsEditMode(!isEditMode);
  };

  if (isLoading) {
    return (
      <View className="relative">
        <View
          className="rounded-2xl shadow-lg shadow-black/10"
          style={{
            backgroundColor: baseColors.offwhite,
            elevation: 10, // For Android
          }}
        >
          <View className="p-10 items-center justify-center gap-3">
            <ActivityIndicator size="small" color={baseColors.lilac} />
            <Text className="text-sm text-gray-600">Lade Bedürfnisse...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="relative">
      <View
        className={`rounded-2xl shadow-lg shadow-black/10 relative z-10 border border-white`}
        style={{
          backgroundColor: isEditMode ? '#D3FBBF60' : baseColors.offwhite+'90',
          elevation: 10, // For Android
        }}
      >
        <View className="flex-row justify-between items-center px-4 pt-3 pb-2 mb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-black">Top Bedürfnisse</Text>
          </View>
          {trackedNeeds.length > 0 && (
            <TouchableOpacity
              className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${(hasFilledToday && !isEditMode) || (isEditMode && !hasFilledAllCups)
                  ? 'border-gray-300 bg-gray-100'
                  : 'border-black/10'
                }`}
              onPress={handleEditModeToggle}
              disabled={(hasFilledToday && !isEditMode) || (isEditMode && !hasFilledAllCups)}
            >
              <Text className={`text-xs ${(hasFilledToday && !isEditMode) || (isEditMode && !hasFilledAllCups)
                  ? 'text-gray-400'
                  : 'text-black'
                }`}>
                {isEditMode ? 'Füllstand speichern' : 'Schalen füllen'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="px-4 pb-2">
          <Text className="text-sm text-gray-600 leading-5 mb-2">
            {isEditMode
              ? 'Tippe auf eine Schale, um den Füllstand zu setzen. Speichere deine Bedürfnis-Füllstände indem du die Bearbeitung abschließt.'
              : 'Wähle bis zu 3 Top Bedürfnisse aus und verfolge, wie gut sie erfüllt sind. Tippe auf eine Schale, um den Verlauf zu sehen.'}
          </Text>
          {!isEditMode && trackedNeeds.length > 0 && !hasFilledToday && (
            <View
              className="flex-row items-center p-3 rounded-xl mt-2 mb-4"
              style={{ backgroundColor: baseColors.orange + '30' }}
            >
              <Lightbulb size={16} color={baseColors.orange} strokeWidth={2} />
              <Text className="text-sm ml-2 flex-1 leading-[18px]" style={{ color: '#B85C00' }}>
                Du kannst heute deine Schalen füllen! Nutze die Gelegenheit, um deine Bedürfnisse zu reflektieren.
              </Text>
            </View>
          )}
        </View>

        <View className="px-4 pb-4">
          {trackedNeeds.length === 0 ? (
            <View className="py-10 px-5 items-center gap-4">
              <Text className="text-sm text-gray-600 text-center leading-5">
                Wähle bis zu 3 Top Bedürfnisse aus, die du verfolgen möchtest.
              </Text>
              <TouchableOpacity
                className="px-6 py-3 rounded-xl bg-green-300"
                onPress={handleAddNeed}
              >
                <Text className="text-sm font-medium text-black">Bedürfnisse auswählen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row justify-between items-start">
              {trackedNeeds.map((trackedNeed) => {
                const isSelected = selectedCupId === trackedNeed.id;
                const shouldReduceOpacity = !isEditMode && selectedCupId !== null && !isSelected;
                return (
                  <View key={trackedNeed.id} className="w-1/3 relative">
                  <NeedCup
                    trackedNeed={{
                      id: trackedNeed.id,
                      needId: trackedNeed.needId,
                      needName: trackedNeed.needName,
                    }}
                    currentFillLevel={fillLevels[trackedNeed.id] ?? null}
                    onFillLevelChange={(fillLevel) => handleFillLevelChange(trackedNeed.id, fillLevel)}
                    onReplaceNeed={() => handleReplaceNeed(trackedNeed.id)}
                    onCupPress={() => handleCupPress(trackedNeed.id)}
                    isEditMode={isEditMode}
                    isSelected={isSelected}
                    opacity={shouldReduceOpacity ? 0.4 : 1}
                    lastUpdated={lastUpdated[trackedNeed.id]}
                    lastFillLevel={lastFillLevels[trackedNeed.id]}
                    />
                    </View>
                );
              })}
              {trackedNeeds.length < 3 && (
                <TouchableOpacity
                  className="items-center justify-center gap-2 w-1/3 bg-red-300 relative"
                  onPress={handleAddNeed}
                >
                  <View
                    className="w-full h-[120px] border-[3px] border-dashed rounded-lg rounded-bl-[20px] rounded-br-[20px] items-center justify-center bg-gray-50"
                    style={{ borderColor: '#d1d5db' }}
                  >
                    <Text className="text-[32px] text-gray-400 font-light">+</Text>
                  </View>
                  <Text className="text-xs font-medium text-gray-600 text-center">Hinzufügen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Timeseries Display Below Cups */}
        {!isEditMode && selectedCupId && (
          <View className="px-4 pb-4 border-t border-gray-200 mt-4 pt-4">
            <Text className="text-lg font-semibold text-black mb-2">
              {trackedNeeds.find(tn => tn.id === selectedCupId)?.needName}
            </Text>

            {isLoadingTimeseries ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color={baseColors.lilac} />
                <Text className="text-sm text-[#666] mt-2">Lade Daten...</Text>
              </View>
            ) : timeseriesData.length === 0 ? (
              <Text className="text-sm text-[#999] text-center py-8">Noch keine Daten vorhanden</Text>
            ) : (
              <View className="mt-2">
                {/* Simple line chart visualization */}
                <View className="h-[100px] flex-row items-end justify-between border-b border-gray-200 pb-2 relative">
                  {timeseriesData.map((item, idx) => {
                    const maxFill = Math.max(...timeseriesData.map(d => d.fillLevel), 100);
                    const heightPercent = (item.fillLevel / maxFill) * 100;
                    const widthPercent = (1 / timeseriesData.length) * 100;
                    
                    // Use same color logic as cups: >50% = forest, >25% = orange, <=25% = bullshift
                    const barColor = item.fillLevel > 50
                      ? baseColors.forest
                      : item.fillLevel > 25
                      ? baseColors.orange
                      : baseColors.bullshift;
                    
                    // Get text color with proper contrast (8px font, medium 500 weight)
                    const textColor = getTextColorForBackground(barColor, 8, 500);

                    return (
                      <View
                        key={`timeseries-${item.date.getTime()}-${idx}`}
                        className="rounded-sm min-h-1 relative items-center justify-center"
                        style={{
                          width: `${widthPercent}%`,
                          height: `${heightPercent}%`,
                          backgroundColor: barColor,
                        }}
                      >
                        {item.fillLevel > 0 && (
                          <Text className="text-[8px] font-medium" style={{ color: textColor }}>
                            {Math.round(item.fillLevel)}%
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                <View className="flex-row justify-between mt-2">
                  {timeseriesData.map((item, idx) => {
                    if (idx % Math.ceil(timeseriesData.length / 5) === 0 || idx === timeseriesData.length - 1) {
                      return (
                        <Text key={`date-${item.date.getTime()}-${idx}`} className="text-[10px] text-[#666]">
                          {item.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </Text>
                      );
                    }
                    return null;
                  })}
                </View>
              </View>
            )}

            {/* Strategies Input Section */}
            {selectedCupId && (
              <View className="mt-6 pt-4 border-t border-gray-200">
                <Text className="text-base font-semibold text-black mb-3">
                  Strategien zur Erfüllung
                </Text>
                {!currentFillLevelId ? (
                  <Text className="text-sm text-gray-600 mb-3">
                    Fülle zuerst die Schale, um Strategien hinzuzufügen.
                  </Text>
                ) : (
                  <>
                    <Text className="text-sm text-gray-600 mb-3">
                      Füge Strategien hinzu, die dir helfen, dieses Bedürfnis zu erfüllen.
                    </Text>
                    
                    {/* Existing Strategies List */}
                    {currentStrategies.length > 0 && (
                      <View className="mb-3">
                        {currentStrategies.map((strategy, index) => (
                          <View
                            key={`strategy-${index}`}
                            className="flex-row items-center mb-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <Text className="flex-1 text-sm text-black">{strategy}</Text>
                            <TouchableOpacity
                              onPress={() => handleRemoveStrategy(index)}
                              disabled={isSavingStrategies}
                              className="ml-2 p-1"
                            >
                              <X size={18} color="#666" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Add New Strategy Input */}
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={newStrategyText}
                        onChangeText={setNewStrategyText}
                        placeholder="Neue Strategie hinzufügen..."
                        placeholderTextColor="#999"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-black"
                        onSubmitEditing={handleAddStrategy}
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        onPress={handleAddStrategy}
                        disabled={!newStrategyText.trim() || isSavingStrategies}
                        className={`p-2 rounded-lg ${
                          !newStrategyText.trim() || isSavingStrategies
                            ? 'bg-gray-200'
                            : 'bg-green-300'
                        }`}
                      >
                        {isSavingStrategies ? (
                          <ActivityIndicator size="small" color={baseColors.lilac} />
                        ) : (
                          <Plus size={20} color={!newStrategyText.trim() ? '#999' : '#000'} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Replace Need Button */}
            {selectedCupId && (
              <View className="mt-5 pt-4 border-t border-gray-200">
                <TouchableOpacity
                  className="py-3 px-4 rounded-lg bg-gray-100 border border-gray-300 items-center"
                  onPress={() => {
                    const cupId = selectedCupId;
                    setSelectedCupId(null);
                    setTimeseriesData([]);
                    setCurrentStrategies([]);
                    setCurrentFillLevelId(null);
                    handleReplaceNeed(cupId);
                  }}
                >
                  <Text className="text-sm font-medium text-black">Bedürfnis neu auswählen</Text>
                </TouchableOpacity>
                {/* Delete Need Button */}
                <TouchableOpacity
                  className="mt-3 py-3 px-4 rounded-lg bg-red-100 border border-red-300 items-center"
                  onPress={() => {
                    const cupId = selectedCupId;
                    handleDeleteNeed(cupId);
                  }}
                >
                  <Text className="text-sm font-medium text-red-700">Bedürfnis entfernen</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Need Selector Below Cups */}
        {showNeedSelector && (
          <View className="px-4 pb-4 border-t border-gray-200 mt-4 pt-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-black">
                Bedürfnisse auswählen ({selectedNeedIds.length}/3)
              </Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-2xl bg-transparent justify-center items-center"
                onPress={() => {
                  setShowNeedSelector(false);
                  setSelectedNeedIds([]);
                }}
              >
                <Text className="text-lg text-black">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[400px]">
              {needsError ? (
                <View className="p-4">
                  <Text className="text-red-600 text-sm mb-2">{needsError}</Text>
                  <TouchableOpacity
                    className="py-2 px-4 bg-gray-100 rounded-lg"
                    onPress={() => {
                      setNeedsError(null);
                      loadData();
                    }}
                  >
                    <Text className="text-center text-black">Erneut versuchen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
              )}
            </ScrollView>

            <View className="pt-4 border-t border-gray-200 mt-4">
              <TouchableOpacity
                className={`py-3.5 rounded-xl items-center ${selectedNeedIds.length === 0 ? 'bg-gray-200' : 'bg-green-300'}`}
                onPress={handleSaveTrackedNeeds}
                disabled={selectedNeedIds.length === 0}
              >
                <Text className={`text-base font-semibold ${selectedNeedIds.length === 0 ? 'text-gray-400' : 'text-black'}`}>
                  Speichern
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

