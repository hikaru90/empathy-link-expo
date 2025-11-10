import baseColors from '@/baseColors.config';
import { getFeelings, type Feeling } from '@/lib/api/chat';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateRangePicker from './DateRangePicker';
import DonutChart from './DonutChart';
import FeelingTypeFilter, { type FeelingTypeFilter as FeelingTypeFilterType } from './FeelingTypeFilter';

interface FeelingsData {
  value: string;
  count: number;
}

interface StatsFeelingsProps {
  data: FeelingsData[];
  rawAnalyses?: any[];
}

const timeframeOptions = [
  { value: 'today', label: 'Heute' },
  { value: 'lastWeek', label: 'Letzte Woche' },
  { value: 'lastMonth', label: 'Letzter Monat' },
  { value: 'lastYear', label: 'Letztes Jahr' },
];

// Calculate text color based on background brightness
// Returns white for dark backgrounds, black for light backgrounds
const computedColor = (backgroundColor: string): string => {
  // Handle rgba/rgb format
  if (backgroundColor.startsWith('rgba') || backgroundColor.startsWith('rgb')) {
    const matches = backgroundColor.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]);
      const g = parseInt(matches[1]);
      const b = parseInt(matches[2]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5 ? '#ffffff' : '#000000';
    }
  }
  
  // Handle hex format
  let hex = backgroundColor.replace('#', '');
  
  // Handle 3-digit hex (e.g., #fff)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance (perceived brightness)
  // Using the relative luminance formula from WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white if background is dark (luminance < 0.5), black if light
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

