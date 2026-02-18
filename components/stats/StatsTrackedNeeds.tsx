import jungleImage from '@/assets/images/Jungle.jpg';
import purpleImageHighres from '@/assets/images/background-lilac-highres.png';
import purpleImage from '@/assets/images/background-lilac.png';
import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import { getNeeds, Need } from '@/lib/api/chat';
import { deleteTrackedNeed, getCurrentFillLevelsWithTimestamps, getNeedTimeseries, getTrackedNeeds, getTrackedNeedStrategies, NeedTimeseriesData, saveFillLevelsSnapshot, saveTrackedNeeds, TrackedNeed, updateTrackedNeedStrategies } from '@/lib/api/stats';
import { Check, ChevronLeft, ChevronsUpDown, ListFilter, Pencil, Plus, RotateCcw, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GroupedNeedsSelector from '../chat/GroupedNeedsSelector';
import DateRangePicker from './DateRangePicker';
import NeedCup from './NeedCup';
import NeedsLineChart from './NeedsLineChart';

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
  const [allTimeseriesData, setAllTimeseriesData] = useState<Record<string, NeedTimeseriesData[]>>({});
  const [isLoadingTimeseries, setIsLoadingTimeseries] = useState(false);
  const [needsError, setNeedsError] = useState<string | null>(null);
  const [currentStrategies, setCurrentStrategies] = useState<string[]>([]);
  const [newStrategyText, setNewStrategyText] = useState('');
  const [isSavingStrategies, setIsSavingStrategies] = useState(false);
  const [currentFillLevelId, setCurrentFillLevelId] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('lastWeek');
  const [allStrategies, setAllStrategies] = useState<Record<string, string[]>>({});
  const [strategyEnabled, setStrategyEnabled] = useState<Record<string, boolean>>({});
  const [selectedNeedForStrategy, setSelectedNeedForStrategy] = useState<string | null>(null);
  const [showNeedDropdown, setShowNeedDropdown] = useState(false);
  const [needDropdownButtonLayout, setNeedDropdownButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const needDropdownButtonRef = useRef<View>(null);
  const needDropdownTooltipOpacity = useRef(new Animated.Value(0)).current;
  const [strategyDone, setStrategyDone] = useState<Record<string, boolean>>({});
  const [strategyDeleted, setStrategyDeleted] = useState<Record<string, boolean>>({});
  const [deletedStrategiesCache, setDeletedStrategiesCache] = useState<Record<string, { needId: string; strategy: string; needName: string }>>({});
  const [strategyFilter, setStrategyFilter] = useState<'alle' | 'erledigt' | 'entfernt'>('alle');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const filterButtonRef = useRef<View>(null);
  const filterTooltipOpacity = useRef(new Animated.Value(0)).current;
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const strategyInputRef = useRef<TextInput>(null);
  const [isEditNeedsModalOpen, setIsEditNeedsModalOpen] = useState(false);
  const [editModalSelectedNeedIds, setEditModalSelectedNeedIds] = useState<string[]>([]);
  const editModalSlideAnim = useRef(new Animated.Value(300)).current;
  const [isSavingFillLevels, setIsSavingFillLevels] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Reload timeseries data when timeframe changes
  useEffect(() => {
    if (trackedNeeds.length > 0) {
      loadTimeseriesData();
    }
  }, [selectedTimeframe, trackedNeeds]);

  // Re-check if needs have been filled today when timeseries data changes
  useEffect(() => {
    if (Object.keys(allTimeseriesData).length === 0 || trackedNeeds.length === 0) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasTodayFillLevel = false;
    for (const [needId, timeseries] of Object.entries(allTimeseriesData)) {
      const todayEntry = timeseries.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime() && 
               entry.fillLevel != null && 
               entry.fillLevel > 0;
      });
      if (todayEntry) {
        hasTodayFillLevel = true;
        break;
      }
    }
    
    if (hasTodayFillLevel) {
      setHasFilledToday(true);
    }
  }, [allTimeseriesData, trackedNeeds]);

  // Initialize selected need for strategy when tracked needs change
  useEffect(() => {
    if (trackedNeeds.length > 0 && !selectedNeedForStrategy) {
      setSelectedNeedForStrategy(trackedNeeds[0].id);
    } else if (trackedNeeds.length > 0 && selectedNeedForStrategy) {
      // Make sure the selected need still exists
      const needExists = trackedNeeds.some(tn => tn.id === selectedNeedForStrategy);
      if (!needExists) {
        setSelectedNeedForStrategy(trackedNeeds[0].id);
      }
    }
  }, [trackedNeeds]);

  // Animate filter dropdown
  useEffect(() => {
    if (showFilterDropdown) {
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
  }, [showFilterDropdown]);

  // Animate need dropdown
  useEffect(() => {
    if (showNeedDropdown) {
      Animated.spring(needDropdownTooltipOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(needDropdownTooltipOpacity, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [showNeedDropdown]);

  // Focus input when dialog opens
  useEffect(() => {
    if (showStrategyDialog) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        strategyInputRef.current?.focus();
      }, 100);
    }
  }, [showStrategyDialog]);

  // Animate edit needs modal
  useEffect(() => {
    if (isEditNeedsModalOpen) {
      Animated.spring(editModalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(editModalSlideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isEditNeedsModalOpen]);

  const getDateFilter = (timeframe: string) => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'dayBeforeYesterday':
        const dayBeforeYesterday = new Date(now);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        startDate = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastWeek':
        // Last 7 days including today (7 days ago to today)
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastMonth':
        // Last 30 days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastYear':
        // Last 365 days
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(0);
    }

    return startDate;
  };

  const getEndDate = (timeframe: string): Date | null => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  };

  const loadTimeseriesData = async (needsToLoad?: TrackedNeed[]) => {
    const needs = needsToLoad || trackedNeeds;
    if (needs.length === 0) return {};

    const startDate = getDateFilter(selectedTimeframe);
    const endDate = getEndDate(selectedTimeframe);
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate?.toISOString();

    const allTimeseries: Record<string, NeedTimeseriesData[]> = {};
    await Promise.all(
      needs.map(async (tn) => {
        try {
          const data = await getNeedTimeseries(tn.id, startDateISO, endDateISO);
          allTimeseries[tn.id] = data;
        } catch (error) {
          console.error(`Error loading timeseries for ${tn.id}:`, error);
          allTimeseries[tn.id] = [];
        }
      })
    );
    setAllTimeseriesData(allTimeseries);
    return allTimeseries;
  };

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
      
      // Close need selector if we already have 3 tracked needs
      if (tracked.length >= 3) {
        setShowNeedSelector(false);
        setSelectedNeedIds([]);
      }

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
          const fillLevel = data.fillLevel && data.fillLevel > 0 ? data.fillLevel : null;
          levels[tn.id] = fillLevel;
          timestamps[tn.id] = data.lastUpdated || null;

          // Check if last updated is today AND there's an actual fill level (> 0)
          if (data.lastUpdated && fillLevel !== null && fillLevel > 0) {
            const lastUpdatedDate = new Date(data.lastUpdated);
            lastUpdatedDate.setHours(0, 0, 0, 0);
            if (lastUpdatedDate.getTime() === today.getTime()) {
              hasTodayData = true;
            }
          }
        } else {
          // If no data from API, check if this is a new tracked need
          const existingNeed = oldTrackedNeeds.find(etn => etn.id === tn.id);
          if (existingNeed && fillLevels[tn.id] !== undefined) {
            // Existing tracked need - preserve fill level
            levels[tn.id] = fillLevels[tn.id];
            timestamps[tn.id] = lastUpdated[tn.id] || null;
            
            // Also check if the preserved fill level was updated today
            const lastUpdatedTime = lastUpdated[tn.id];
            if (lastUpdatedTime && fillLevels[tn.id] !== null && fillLevels[tn.id] !== undefined && (fillLevels[tn.id] as number) > 0) {
              const lastUpdatedDate = new Date(lastUpdatedTime);
              lastUpdatedDate.setHours(0, 0, 0, 0);
              if (lastUpdatedDate.getTime() === today.getTime()) {
                hasTodayData = true;
              }
            }
          } else {
            // New tracked need - always initialize to null
            levels[tn.id] = null;
            timestamps[tn.id] = null;
          }
        }
      });

      setFillLevels(levels);
      setLastUpdated(timestamps);
      setHasFilledToday(hasTodayData);

      // Load last fill levels for all tracked needs (previous entry in timeseries, excluding today)
      // Also check if there's a fill level entry for today in the timeseries
      const lastLevels: Record<string, number> = {};
      const todayForCheck = new Date();
      todayForCheck.setHours(0, 0, 0, 0);
      
      await Promise.all(
        tracked.map(async (tn) => {
          try {
            const timeseries = await getNeedTimeseries(tn.id);
            
            // Check if there's an entry for today with a fill level > 0
            const todayEntry = timeseries.find(entry => {
              const entryDate = new Date(entry.date);
              entryDate.setHours(0, 0, 0, 0);
              return entryDate.getTime() === todayForCheck.getTime() && 
                     entry.fillLevel != null && 
                     entry.fillLevel > 0;
            });
            
            if (todayEntry) {
              hasTodayData = true;
            }
            
            if (timeseries.length > 1) {
              // Get the second-to-last entry (previous fill level)
              // Sort by date to ensure we get the correct order
              const sorted = [...timeseries].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA; // Most recent first
              });

              // Skip today's entry and get the previous one
              for (const entry of sorted) {
                const entryDate = new Date(entry.date);
                entryDate.setHours(0, 0, 0, 0);
                if (entryDate.getTime() !== todayForCheck.getTime()) {
                  lastLevels[tn.id] = entry.fillLevel;
                  break;
                }
              }
            } else if (timeseries.length === 1) {
              // Only one entry - check if it's from today
              const entryDate = new Date(timeseries[0].date);
              entryDate.setHours(0, 0, 0, 0);
              if (entryDate.getTime() !== todayForCheck.getTime()) {
                // Only use it as last fill level if it's not from today
                lastLevels[tn.id] = timeseries[0].fillLevel;
              }
            }
          } catch (error) {
            // Ignore errors - just don't show last fill level
          }
        })
      );
      setLastFillLevels(lastLevels);
      
      // Update hasFilledToday based on timeseries check
      if (hasTodayData) {
        setHasFilledToday(true);
      }

      // Load timeseries data for all tracked needs (will be reloaded when timeframe changes)
      await loadTimeseriesData(tracked);

      // Load strategies for all tracked needs directly
      const strategiesData: Record<string, string[]> = {};
      const doneStrategiesData: Record<string, number[]> = {};
      await Promise.all(
        tracked.map(async (tn) => {
          try {
            const result = await getTrackedNeedStrategies(tn.id);
            strategiesData[tn.id] = result.strategies || [];
            doneStrategiesData[tn.id] = result.doneStrategies || [];
          } catch (error) {
            console.error(`Error loading strategies for ${tn.id}:`, error);
            strategiesData[tn.id] = [];
            doneStrategiesData[tn.id] = [];
          }
        })
      );
      setAllStrategies(strategiesData);

      // Initialize enabled state for all strategies (default to true)
      const enabledState: Record<string, boolean> = {};
      Object.entries(strategiesData).forEach(([needId, strategies]) => {
        strategies.forEach((_, index) => {
          enabledState[`${needId}-${index}`] = true;
        });
      });
      setStrategyEnabled(enabledState);

      // Initialize done state from loaded doneStrategies
      const doneState: Record<string, boolean> = {};
      Object.entries(doneStrategiesData).forEach(([needId, doneIndices]) => {
        doneIndices.forEach((index) => {
          doneState[`${needId}-${index}`] = true;
        });
      });
      setStrategyDone(doneState);

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

      // Initialize all fill levels to null - cups should start empty
      const levels: Record<string, number | null> = {};
      saved.forEach(tn => {
        // Always initialize to null - user must set the value
        levels[tn.id] = null;
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

      // Check if all cups have values (not null)
      const allFilled = trackedNeeds.length === 3 && trackedNeeds.every(tn => {
        const level = tn.id === trackedNeedId ? normalizedFillLevel : updated[tn.id];
        return level !== null && level !== undefined;
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
      // If clicking the same need, deselect it
      setSelectedCupId(null);
      return;
    }

    setSelectedCupId(trackedNeedId);
  };

  const handleFilterButtonPress = () => {
    filterButtonRef.current?.measureInWindow((pageX, pageY, width, height) => {
      setFilterButtonLayout({ x: pageX, y: pageY, width, height });
      setShowFilterDropdown(true);
    });
  };

  const handleFilterSelect = (filter: 'alle' | 'erledigt' | 'entfernt') => {
    setStrategyFilter(filter);
    setShowFilterDropdown(false);
  };

  // Get color for a tracked need based on its index (matching NeedsLineChart colors)
  // Uses the same color structure and indexing as NeedsLineChart
  const getNeedColor = (trackedNeedId: string): string => {
    const needIndex = trackedNeeds.findIndex(tn => tn.id === trackedNeedId);
    if (needIndex === -1) return baseColors.forest;

    // Match NeedsLineChart defaultColors structure - use point color for pills
    const defaultColors = [
      { line: baseColors.forest, point: baseColors.black },    // Index 0
      { line: baseColors.emerald, point: '#258490' },   // Index 1
      { line: baseColors.lilac, point: baseColors.purple },     // Index 2
    ];

    const colors = defaultColors[needIndex % defaultColors.length];
    return colors.point;
  };

  const handleAddStrategy = async (trackedNeedId?: string) => {
    const targetNeedId = trackedNeedId || selectedNeedForStrategy || (trackedNeeds.length > 0 ? trackedNeeds[0].id : null);
    if (!newStrategyText.trim() || !targetNeedId) return;

    const currentStrategies = allStrategies[targetNeedId] || [];
    const updatedStrategies = [...currentStrategies, newStrategyText.trim()];

    // Update local state immediately
    const updatedAllStrategies = {
      ...allStrategies,
      [targetNeedId]: updatedStrategies,
    };
    setAllStrategies(updatedAllStrategies);

    // Initialize enabled state for the new strategy (default to true)
    const newStrategyIndex = updatedStrategies.length - 1;
    setStrategyEnabled(prev => ({
      ...prev,
      [`${targetNeedId}-${newStrategyIndex}`]: true,
    }));

    setNewStrategyText('');

    // Calculate current done indices to preserve done status
    const doneIndices: number[] = [];
    currentStrategies.forEach((_, idx) => {
      const key = `${targetNeedId}-${idx}`;
      if (strategyDone[key]) {
        doneIndices.push(idx);
      }
    });

    // Save to backend
    setIsSavingStrategies(true);
    try {
      await updateTrackedNeedStrategies(targetNeedId, updatedStrategies, doneIndices);
      // Close dialog after successful save
      setShowStrategyDialog(false);
    } catch (error) {
      console.error('Error saving strategies:', error);
      // Revert on error
      setAllStrategies(allStrategies);
    } finally {
      setIsSavingStrategies(false);
    }
  };

  const handleToggleStrategyDone = async (trackedNeedId: string, index: number) => {
    const strategyKey = `${trackedNeedId}-${index}`;
    const currentDone = strategyDone[strategyKey] || false;
    const newDoneState = !currentDone;

    // Update local state immediately
    setStrategyDone(prev => ({
      ...prev,
      [strategyKey]: newDoneState,
    }));

    // Calculate all done indices for this tracked need
    const currentStrategies = allStrategies[trackedNeedId] || [];
    const doneIndices: number[] = [];
    currentStrategies.forEach((_, idx) => {
      const key = `${trackedNeedId}-${idx}`;
      const isDone = (idx === index ? newDoneState : strategyDone[key]) || false;
      if (isDone) {
        doneIndices.push(idx);
      }
    });

    // Save to backend
    setIsSavingStrategies(true);
    try {
      await updateTrackedNeedStrategies(trackedNeedId, currentStrategies, doneIndices);
    } catch (error) {
      console.error('Error saving done status:', error);
      // Revert on error
      setStrategyDone(prev => ({
        ...prev,
        [strategyKey]: currentDone,
      }));
    } finally {
      setIsSavingStrategies(false);
    }
  };

  const handleDeleteStrategy = async (trackedNeedId: string, index: number) => {
    const strategyKey = `${trackedNeedId}-${index}`;
    const currentStrategies = allStrategies[trackedNeedId] || [];
    if (index >= currentStrategies.length) return;

    const strategy = currentStrategies[index];
    const trackedNeed = trackedNeeds.find(tn => tn.id === trackedNeedId);

    // Cache the deleted strategy for the "entfernt" tab
    setDeletedStrategiesCache(prev => ({
      ...prev,
      [strategyKey]: {
        needId: trackedNeedId,
        strategy: strategy,
        needName: trackedNeed?.needName || '',
      },
    }));

    // Mark as deleted in local state
    setStrategyDeleted(prev => ({
      ...prev,
      [strategyKey]: true,
    }));

    // Actually remove from backend
    const updatedStrategies = currentStrategies.filter((_, i) => i !== index);
    const updatedAllStrategies = {
      ...allStrategies,
      [trackedNeedId]: updatedStrategies,
    };
    setAllStrategies(updatedAllStrategies);

    // Rebuild enabled state for all strategies (simpler than re-indexing)
    const newEnabledState: Record<string, boolean> = {};
    Object.entries(updatedAllStrategies).forEach(([needId, strategies]) => {
      strategies.forEach((_, strategyIndex) => {
        const key = `${needId}-${strategyIndex}`;
        // Preserve existing state if it exists, otherwise default to true
        newEnabledState[key] = strategyEnabled[key] !== undefined ? strategyEnabled[key] : true;
      });
    });
    setStrategyEnabled(newEnabledState);

    // Rebuild done state: remove deleted index and shift indices after it
    const newDoneState: Record<string, boolean> = {};
    const newDoneIndices: number[] = [];
    updatedStrategies.forEach((_, newIndex) => {
      const oldIndex = newIndex >= index ? newIndex + 1 : newIndex;
      const oldKey = `${trackedNeedId}-${oldIndex}`;
      const isDone = strategyDone[oldKey] || false;
      if (isDone) {
        const newKey = `${trackedNeedId}-${newIndex}`;
        newDoneState[newKey] = true;
        newDoneIndices.push(newIndex);
      }
    });
    setStrategyDone(prev => {
      const updated = { ...prev };
      // Remove all old keys for this tracked need
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${trackedNeedId}-`)) {
          delete updated[key];
        }
      });
      // Add new keys
      Object.assign(updated, newDoneState);
      return updated;
    });

    // Save to backend
    setIsSavingStrategies(true);
    try {
      await updateTrackedNeedStrategies(trackedNeedId, updatedStrategies, newDoneIndices);
    } catch (error) {
      console.error('Error saving strategies:', error);
      // Revert on error
      setAllStrategies(allStrategies);
      setStrategyDeleted(prev => {
        const updated = { ...prev };
        delete updated[strategyKey];
        return updated;
      });
    } finally {
      setIsSavingStrategies(false);
    }
  };

  const handleRemoveStrategy = async (trackedNeedId: string, index: number) => {
    await handleDeleteStrategy(trackedNeedId, index);
  };

  const handleEditModeToggle = async () => {
    if (isEditMode) {
      // Exiting edit mode - validate that all cups have values before saving
      const allFilled = trackedNeeds.length > 0 && trackedNeeds.every(tn => {
        const level = fillLevels[tn.id];
        return level !== null && level !== undefined && level > 0;
      });

      if (!allFilled) {
        // Don't save if not all cups have values
        console.warn('Cannot save: not all cups have fill levels', { 
          fillLevels, 
          trackedNeeds: trackedNeeds.map(tn => ({ id: tn.id, name: tn.needName, level: fillLevels[tn.id] }))
        });
        return;
      }

      // Save snapshot - save all fill levels that are not null
      setIsSavingFillLevels(true);
      try {
        const fillLevelsForSave: Record<string, number> = {};
        trackedNeeds.forEach(tn => {
          const level = fillLevels[tn.id];
          // Save if value is not null and > 0
          if (level !== null && level !== undefined && level > 0) {
            fillLevelsForSave[tn.id] = level;
          }
        });
        
        console.log('Saving fill levels:', fillLevelsForSave);
        console.log('Tracked needs:', trackedNeeds.map(tn => ({ id: tn.id, needId: tn.needId, name: tn.needName })));
        
        if (Object.keys(fillLevelsForSave).length === 0) {
          console.warn('No fill levels to save');
          setIsSavingFillLevels(false);
          return;
        }
        
        if (Object.keys(fillLevelsForSave).length !== trackedNeeds.length) {
          console.warn('Mismatch: not all tracked needs have fill levels to save', {
            fillLevelsForSaveKeys: Object.keys(fillLevelsForSave),
            trackedNeedsIds: trackedNeeds.map(tn => tn.id)
          });
        }
        
        const result = await saveFillLevelsSnapshot(fillLevelsForSave);
        console.log('Fill levels saved successfully:', result);
        
        // Only exit edit mode and update state after successful save
        setIsEditMode(false);
        
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

        // Reload all data to ensure UI is in sync
        await loadData();
      } catch (error) {
        console.error('Error saving fill levels snapshot:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          fillLevelsForSave: trackedNeeds.map(tn => ({ id: tn.id, level: fillLevels[tn.id] }))
        });
        // Don't exit edit mode if save failed
        // Show error to user - you might want to add a toast/alert here
        alert('Fehler beim Speichern der Füllstände. Bitte versuche es erneut.');
      } finally {
        setIsSavingFillLevels(false);
      }
    } else {
      // Entering edit mode - clear selected cup
      setSelectedCupId(null);
      setTimeseriesData([]);

      // Clear last fill levels so they don't show in edit mode
      setLastFillLevels({});

      // Initialize all cups to null when entering edit mode
      const resetLevels: Record<string, number | null> = {};
      trackedNeeds.forEach(tn => {
        resetLevels[tn.id] = null;
      });
      setFillLevels(resetLevels);

      // Button starts disabled - will be enabled when all cups have values
      setHasFilledAllCups(false);
      setIsEditMode(true);
    }
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
            <LoadingIndicator />
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
          backgroundColor: baseColors.offwhite + '90',
          elevation: 10, // For Android
        }}
      >
        <View className="flex-row justify-between items-center px-4 pt-3 pb-2 mb-2">
          <View className="flex-row items-center gap-2">
            {isEditMode && (
              <TouchableOpacity
                onPress={() => {
                  // Exit edit mode without saving
                  setIsEditMode(false);
                  // Reload data to restore original fill levels
                  loadData();
                }}
                className="p-1"
              >
                <ChevronLeft size={20} color="#000" />
              </TouchableOpacity>
            )}
            <Text className="text-base font-semibold text-black">Top Bedürfnisse</Text>
          </View>
          {!isEditMode && trackedNeeds.length > 0 && (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  // Pre-select current tracked needs
                  const currentNeedIds = trackedNeeds.map(tn => tn.needId);
                  setEditModalSelectedNeedIds(currentNeedIds);
                  setIsEditNeedsModalOpen(true);
                }}
                className="p-1.5"
              >
                <Pencil size={16} color={baseColors.black} />
              </TouchableOpacity>
                <DateRangePicker
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
            </View>
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
              className=" rounded-xl mt-2 mb-4 overflow-hidden"
              style={{ backgroundColor: baseColors.lilac }}
            >
              
              <View className="p-3">
              <Text className="ml-1 flex-1 leading-[18px] mb-4" style={{ color: baseColors.black }}>
                Du kannst heute deine Schalen füllen! Nutze die Gelegenheit, um deine Bedürfnisse zu reflektieren.
              </Text>
              <TouchableOpacity
                className="px-3 py-1 rounded-full self-start shadow-md shadow-black/10"
                style={{ backgroundColor: baseColors.offwhite, borderRadius: 999, overflow: 'hidden' }}
                onPress={handleEditModeToggle}
              >
                <ImageBackground source={purpleImageHighres} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                </ImageBackground>
                <Text className="text-sm font-medium" style={{ color: baseColors.forest }}>
                  Schalen füllen
                </Text>
              </TouchableOpacity>
            </View>
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
          ) : isEditMode ? (
            <View className="gap-4">
              <View className="flex-row justify-between items-start">
                {trackedNeeds.map((trackedNeed, needIndex) => {
                  // Use same colors as line chart
                  const defaultColors = [
                    baseColors.forest,
                    baseColors.emerald,
                    baseColors.lilac,
                  ];
                  const cupColor = defaultColors[needIndex % defaultColors.length];

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
                        onCupPress={() => { }}
                        isEditMode={isEditMode}
                        isSelected={false}
                        opacity={1}
                        lastUpdated={lastUpdated[trackedNeed.id]}
                        lastFillLevel={lastFillLevels[trackedNeed.id]}
                        color={cupColor}
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
              <View className="mt-2 flex-row items-center justify-center" style={{ overflow: 'hidden', borderRadius: 999 }}>
                <TouchableOpacity
                  onPress={handleEditModeToggle}
                  disabled={!hasFilledAllCups || isSavingFillLevels}
                  style={{ opacity: (!hasFilledAllCups || isSavingFillLevels) ? 0.5 : 1, position: 'relative' }}
                >
                  <ImageBackground
                    source={jungleImage}
                    resizeMode="cover"
                    style={{
                      width: '100%', height: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                    {isSavingFillLevels ? (
                      <LoadingIndicator />
                    ) : (
                      <>
                        <Text style={{ fontSize: 14, color: baseColors.offwhite }}>
                          Füllstand speichern
                        </Text>
                        <Check size={16} color="#fff" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                      </>
                    )}
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <NeedsLineChart
                trackedNeeds={trackedNeeds}
                timeseriesData={allTimeseriesData}
                selectedNeedId={selectedCupId}
                onNeedPress={handleCupPress}
                currentFillLevels={fillLevels}
                height={240}
              />
            </View>
          )}
        </View>

        {/* Strategies Section - Always Visible */}
        {!isEditMode && trackedNeeds.length > 0 && (
          <View className="px-4 pb-4 border-t border-gray-200 mt-4 pt-4">
            <View className="flex-row justify-between items-center mb-2">
              {showStrategyDialog ? (
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setShowStrategyDialog(false);
                      setNewStrategyText('');
                    }}
                  >
                    <ChevronLeft size={18} color="#666" style={{ marginLeft: -4 }} />
                  </TouchableOpacity>
                  <Text className="text-base font-semibold text-black">Strategie hinzufügen</Text>
                </View>
              ) : (
                <>
                  <Text className="text-base font-semibold text-black">Strategien</Text>
                  <View className="flex-row items-center gap-2">
                    <View ref={filterButtonRef} collapsable={false}>
                      <TouchableOpacity
                        className="flex-row items-center gap-1.5 py-1.5 px-2 rounded-lg"
                        onPress={handleFilterButtonPress}
                      >
                        <ListFilter size={14} color={baseColors.black} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      className="px-3 py-1 rounded-full border border-black/10 flex-row items-center gap-1"
                      onPress={() => setShowStrategyDialog(true)}
                    >
                      <Plus size={12} color="#000" strokeWidth={2} />
                      <Text className="text-xs text-black">Strategie hinzufügen</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            {!showStrategyDialog && (
              <>
                <Text className="text-sm text-gray-600 leading-5 mb-3">
                  Überlege dir durch welche Strategien du deine top Bedürfnisse erfüllen möchtest.
                </Text>
              </>
            )}

            {/* Filter Dropdown Modal */}
            <Modal
              visible={showFilterDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowFilterDropdown(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                className="flex-1"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
                onPress={() => setShowFilterDropdown(false)}
              >
                <Animated.View
                  style={[
                    {
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
                      left: filterButtonLayout.x + filterButtonLayout.width / 2 - 90,
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  {/* Arrow - center aligned */}
                  <View
                    style={{
                      position: 'absolute',
                      top: -8,
                      left: '50%',
                      marginLeft: -8,
                      width: 0,
                      height: 0,
                      borderLeftWidth: 8,
                      borderRightWidth: 8,
                      borderBottomWidth: 8,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderBottomColor: '#fff',
                    }}
                  />

                  {/* Options List */}
                  <View style={{ padding: 8 }}>
                    {(['alle', 'erledigt', 'entfernt'] as const).map((filter) => (
                      <TouchableOpacity
                        key={filter}
                        style={[
                          {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 8,
                          },
                          strategyFilter === filter && {
                            backgroundColor: baseColors.offwhite,
                          },
                        ]}
                        onPress={() => handleFilterSelect(filter)}
                      >
                        <Text
                          style={[
                            {
                              fontSize: 14,
                              color: '#333',
                            },
                            strategyFilter === filter && {
                              color: baseColors.black,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                        {strategyFilter === filter && (
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: baseColors.black,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 'bold',
                              }}
                            >
                              ✓
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </Modal>

            {/* Show creation dialog OR strategies list */}
            {showStrategyDialog ? (
              /* Add New Strategy Dialog - Replaces strategies list when active */
              <View className="mt-2">
                {/* Need Selector */}
                <View className="mb-3">
                  <View ref={needDropdownButtonRef} collapsable={false}>
                    <TouchableOpacity
                      className="px-1 py-2 rounded-lg flex-row items-center"
                      onPress={() => {
                        needDropdownButtonRef.current?.measureInWindow((pageX, pageY, width, height) => {
                          setNeedDropdownButtonLayout({ x: pageX, y: pageY, width, height });
                          setShowNeedDropdown(true);
                        });
                      }}
                    >
                      {selectedNeedForStrategy && (
                        <View
                          className="rounded-full mr-2"
                          style={{
                            backgroundColor: getNeedColor(selectedNeedForStrategy),
                            width: 20,
                            height: 12,
                            borderRadius: 6
                          }}
                        />
                      )}
                      <Text className="flex-1 text-sm text-black whitespace-nowrap overflow-hidden text-ellipsis">
                        {selectedNeedForStrategy
                          ? trackedNeeds.find(tn => tn.id === selectedNeedForStrategy)?.needName
                          : 'Bedürfnis auswählen'}
                      </Text>
                      <ChevronsUpDown size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Need Dropdown Modal */}
                <Modal
                  visible={showNeedDropdown}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowNeedDropdown(false)}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    className="flex-1"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
                    onPress={() => setShowNeedDropdown(false)}
                  >
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          backgroundColor: '#fff',
                          borderRadius: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.2,
                          shadowRadius: 20,
                          elevation: 12,
                          zIndex: 2000,
                          width: needDropdownButtonLayout.width || 180,
                          opacity: needDropdownTooltipOpacity,
                          top: needDropdownButtonLayout.y + needDropdownButtonLayout.height + 8,
                          left: needDropdownButtonLayout.x,
                        },
                      ]}
                      onStartShouldSetResponder={() => true}
                    >
                      {/* Arrow - center aligned */}
                      <View
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: '50%',
                          marginLeft: -8,
                          width: 0,
                          height: 0,
                          borderLeftWidth: 8,
                          borderRightWidth: 8,
                          borderBottomWidth: 8,
                          borderLeftColor: 'transparent',
                          borderRightColor: 'transparent',
                          borderBottomColor: '#fff',
                        }}
                      />

                      {/* Options List */}
                      <View style={{ padding: 8 }}>
                        {trackedNeeds.map((trackedNeed) => {
                          const needColor = getNeedColor(trackedNeed.id);
                          return (
                            <TouchableOpacity
                              key={trackedNeed.id}
                              style={[
                                {
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                },
                                selectedNeedForStrategy === trackedNeed.id && {
                                  backgroundColor: baseColors.offwhite,
                                },
                              ]}
                              onPress={() => {
                                setSelectedNeedForStrategy(trackedNeed.id);
                                setShowNeedDropdown(false);
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View
                                  className="rounded-full mr-2"
                                  style={{ backgroundColor: needColor, width: 20, height: 12, borderRadius: 6 }}
                                />
                                <Text
                                  style={[
                                    {
                                      fontSize: 14,
                                      color: '#333',
                                    },
                                    selectedNeedForStrategy === trackedNeed.id && {
                                      color: baseColors.black,
                                      fontWeight: '600',
                                    },
                                  ]}
                                >
                                  {trackedNeed.needName}
                                </Text>
                              </View>
                              {selectedNeedForStrategy === trackedNeed.id && (
                                <View
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 9,
                                    backgroundColor: baseColors.black,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: '#fff',
                                      fontSize: 10,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    ✓
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                </Modal>

                {/* Strategy Input */}
                <View>
                  <TextInput
                    ref={strategyInputRef}
                    value={newStrategyText}
                    onChangeText={setNewStrategyText}
                    placeholder="Neue Strategie hinzufügen..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-black mb-3"
                    style={{ minHeight: 80 }}
                    onSubmitEditing={() => {
                      if (selectedNeedForStrategy) {
                        handleAddStrategy(selectedNeedForStrategy);
                      }
                    }}
                    returnKeyType="done"
                  />
                  <View className="relative flex flex-row items-center justify-center">
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedNeedForStrategy) {
                          handleAddStrategy(selectedNeedForStrategy);
                        }
                      }}
                      disabled={!newStrategyText.trim() || !selectedNeedForStrategy || isSavingStrategies}
                      style={{
                        opacity: (!newStrategyText.trim() || !selectedNeedForStrategy || isSavingStrategies) ? 0.5 : 1,
                        overflow: 'hidden',
                        borderRadius: 999,
                        position: 'relative',
                      }}
                    >
                      <ImageBackground
                        source={purpleImage}
                        resizeMode="cover"
                        style={{
                          width: '100%',
                          height: '100%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
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
                        {isSavingStrategies ? (
                          <LoadingIndicator />
                        ) : (
                          <>
                            <Text style={{ fontSize: 14, color: baseColors.black }}>
                              Hinzufügen
                            </Text>
                            <Check size={16} color="#fff" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                          </>
                        )}
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* Strategies List - Show strategies from all tracked needs */
              (() => {
                // Check if there are any strategies at all
                const hasAnyStrategies = trackedNeeds.some(tn => {
                  const strategies = allStrategies[tn.id] || [];
                  return strategies.length > 0;
                });

                if (strategyFilter === 'entfernt') {
                  // Show deleted strategies from cache
                  const deletedEntries = Object.entries(deletedStrategiesCache);
                  const filteredDeleted = selectedCupId
                    ? deletedEntries.filter(([_, deletedStrategy]) => deletedStrategy.needId === selectedCupId)
                    : deletedEntries;

                  if (filteredDeleted.length === 0) {
                    return (
                      <Text className="text-sm text-gray-400 text-center py-8">
                        Keine entfernten Strategien
                      </Text>
                    );
                  }
                  return filteredDeleted.map(([strategyKey, deletedStrategy]) => {
                    const needColor = getNeedColor(deletedStrategy.needId);
                    return (
                      <View
                        key={strategyKey}
                        className="flex-row items-center py-3 border-b border-gray-200"
                      >
                        <View
                          className="mr-2"
                          style={{
                            backgroundColor: needColor, width: 20,
                            height: 12,
                            borderRadius: 6
                          }}
                        />
                        <Text className="flex-1 text-sm text-gray-400">
                          {deletedStrategy.strategy}
                        </Text>
                        <Text className="text-xs text-gray-400 mr-2">
                          ({deletedStrategy.needName})
                        </Text>
                      </View>
                    );
                  });
                }

                // Check if there are any strategies matching the filter
                let hasMatchingStrategies = false;
                const filteredStrategies: Array<{ trackedNeed: typeof trackedNeeds[0]; strategy: string; index: number; strategyKey: string; isDone: boolean }> = [];

                trackedNeeds.forEach((trackedNeed) => {
                  // Filter by selected need if one is selected
                  if (selectedCupId && trackedNeed.id !== selectedCupId) return;

                  const needStrategies = allStrategies[trackedNeed.id] || [];
                  needStrategies.forEach((strategy, index) => {
                    const strategyKey = `${trackedNeed.id}-${index}`;
                    const isDone = strategyDone[strategyKey] || false;
                    const isDeleted = strategyDeleted[strategyKey] || false;

                    // Skip deleted strategies (they're shown in 'entfernt' tab, which is handled above)
                    if (isDeleted) return;

                    // Filter strategies based on selected tab
                    if (strategyFilter === 'alle') {
                      // Show only active strategies (not deleted and not completed)
                      if (!isDone) {
                        filteredStrategies.push({ trackedNeed, strategy, index, strategyKey, isDone });
                        hasMatchingStrategies = true;
                      }
                    } else if (strategyFilter === 'erledigt') {
                      // Show only done, non-deleted strategies
                      if (isDone) {
                        filteredStrategies.push({ trackedNeed, strategy, index, strategyKey, isDone });
                        hasMatchingStrategies = true;
                      }
                    }
                  });
                });

                if (!hasMatchingStrategies) {
                  if (strategyFilter === 'alle') {
                    return (
                      <View className="py-8">
                        <Text className="text-sm text-gray-400 text-center mb-1">
                          Noch keine Strategien
                        </Text>
                        <Text className="text-xs text-gray-400 text-center">
                          Füge Strategien hinzu, um deine Bedürfnisse zu erfüllen
                        </Text>
                      </View>
                    );
                  } else if (strategyFilter === 'erledigt') {
                    return (
                      <Text className="text-sm text-gray-400 text-center py-8">
                        Keine erledigten Strategien
                      </Text>
                    );
                  }
                }

                // Show active strategies
                return filteredStrategies.map(({ trackedNeed, strategy, index, strategyKey, isDone }) => {
                  const needColor = getNeedColor(trackedNeed.id);
                  return (
                    <View
                      key={strategyKey}
                      className="flex-row items-center py-1 border-b border-black/10 last:border-b-0"
                    >
                      <View
                        className="rounded-full mr-2"
                        style={{
                          backgroundColor: needColor, width: 20,
                          height: 12,
                          borderRadius: 6
                        }}
                      />
                      <Text className={`flex-1 text-sm ${isDone ? 'text-gray-400' : 'text-black'}`}>
                        {strategy}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteStrategy(trackedNeed.id, index)}
                        disabled={isSavingStrategies}
                        className="p-1"
                      >
                        <X size={16} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleToggleStrategyDone(trackedNeed.id, index)}
                        className="p-1"
                      >
                        <View className={`w-6 h-6 rounded-full items-center justify-center`} style={{ backgroundColor: baseColors.emerald }}>
                          {strategyFilter === 'erledigt' ? (
                            <RotateCcw size={13} color="#fff" />
                          ) : (
                            <Check size={13} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                });
              })()
            )}
          </View>
        )}


        {/* Need Selector Below Cups */}
        {showNeedSelector && trackedNeeds.length < 3 && (
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

        {/* Edit Needs Drawer Modal */}
        <Modal
          visible={isEditNeedsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditNeedsModalOpen(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              justifyContent: 'flex-end',
            }}
            activeOpacity={1}
            onPress={() => setIsEditNeedsModalOpen(false)}
          >
            <Animated.View
              style={[
                {
                  backgroundColor: baseColors.background,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxWidth: 600,
                  width: '100%',
                  alignSelf: 'center',
                  paddingBottom: 32,
                  transform: [{ translateY: editModalSlideAnim }],
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: baseColors.black + '33',
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginTop: 8,
                  marginBottom: 16,
                }}
              />
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, marginLeft: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#000' }}>
                  Top Bedürfnisse bearbeiten
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                  Wähle bis zu 3 Bedürfnisse aus ({editModalSelectedNeedIds.length}/3)
                </Text>
              </View>
              <ScrollView style={{ paddingHorizontal: 16, maxHeight: 500 }}>
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
                        if (editModalSelectedNeedIds.includes(need.id)) {
                          setEditModalSelectedNeedIds(editModalSelectedNeedIds.filter(id => id !== need.id));
                        } else if (editModalSelectedNeedIds.length < 3) {
                          setEditModalSelectedNeedIds([...editModalSelectedNeedIds, need.id]);
                        }
                      }
                    }}
                    isLoading={false}
                    selectedNeedIds={editModalSelectedNeedIds}
                  />
                )}
              </ScrollView>
              <View style={{ paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 16 }}>
                <TouchableOpacity
                  className={`py-3.5 rounded-xl items-center ${editModalSelectedNeedIds.length === 0 ? 'bg-gray-200' : 'bg-green-300'}`}
                  onPress={async () => {
                    try {
                      const saved = await saveTrackedNeeds(editModalSelectedNeedIds);
                      setTrackedNeeds(saved);
                      setIsEditNeedsModalOpen(false);
                      setEditModalSelectedNeedIds([]);

                      // Initialize all fill levels to null - cups should start empty
                      const levels: Record<string, number | null> = {};
                      saved.forEach(tn => {
                        levels[tn.id] = null;
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
                  }}
                  disabled={editModalSelectedNeedIds.length === 0}
                >
                  <Text className={`text-base font-semibold ${editModalSelectedNeedIds.length === 0 ? 'text-gray-400' : 'text-black'}`}>
                    Speichern
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
}

