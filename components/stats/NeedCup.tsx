import baseColors from '@/baseColors.config';
import { getTextColorForBackground } from '@/lib/utils/color-contrast';
import React, { useCallback, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface NeedCupProps {
  trackedNeed: {
    id: string;
    needId: string;
    needName: string;
  };
  currentFillLevel?: number | null;
  onFillLevelChange?: (fillLevel: number) => void;
  onReplaceNeed?: () => void;
  onCupPress?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  lastUpdated?: string | null;
  opacity?: number; // For showing yesterday's values with reduced opacity
  lastFillLevel?: number; // Previous fill level to show behind current with 50% opacity
}

export default function NeedCup({ trackedNeed, currentFillLevel = null, onFillLevelChange, onReplaceNeed, onCupPress, isEditMode = false, isSelected = false, lastUpdated, opacity = 1, lastFillLevel }: NeedCupProps) {
  const [fillLevel, setFillLevel] = useState<number | null>(currentFillLevel ?? null);
  const [hasSetValueInEditMode, setHasSetValueInEditMode] = useState(false);
  const cupRef = useRef<View>(null);

  // Sync with prop changes
  React.useEffect(() => {
    console.log('NeedCup - currentFillLevel prop changed:', currentFillLevel);
    setFillLevel(currentFillLevel ?? null);
  }, [currentFillLevel]);

  // Reset hasSetValueInEditMode when entering/exiting edit mode
  React.useEffect(() => {
    if (!isEditMode) {
      setHasSetValueInEditMode(false);
    }
  }, [isEditMode]);
  
  // Debug: Log fillLevel changes
  React.useEffect(() => {
    console.log('NeedCup - fillLevel state changed:', fillLevel);
  }, [fillLevel]);

  const cupHeight = 100;

  // Calculate fill level from Y position (0 = bottom, cupHeight = top)
  const calculateFillLevelFromY = useCallback((y: number): number => {
    // Invert: bottom of cup (cupHeight) = 0%, top (0) = 100%
    const percentage = Math.max(0, Math.min(100, ((cupHeight - y) / cupHeight) * 100));
    // Round to nearest 5% for easier selection
    return Math.round(percentage / 5) * 5;
  }, [cupHeight]);

  const handleFillLevelSet = useCallback((level: number) => {
    const clampedLevel = Math.max(0, Math.min(100, level));
    console.log('Setting fill level to:', clampedLevel);

    // Treat 0 as null (empty state)
    // Update local state immediately for responsive UI
    const normalizedLevel = clampedLevel === 0 ? null : clampedLevel;
    setFillLevel(normalizedLevel);
    setHasSetValueInEditMode(true);
    // Pass the numeric value (0 if null) to parent for validation
    onFillLevelChange?.(clampedLevel);

    // Don't save to API here - will be saved when exiting edit mode
  }, [onFillLevelChange]);

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
      // Normal mode: notify parent to show timeseries
      onCupPress?.();
    }
  };

  // In edit mode, show current fill as null until user sets a new value
  const displayFillLevel = isEditMode && !hasSetValueInEditMode ? null : fillLevel;
  const fillPercentage = displayFillLevel === null || displayFillLevel === undefined ? 0 : Math.max(0, Math.min(100, displayFillLevel));
  const fillHeight = fillPercentage > 0 ? Math.max(2, (cupHeight * fillPercentage) / 100) : 0; // Minimum 2px if there's any fill
  
  // Calculate last fill level display
  const lastFillPercentage = lastFillLevel !== undefined ? Math.max(0, Math.min(100, lastFillLevel)) : 0;
  const lastFillHeight = lastFillPercentage > 0 ? Math.max(2, (cupHeight * lastFillPercentage) / 100) : 0;

  // Helper function to get text color based on background color with WCAG AA compliance
  const getTextColorForFill = (percentage: number, fontSize: number, fontWeight: number): string => {
    // Determine which color is being used
    const fillColor = percentage > 50 
      ? baseColors.forest 
      : percentage > 25 
      ? baseColors.orange 
      : baseColors.bullshift;
    
    // Use WCAG-compliant contrast utility
    return getTextColorForBackground(fillColor, fontSize, fontWeight);
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
  
  // Calculate text color based on fill color with WCAG AA compliance
  // Large text (16px, bold 700) needs 3:1 contrast, small text (8px, medium 500) needs 4.5:1
  const currentTextColor = currentFillColor
    ? getTextColorForFill(fillPercentage, 16, 700) // fontSize: 16, fontWeight: 700
    : '#000';

  // For lastTextColor: if current fill is below the last fill line, the text sits on current fill background
  // Otherwise it sits on transparent/white background
  const lastTextColor = (() => {
    if (fillPercentage >= lastFillPercentage && currentFillColor) {
      // Current fill is at or above last fill line, so text is on current fill color
      return getTextColorForFill(fillPercentage, 8, 500);
    } else if (lastFillColor) {
      // Current fill is below, text is on transparent background
      // Use the last fill color for the text to maintain color coding
      return lastFillColor;
    }
    return '#000';
  })();

  // For lastFillBorderColor: determine if border should be black/20 or white/20 based on background
  const lastFillBorderColor = (() => {
    if (fillPercentage >= lastFillPercentage && currentFillColor) {
      // Border is on top of current fill, use contrast color
      const contrastColor = getTextColorForBackground(currentFillColor, 8, 500);
      return contrastColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    } else {
      // Border is on transparent/white background
      return 'rgba(0, 0, 0, 0.2)';
    }
  })();
  
  // Debug logging
  React.useEffect(() => {
    console.log('Fill state - fillLevel:', fillLevel, 'fillPercentage:', fillPercentage, 'fillHeight:', fillHeight, 'will render fill:', fillPercentage > 0);
  }, [fillLevel, fillPercentage, fillHeight]);

  return (
    <>
      <View className="items-center justify-center" style={{ opacity }}>
        <View className="items-center gap-2">
          {/* Cup outline */}
          <TouchableOpacity
            onPress={handleCupPress}
            activeOpacity={0.7}
            className={`w-20 relative`}
            style={{ height: cupHeight }}
          >
            <View className="w-10 h-2 bg-black rounded absolute bottom-0 left-1/2 -translate-x-1/2"></View>
            <View
              ref={cupRef}
              className={`w-full h-full border-b-[8px] border-l-2 border-r-2 border-black rounded-b-[50px] overflow-hidden relative bg-transparent`}
            >
              {/* Current fill - show filled area in both modes */}
              {fillPercentage > 0 && fillHeight > 0 && (
                <View
                  className="absolute bottom-0 left-0 right-0 min-h-[1px]"
                  style={{
                    height: fillHeight,
                    backgroundColor: fillPercentage > 50
                      ? baseColors.forest
                      : fillPercentage > 25
                      ? baseColors.orange
                      : baseColors.bullshift,
                  }}
                />
              )}
              {/* Last fill level - shown as a border at the top */}
              {lastFillPercentage > 0 && lastFillHeight > 0 && (
                <>
                  <View
                    className="absolute left-0 right-0 border-t h-0"
                    style={{
                      bottom: lastFillHeight,
                      borderColor: lastFillBorderColor,
                    }}
                  />
                  {/* Small percentage text for old fill level - below the line, to the left */}
                  <View
                    className="absolute left-1 items-start justify-center"
                    style={{
                      bottom: lastFillHeight - 10,
                    }}
                  >
                    <Text className="text-[8px] font-medium" style={{ color: lastTextColor }}>
                      {Math.round(lastFillPercentage)}%
                    </Text>
                  </View>
                </>
              )}
              {/* Current fill level text - big, in the middle (show in both modes) */}
              {fillPercentage > 0 && (
                <View className="absolute top-[50%] left-0 right-0 items-center justify-center z-10">
                  <Text className="text-base font-bold" style={{ color: currentTextColor }}>
                    {Math.round(fillPercentage)}%
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          {/* Need name */}
          <Text className="text-xs font-medium text-black text-center max-w-full" numberOfLines={2}>
            {trackedNeed.needName}
          </Text>
        </View>
      </View>
    </>
  );
}