export default function StatsFeelings({ data, rawAnalyses }: StatsFeelingsProps) {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('lastWeek');
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [feelingTypeFilter, setFeelingTypeFilter] = useState<FeelingTypeFilterType>('all');
  const [feelingsReference, setFeelingsReference] = useState<Map<string, boolean>>(new Map());

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [mainViewHeight, setMainViewHeight] = useState(0);
  const [timelineViewHeight, setTimelineViewHeight] = useState(0);
  const heightAnim = useRef(new Animated.Value(0)).current;

  // Load feelings reference data to map names to positive/negative
  useEffect(() => {
    const loadFeelingsReference = async () => {
      try {
        const feelings = await getFeelings();
        const feelingMap = new Map<string, boolean>();
        feelings.forEach((feeling: Feeling) => {
          feelingMap.set(feeling.nameDE, feeling.positive);
        });
        setFeelingsReference(feelingMap);
      } catch (error) {
        console.error('Failed to load feelings reference:', error);
      }
    };
    loadFeelingsReference();
  }, []);

  // Clear selected feeling if it doesn't match the current filter
  useEffect(() => {
    if (selectedFeeling && feelingTypeFilter !== 'all' && feelingsReference.size > 0) {
      const isPositive = feelingsReference.get(selectedFeeling);
      const shouldShow =
        (feelingTypeFilter === 'positive' && isPositive === true) ||
        (feelingTypeFilter === 'negative' && isPositive === false);
      
      if (!shouldShow) {
        setSelectedFeeling(null);
      }
    }
  }, [feelingTypeFilter, feelingsReference, selectedFeeling]);

  // Animate when selectedFeeling changes
  useEffect(() => {
    if (selectedFeeling) {
      // Slide in timeline view
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Slide back to main view
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selectedFeeling]);

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
        // Last 7 days excluding today (7 days ago to yesterday)
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    
    // For single-day filters, set end date to end of that day
    if (timeframe === 'today' || timeframe === 'yesterday' || timeframe === 'dayBeforeYesterday') {
      const startDate = getDateFilter(timeframe);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    
    // For lastWeek, exclude today (end at end of yesterday)
    if (timeframe === 'lastWeek') {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    
    // For other timeframes, include up to now
    return null;
  };

  const filteredData = React.useMemo(() => {
    if (!rawAnalyses || rawAnalyses.length === 0) return [];

    const startDate = getDateFilter(selectedTimeframe);
    const endDate = getEndDate(selectedTimeframe);

    const filteredAnalyses = rawAnalyses.filter((analysis) => {
      if (!analysis.created) return false;
      const analysisDate = new Date(analysis.created);
      const isAfterStart = analysisDate >= startDate;
      const isBeforeEnd = endDate ? analysisDate <= endDate : analysisDate <= new Date();
      return isAfterStart && isBeforeEnd;
    });

    const feelings = filteredAnalyses
      .map((analysis) => analysis.feelings)
      .filter(Boolean);
    const res = feelings.flat();

    const grouped = res.reduce((acc: { [key: string]: string[] }, feeling: string) => {
      if (feeling) { // Ensure feeling is not empty
        (acc[feeling] = acc[feeling] || []).push(feeling);
      }
      return acc;
    }, {});
    let countArray = Object.entries(grouped).map(([value, arr]) => ({
      value,
      count: (arr as string[]).length,
    }));

    // Filter by positive/negative if filter is set
    if (feelingTypeFilter !== 'all' && feelingsReference.size > 0) {
      countArray = countArray.filter((item) => {
        const isPositive = feelingsReference.get(item.value);
        if (feelingTypeFilter === 'positive') {
          return isPositive === true;
        } else if (feelingTypeFilter === 'negative') {
          return isPositive === false;
        }
        return true;
      });
    }

    countArray.sort((a, b) => b.count - a.count);

    return countArray;
  }, [rawAnalyses, selectedTimeframe, feelingTypeFilter, feelingsReference]);

  const displayedData = showMore ? filteredData : filteredData.slice(0, 3);

  // Calculate timeline data for selected feeling - aggregate by day
  const timelineData = React.useMemo(() => {
    if (!selectedFeeling || !rawAnalyses) return [];

    const startDate = getDateFilter(selectedTimeframe);
    const endDate = getEndDate(selectedTimeframe) || new Date();

    // Aggregate data points by day - sum counts for same day
    const dayMap = new Map<string, number>();

    rawAnalyses.forEach((analysis) => {
      if (!analysis.created || !analysis.feelings) return;

      const analysisDate = new Date(analysis.created);
      if (analysisDate < startDate || analysisDate > endDate) return;

      // Count how many times the selected feeling appears in this analysis
      const count = analysis.feelings.filter((f: string) => f === selectedFeeling).length;

      if (count > 0) {
        // Create a date key for the day (YYYY-MM-DD)
        const dayKey = analysisDate.toISOString().split('T')[0];
        // Sum up counts for the same day
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + count);
      }
    });

    // Convert map to array with Date objects (noon of each day for positioning)
    const dataPoints: Array<{ date: Date; count: number }> = [];
    dayMap.forEach((count, dayKey) => {
      const date = new Date(dayKey);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      dataPoints.push({
        date: date,
        count: count, // Aggregated count for the day
      });
    });

    // Sort by date
    return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedFeeling, rawAnalyses, selectedTimeframe]);

  // Filter relevant analyses for the selected feeling
  const relevantAnalyses = React.useMemo(() => {
    if (!selectedFeeling || !rawAnalyses) return [];

    const startDate = getDateFilter(selectedTimeframe);
    const endDate = getEndDate(selectedTimeframe) || new Date();

    return rawAnalyses
      .filter((analysis) => {
        if (!analysis.created || !analysis.feelings) return false;
        
        // Check if analysis contains the selected feeling
        const hasFeeling = analysis.feelings.includes(selectedFeeling);
        if (!hasFeeling) return false;

        // Check if analysis is within timeframe
        const analysisDate = new Date(analysis.created);
        const isAfterStart = analysisDate >= startDate;
        const isBeforeEnd = analysisDate <= endDate;
        
        return isAfterStart && isBeforeEnd;
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()); // Sort newest first
  }, [selectedFeeling, rawAnalyses, selectedTimeframe]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Generate color array for legend to match DonutChart's default colors
  const defaultColors = [
    '#F0BADA', '#DB79AA', '#080638', '#17545A', '#D6BBFF', '#A366FF', '#FF9C34',
  ];
  const legendColors: string[] = [];
  for (let i = 0; i < filteredData.length; i++) {
    const colorIndex = i % defaultColors.length;
    if (i < defaultColors.length) {
      legendColors.push(defaultColors[colorIndex]);
    } else {
      legendColors.push(`${defaultColors[colorIndex]}80`);
    }
  }

  const feelingColor = selectedFeeling
    ? legendColors[filteredData.findIndex(f => f.value === selectedFeeling)] || '#c084fc'
    : '#c084fc';

  // Animated styles
  const mainViewTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400], // Slide main view left
  });

  const timelineViewTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0], // Slide timeline view from right
  });

  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [mainViewHeight || 500, timelineViewHeight || 500],
  });

  // Only apply animated height if we have measured heights
  const shouldAnimateHeight = mainViewHeight > 0 && timelineViewHeight > 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Gefühle</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <FeelingTypeFilter
              value={feelingTypeFilter}
              onChange={setFeelingTypeFilter}
            />
            <DateRangePicker
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Animated.View style={[styles.animatedHeightContainer, shouldAnimateHeight && { height: animatedHeight }]}>
            {/* Main view with donut chart and list */}
            <Animated.View
              style={[
                styles.viewContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: mainViewTranslate }],
                }
              ]}
              pointerEvents={selectedFeeling ? 'none' : 'auto'}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                if (height > 0) {
                  setMainViewHeight(height);
                }
              }}
            >
              <View style={styles.chartContainer}>
                <DonutChart data={filteredData} />
              </View>

              <View style={styles.listContainer}>
                {filteredData.length === 0 ? (
                  <Text style={styles.emptyText}>Keine Gefühle gefunden</Text>
                ) : (
                  <>
                    {displayedData.map((feeling, index) => (
                      <TouchableOpacity
                        key={`${feeling.value}-${index}`}
                        style={[
                          styles.listItem,
                          index === 0 && styles.firstListItem
                        ]}
                        onPress={() => setSelectedFeeling(feeling.value)}
                      >
                        <View style={styles.listItemLeft}>
                          <View
                            style={[styles.colorDot, { backgroundColor: legendColors[filteredData.indexOf(feeling)] }]}
                          />
                          <Text className='text-base'>{feeling.value}</Text>
                        </View>
                        <View className='flex flex-row items-center justify-end gap-4'>
                          <Text style={styles.listItemCount}>{feeling.count}</Text>
                          <View style={[styles.iconContainer, { width: '15%' }]}>
                            <View style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: '#fff',
                              justifyContent: 'center',
                              alignItems: 'center',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                              elevation: 2,
                            }}>
                              <ChevronRight size={12} color="#000" />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}

                    <View style={styles.toggleButtonContainer}>
                      <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setShowMore(!showMore)}
                      >
                        <Text style={{ fontSize: 12, color: '#000' }}>
                          {showMore ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>

            {/* Timeline view */}
            <Animated.View
              style={[
                styles.viewContainer,
                styles.timelineView,
                {
                  opacity: slideAnim,
                  transform: [{ translateX: timelineViewTranslate }],
                }
              ]}
              pointerEvents={selectedFeeling ? 'auto' : 'none'}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                if (height > 0) {
                  setTimelineViewHeight(height);
                }
              }}
            >
              <View className='flex flex-row items-start justify-start px-4 py-2 mb-4'>
                <TouchableOpacity
                  className='flex flex-row items-center gap-0.5 border rounded-full pl-1.5 pr-2 py-0.5'
                  style={{ borderColor: `${baseColors.black}60` }}
                  onPress={() => setSelectedFeeling(null)}
                >
                  <ChevronLeft size={12} color={`${baseColors.black}99`} className='-mb-0.5' />
                  <Text className='text-sm' style={{ color: `${baseColors.black}99` }}>zurück</Text>
                </TouchableOpacity>
              </View>

              <View className="px-4 pb-4">
                <View className='flex flex-row items-center gap-2'>
                  <View style={{ backgroundColor: feelingColor }} className='px-3 py-1 rounded-full mb-2'>
                    <Text className='text-lg font-medium' style={{ color: computedColor(feelingColor) }}>{selectedFeeling}</Text>
                  </View>
                </View>
                <Text className="text-sm font-semibold text-black my-2">
                  Zeitlicher Verlauf
                </Text>
                {timelineData.length === 0 ? (
                  <Text className="text-sm text-gray-400 text-center">Keine Daten verfügbar</Text>
                ) : (
                  <View className="h-[150px] border border-black/5 rounded-lg">
                    {(() => {
                      const startDate = getDateFilter(selectedTimeframe);
                      const endDate = getEndDate(selectedTimeframe) || new Date();
                      const totalTimeRange = endDate.getTime() - startDate.getTime();
                      // Calculate total count (sum of all counts) for y-axis maximum
                      const totalCount = timelineData.reduce((sum, d) => sum + d.count, 0);
                      const yAxisMax = Math.max(totalCount, 1);

                      // Generate date labels scattered across the entire timeframe
                      const generateDateLabels = () => {
                        const labels: Array<{ date: Date; position: number }> = [];
                        const daysDiff = Math.ceil(totalTimeRange / (1000 * 60 * 60 * 24));

                        // Determine interval based on timeframe
                        let intervalDays: number;
                        if (selectedTimeframe === 'lastYear') {
                          intervalDays = 30; // Show label every ~30 days
                        } else if (selectedTimeframe === 'lastMonth') {
                          intervalDays = 5; // Show label every ~5 days
                        } else {
                          intervalDays = 1; // Show label every day for shorter timeframes
                        }

                        // Limit number of labels to avoid overcrowding
                        const maxLabels = 6;
                        const actualInterval = Math.max(1, Math.floor(daysDiff / maxLabels));

                        let currentDate = new Date(startDate);
                        const seen = new Set<string>();

                        while (currentDate <= endDate) {
                          const day = String(currentDate.getDate()).padStart(2, '0');
                          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                          const dateKey = `${day}.${month}`;

                          // Only add if we haven't seen this date yet
                          if (!seen.has(dateKey)) {
                            const position = ((currentDate.getTime() - startDate.getTime()) / totalTimeRange) * 100;
                            labels.push({
                              date: new Date(currentDate),
                              position: position,
                            });
                            seen.add(dateKey);
                          }

                          currentDate.setDate(currentDate.getDate() + actualInterval);
                        }

                        // Always include the end date if it's not already included
                        const endDay = String(endDate.getDate()).padStart(2, '0');
                        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                        const endDateKey = `${endDay}.${endMonth}`;

                        if (!seen.has(endDateKey)) {
                          const endPosition = ((endDate.getTime() - startDate.getTime()) / totalTimeRange) * 100;
                          labels.push({
                            date: new Date(endDate),
                            position: endPosition,
                          });
                        }

                        return labels;
                      };

                      const dateLabels = generateDateLabels();

                      // Generate y-axis labels for count values
                      const generateYAxisLabels = () => {
                        const labels: number[] = [];
                        const steps = 5; // Show 5 labels on y-axis
                        const stepValue = yAxisMax / steps;

                        for (let i = 0; i <= steps; i++) {
                          const value = Math.round(i * stepValue);
                          // Only add if it's unique and not greater than max
                          if (!labels.includes(value) && value <= yAxisMax) {
                            labels.push(value);
                          }
                        }

                        // Ensure max value is always included
                        if (!labels.includes(yAxisMax)) {
                          labels.push(yAxisMax);
                        }

                        return labels.sort((a, b) => a - b);
                      };

                      const yAxisLabels = generateYAxisLabels();

                      return (
                        <View className="flex-1 relative h-[120px] flex-row p-4 mx-5 my-5">
                          {/* Y-axis with count values */}
                          <View className="absolute -left-4 top-0 bottom-0 -my-1 flex flex-col items-end justify-between">
                            {yAxisLabels.reverse().map((value, idx) => {
                              const position = (value / yAxisMax) * 100;
                              // Ensure 0% is slightly above the bottom to avoid clipping
                              const adjustedPosition = value === 0 ? Math.max(0.5, position) : position;
                              return (
                                <View
                                  key={`y-axis-${idx}`}
                                  className="flex flex-row items-center gap-1"
                                >
                                  <Text className="text-[9px] text-gray-500 text-right leading-[12px]">
                                    {value}
                                  </Text>
                                  <View className="w-1 h-0 border-b border-black opacity-20"></View>
                                </View>
                              );
                            })}
                          </View>

                          {/* X-axis with scattered dates across entire range */}
                          <View className="absolute -bottom-5 left-0 right-0 -mx-3 h-5 flex-row justify-between">
                            {dateLabels.map((label, idx) => {
                              const day = String(label.date.getDate()).padStart(2, '0');
                              const month = String(label.date.getMonth() + 1).padStart(2, '0');

                              return (
                                <View
                                  key={`date-${idx}`}
                                  className="flex flex-col items-center gap-1"
                                >
                                  <View className="w-0 h-1 border-r border-black opacity-20"></View>
                                  <Text className="text-[9px] text-gray-500 text-center">
                                    {day}.{month}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>

                          {/* Dots positioned by date */}
                          <View className="absolute top-0 left-0 right-0 bottom-0 -mx-7">
                            {timelineData.map((item, idx) => {
                              // Calculate position based on actual date within the timeframe
                              // This ensures dots align with their actual dates, not evenly-spaced labels
                              const timePosition = ((item.date.getTime() - startDate.getTime()) / totalTimeRange) * 100;

                              // Calculate vertical position based on count (higher count = higher up)
                              const countPercent = yAxisMax > 0 ? (item.count / yAxisMax) * 100 : 0;
                              const bottomPosition = countPercent; // Position from bottom

                              return (
                                <View
                                  key={`dot-${idx}`}
                                  className="absolute w-2 h-3 rounded-full"
                                  style={{
                                    left: `${Math.max(0, Math.min(100, timePosition))}%`,
                                    height: `${bottomPosition}%`,
                                    bottom: 0,
                                    backgroundColor: feelingColor,
                                    transform: [{ translateX: 0 }, { translateY: -2 }],
                                  }}
                                />
                              );
                            })}
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Relevant chats list */}
                {relevantAnalyses.length > 0 && (
                  <View className="mt-6">
                    <Text className="text-sm font-semibold text-black mb-3">Zugehörige Reflektionen</Text>
                    <View className="">
                      {relevantAnalyses.map((analysis, idx) => (
                        <TouchableOpacity
                          key={analysis.id}
                          className={`flex-row items-center justify-between ${idx === relevantAnalyses.length - 1 ? '' : 'border-b border-black/5'}`}
                          style={{
                            backgroundColor: baseColors.offwhite,
                            paddingHorizontal: 0,
                            paddingVertical: 8,
                            gap: 12,
                          }}
                          onPress={() => router.push(`/analysis/${analysis.id}`)}
                        >
                          <View className="flex-1 gap-1">
                            <Text className="text-xs text-black/60">
                              {formatDate(analysis.created)}
                            </Text>
                            <Text className="text-sm text-black mb-0" numberOfLines={1}>
                              {analysis.title || 'Reflektion'}
                            </Text>
                          </View>
                          <View className="size-5 items-center justify-center bg-white rounded-full" style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: '#fff',
                              justifyContent: 'center',
                              alignItems: 'center',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                              elevation: 2,
                            }}>
                            <ChevronRight size={12} color={baseColors.black} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
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
    paddingBottom: 4,
    gap: 12,
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contentContainer: {
    position: 'relative',
  },
  animatedHeightContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  viewContainer: {
    width: '100%',
  },
  timelineView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: baseColors.offwhite,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0, 0.1)',
    marginHorizontal: -8,
  },
  firstListItem: {
    borderTopWidth: 0,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  colorDot: {
    width: 20,
    height: 12,
    borderRadius: 6,
  },
  listItemText: {
    fontSize: 14,
    color: '#000',
  },
  listItemCount: {
    fontSize: 14,
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  toggleButtonContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});
