import baseColors from '@/baseColors.config';
import { getNeedTimeseries, NeedTimeseriesData, saveNeedFillLevel } from '@/lib/api/stats';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NeedCupProps {
  trackedNeed: {
    id: string;
    needId: string;
    needName: string;
  };
  currentFillLevel?: number;
  onFillLevelChange?: (fillLevel: number) => void;
  isEditMode?: boolean;
  lastUpdated?: string | null;
  opacity?: number; // For showing yesterday's values with reduced opacity
  lastFillLevel?: number; // Previous fill level to show behind current with 50% opacity
}

export default function NeedCup({ trackedNeed, currentFillLevel = 0, onFillLevelChange, isEditMode = false, lastUpdated, opacity = 1, lastFillLevel }: NeedCupProps) {
  const [fillLevel, setFillLevel] = useState(currentFillLevel);
  const [showTimeseries, setShowTimeseries] = useState(false);
  const [timeseriesData, setTimeseriesData] = useState<NeedTimeseriesData[]>([]);
  const [isLoadingTimeseries, setIsLoadingTimeseries] = useState(false);
  const cupRef = useRef<View>(null);

  // Sync with prop changes
  React.useEffect(() => {
    console.log('NeedCup - currentFillLevel prop changed:', currentFillLevel);
    setFillLevel(currentFillLevel);
  }, [currentFillLevel]);
  
  // Debug: Log fillLevel changes
  React.useEffect(() => {
    console.log('NeedCup - fillLevel state changed:', fillLevel);
  }, [fillLevel]);

  const cupHeight = 120;

  // Calculate fill level from Y position (0 = bottom, cupHeight = top)
  const calculateFillLevelFromY = useCallback((y: number): number => {
    // Invert: bottom of cup (cupHeight) = 0%, top (0) = 100%
    const percentage = Math.max(0, Math.min(100, ((cupHeight - y) / cupHeight) * 100));
    // Round to nearest 5% for easier selection
    return Math.round(percentage / 5) * 5;
  }, [cupHeight]);

  const handleFillLevelSet = useCallback(async (level: number) => {
    const clampedLevel = Math.max(0, Math.min(100, level));
    console.log('Setting fill level to:', clampedLevel);
    
    // Update local state immediately for responsive UI
    setFillLevel(clampedLevel);
    onFillLevelChange?.(clampedLevel);
    
    // Save to API in background (don't revert on error - keep the user's choice)
    try {
      await saveNeedFillLevel(trackedNeed.id, clampedLevel);
      console.log('Fill level saved successfully');
    } catch (error) {
      console.error('Error saving fill level:', error);
      // Don't revert - keep the user's selection even if save fails
    }
  }, [trackedNeed.id, onFillLevelChange]);

  const handleCupPress = (event: any) => {
    if (isEditMode) {
      // In edit mode, set fill level based on touch position relative to cup
      let touchY: number | null = null;
      
      // Try locationY first (works on native)
      if (event.nativeEvent?.locationY !== undefined) {
        touchY = event.nativeEvent.locationY;
      } 
      // On web, use measureInWindow to get absolute coordinates
      else if (Platform.OS === 'web' && cupRef.current) {
        cupRef.current.measureInWindow((x, y, width, height) => {
          const pageY = event.nativeEvent?.pageY || (event as any)?.clientY;
          if (pageY !== undefined) {
            const relativeY = pageY - y;
            const clampedY = Math.max(0, Math.min(cupHeight, relativeY));
            const newLevel = calculateFillLevelFromY(clampedY);
            console.log('Cup press (web) - pageY:', pageY, 'cupY:', y, 'relativeY:', relativeY, 'clampedY:', clampedY, 'newLevel:', newLevel);
            handleFillLevelSet(newLevel);
          } else {
            console.error('Could not get pageY from event:', event.nativeEvent);
            handleFillLevelSet(50);
          }
        });
        return; // Early return since measureInWindow is async
      }
      
      if (touchY === null || touchY === undefined || isNaN(touchY)) {
        console.error('Could not get touch Y position. Event:', event.nativeEvent);
        // Fallback: set to middle
        handleFillLevelSet(50);
        return;
      }
      
      // Clamp Y to cup bounds (0 to cupHeight)
      const clampedY = Math.max(0, Math.min(cupHeight, touchY));
      const newLevel = calculateFillLevelFromY(clampedY);
      console.log('Cup press - touchY:', touchY, 'clampedY:', clampedY, 'newLevel:', newLevel);
      handleFillLevelSet(newLevel);
    } else {
      // Normal mode: show timeseries
      setShowTimeseries(true);
      loadTimeseries();
    }
  };

  const loadTimeseries = async () => {
    setIsLoadingTimeseries(true);
    try {
      const data = await getNeedTimeseries(trackedNeed.id);
      setTimeseriesData(data);
    } catch (error) {
      console.error('Error loading timeseries:', error);
      setTimeseriesData([]);
    } finally {
      setIsLoadingTimeseries(false);
    }
  };

  const fillPercentage = Math.max(0, Math.min(100, fillLevel));
  const fillHeight = fillPercentage > 0 ? Math.max(2, (cupHeight * fillPercentage) / 100) : 0; // Minimum 2px if there's any fill
  
  // Calculate last fill level display
  const lastFillPercentage = lastFillLevel !== undefined ? Math.max(0, Math.min(100, lastFillLevel)) : 0;
  const lastFillHeight = lastFillPercentage > 0 ? Math.max(2, (cupHeight * lastFillPercentage) / 100) : 0;

  // Helper function to get text color based on background color brightness
  const getTextColorForFill = (percentage: number): string => {
    // Determine which color is being used
    const fillColor = percentage > 50 
      ? baseColors.forest 
      : percentage > 25 
      ? baseColors.orange 
      : baseColors.bullshift;
    
    // Convert hex to RGB
    const hex = fillColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate relative luminance (perceived brightness)
    // Using the formula from WCAG: https://www.w3.org/WAI/GL/wiki/Relative_luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If luminance is less than 0.5, use white text, otherwise use black
    return luminance < 0.5 ? '#fff' : '#000';
  };

  const currentFillColor = fillPercentage > 0 
    ? (fillPercentage > 50 
        ? baseColors.forest 
        : fillPercentage > 25 
        ? baseColors.orange 
        : baseColors.bullshift)
    : null;
  
  const lastFillColor = lastFillPercentage > 0
    ? (lastFillPercentage > 50 
        ? baseColors.forest 
        : lastFillPercentage > 25 
        ? baseColors.orange 
        : baseColors.bullshift)
    : null;
  
  // In edit mode, use black text since there's no filled background (only borders)
  // In normal mode, calculate based on fill color brightness
  const currentTextColor = isEditMode 
    ? '#000' 
    : (currentFillColor ? getTextColorForFill(fillPercentage) : '#000');
  const lastTextColor = isEditMode 
    ? '#000' 
    : (lastFillColor ? getTextColorForFill(lastFillPercentage) : '#000');
  
  // Debug logging
  React.useEffect(() => {
    console.log('Fill state - fillLevel:', fillLevel, 'fillPercentage:', fillPercentage, 'fillHeight:', fillHeight, 'will render fill:', fillPercentage > 0);
  }, [fillLevel, fillPercentage, fillHeight]);

  const formatLastUpdated = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Gerade aktualisiert';
      } else if (diffMins < 60) {
        return `Vor ${diffMins} Min.`;
      } else if (diffHours < 24) {
        return `Vor ${diffHours} Std.`;
      } else if (diffDays === 1) {
        return 'Gestern';
      } else if (diffDays < 7) {
        return `Vor ${diffDays} Tagen`;
      } else {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      return '';
    }
  };

  return (
    <>
      <View style={[styles.cupContainer, { opacity }]}>
        <View style={styles.cupWrapper}>
          {/* Cup outline */}
          <TouchableOpacity
            onPress={handleCupPress}
            activeOpacity={0.7}
            style={{ width: 80, height: 120 }}
          >
            <View 
              ref={cupRef}
              style={[
                styles.cup,
                isEditMode && styles.cupEditMode,
              ]}
            >
              {isEditMode ? (
                <>
                  {/* In edit mode: show fill as border only */}
                  {fillPercentage > 0 && fillHeight > 0 && (
                    <View
                      style={[
                        styles.currentFillBorder,
                        {
                          bottom: fillHeight,
                          borderColor: fillPercentage > 50 
                            ? baseColors.forest 
                            : fillPercentage > 25 
                            ? baseColors.orange 
                            : baseColors.bullshift,
                        },
                      ]}
                    />
                  )}
                  {/* Last fill level - shown as a border at the top */}
                  {lastFillPercentage > 0 && lastFillHeight > 0 && (
                    <>
                      <View
                        style={[
                          styles.lastFillBorder,
                          {
                            bottom: lastFillHeight,
                            borderColor: lastFillPercentage > 50 
                              ? baseColors.forest 
                              : lastFillPercentage > 25 
                              ? baseColors.orange 
                              : baseColors.bullshift,
                          },
                        ]}
                      />
                      {/* Small percentage text for old fill level - below the line, to the left */}
                      <View
                        style={[
                          styles.lastFillTextContainer,
                          {
                            bottom: lastFillHeight - 10,
                          },
                        ]}
                      >
                        <Text style={[styles.lastFillText, { color: lastTextColor }]}>
                          {Math.round(lastFillPercentage)}%
                        </Text>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Normal mode: show filled area */}
                  {fillPercentage > 0 && fillHeight > 0 && (
                    <View
                      style={[
                        styles.cupFill,
                        {
                          height: fillHeight,
                          backgroundColor: fillPercentage > 50 
                            ? baseColors.forest 
                            : fillPercentage > 25 
                            ? baseColors.orange 
                            : baseColors.bullshift,
                        },
                      ]}
                    />
                  )}
                  {/* Last fill level - shown as a border at the top */}
                  {lastFillPercentage > 0 && lastFillHeight > 0 && (
                    <>
                      <View
                        style={[
                          styles.lastFillBorder,
                          {
                            bottom: lastFillHeight,
                            borderColor: lastFillPercentage > 50 
                              ? baseColors.forest 
                              : lastFillPercentage > 25 
                              ? baseColors.orange 
                              : baseColors.bullshift,
                          },
                        ]}
                      />
                      {/* Small percentage text for old fill level - below the line, to the left */}
                      <View
                        style={[
                          styles.lastFillTextContainer,
                          {
                            bottom: lastFillHeight - 10,
                          },
                        ]}
                      >
                        <Text style={[styles.lastFillText, { color: lastTextColor }]}>
                          {Math.round(lastFillPercentage)}%
                        </Text>
                      </View>
                    </>
                  )}
                  {/* Current fill level text - big, in the middle (only in normal mode) */}
                  {fillPercentage > 0 && (
                    <View style={styles.fillTextContainer}>
                      <Text style={[styles.fillText, { color: currentTextColor }]}>
                        {Math.round(fillPercentage)}%
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
          {/* Need name */}
          <Text style={styles.needName} numberOfLines={2}>
            {trackedNeed.needName}
          </Text>
          {isEditMode && (
            <Text style={styles.editHint}>Tippen zum Setzen</Text>
          )}
          {lastUpdated && (
            <Text style={styles.lastUpdatedText}>
              {formatLastUpdated(lastUpdated)}
            </Text>
          )}
        </View>
      </View>

      {/* Timeseries Modal */}
      <Modal
        visible={showTimeseries}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeseries(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{trackedNeed.needName}</Text>
              <TouchableOpacity
                onPress={() => setShowTimeseries(false)}
                style={styles.closeIcon}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingTimeseries ? (
              <Text style={styles.loadingText}>Lade Daten...</Text>
            ) : timeseriesData.length === 0 ? (
              <Text style={styles.emptyText}>Noch keine Daten vorhanden</Text>
            ) : (
              <View style={styles.timeseriesContainer}>
                {/* Simple line chart visualization */}
                <View style={styles.chartContainer}>
                  {timeseriesData.map((item, idx) => {
                    const maxFill = Math.max(...timeseriesData.map(d => d.fillLevel), 100);
                    const heightPercent = (item.fillLevel / maxFill) * 100;
                    const widthPercent = (1 / timeseriesData.length) * 100;
                    
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.chartBar,
                          {
                            width: `${widthPercent}%`,
                            height: `${heightPercent}%`,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.chartLabels}>
                  {timeseriesData.map((item, idx) => {
                    if (idx % Math.ceil(timeseriesData.length / 5) === 0 || idx === timeseriesData.length - 1) {
                      return (
                        <Text key={idx} style={styles.chartLabel}>
                          {item.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </Text>
                      );
                    }
                    return null;
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupEditMode: {
    borderColor: '#86efac',
    borderWidth: 4,
  },
  cupWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  cup: {
    width: 80,
    height: 120,
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden', // Keep hidden to clip fill to cup shape
    position: 'relative',
    backgroundColor: 'transparent',
  },
  cupFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    minHeight: 1, // Ensure it's always visible if fillPercentage > 0
  },
  lastFillBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    height: 0,
  },
  currentFillBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    height: 0,
  },
  lastFillTextContainer: {
    position: 'absolute',
    left: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  lastFillText: {
    fontSize: 8,
    fontWeight: '500',
    // Color is set dynamically based on background
  },
  fillTextContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Above everything
  },
  fillText: {
    fontSize: 16,
    fontWeight: '700',
    // Color is set dynamically based on background
  },
  needName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    maxWidth: 100,
  },
  editHint: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  lastUpdatedText: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: baseColors.offwhite,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 18,
    color: '#000',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  timeseriesContainer: {
    marginTop: 16,
  },
  chartContainer: {
    height: 200,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  chartBar: {
    backgroundColor: '#86efac',
    borderRadius: 2,
    minHeight: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
  },
});

