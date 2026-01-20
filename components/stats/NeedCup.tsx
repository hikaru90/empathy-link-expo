import baseColors from '@/baseColors.config';
import { getContrastRatio, getTextColorForBackground } from '@/lib/utils/color-contrast';
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
  color?: string; // Color for the cup fill (from line chart colors)
}

export default function NeedCup({ trackedNeed, currentFillLevel = null, onFillLevelChange, onReplaceNeed, onCupPress, isEditMode = false, isSelected = false, lastUpdated, opacity = 1, lastFillLevel, color }: NeedCupProps) {
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
  const getTextColorForFill = (fillColor: string, fontSize: number, fontWeight: number): string => {
    // Use WCAG-compliant contrast utility
    return getTextColorForBackground(fillColor, fontSize, fontWeight);
  };

  // Use provided color from line chart, or fall back to fill-level-based colors if no color provided
  const currentFillColor = fillPercentage > 0 
    ? (color || (fillPercentage > 50 
        ? baseColors.forest 
        : fillPercentage > 25 
        ? baseColors.orange 
        : baseColors.bullshift))
    : null;
  
  // For last fill color, use the same color as current if provided, otherwise use fill-level-based
  const lastFillColor = lastFillPercentage > 0
    ? (color || (lastFillPercentage > 50 
        ? baseColors.forest 
        : lastFillPercentage > 25 
        ? baseColors.orange 
        : baseColors.bullshift))
    : null;
  
  // Helper to check if a color is dark (low luminance)
  const isDarkColor = (hexColor: string): boolean => {
    const cleanHex = hexColor.replace('#', '');
    const fullHex = cleanHex.length === 3
      ? cleanHex.split('').map(char => char + char).join('')
      : cleanHex;
    
    if (fullHex.length !== 6) return false;
    
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
    
    // Calculate relative luminance
    const normalize = (val: number) => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    
    const luminance = 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
    
    // Consider dark if luminance is below 0.5
    return luminance < 0.5;
  };

  // Calculate text color based on fill color with WCAG AA compliance
  // Large text (16px, bold 700) needs 3:1 contrast
  // If fill is below 40% AND fill color is dark AND text is initially white, invert to black
  const currentTextColor = (() => {
    if (!currentFillColor) return '#000';
    
    // Calculate contrast for both white and black text against the fill color
    const whiteContrast = getContrastRatio('#ffffff', currentFillColor);
    const blackContrast = getContrastRatio('#000000', currentFillColor);
    
    // Minimum contrast for large bold text (16px, 700) is 3:1
    const minContrast = 3.0;
    
    // Determine the best color based on contrast
    let bestColor: string;
    if (whiteContrast >= minContrast && blackContrast >= minContrast) {
      // Both meet minimum - choose the one with better contrast
      bestColor = whiteContrast > blackContrast ? '#ffffff' : '#000000';
    } else if (whiteContrast >= minContrast) {
      bestColor = '#ffffff';
    } else if (blackContrast >= minContrast) {
      bestColor = '#000000';
    } else {
      // Neither meets minimum - choose the one with better contrast anyway
      bestColor = whiteContrast > blackContrast ? '#ffffff' : '#000000';
    }
    
    // Only invert if: fill < 40% AND fill color is dark AND initial color is white
    if (fillPercentage < 40 && isDarkColor(currentFillColor) && bestColor === '#ffffff') {
      return '#000000';
    }
    
    return bestColor;
  })();

  // For lastTextColor: if current fill is below the last fill line, the text sits on current fill background
  // Otherwise it sits on transparent/white background
  const lastTextColor = (() => {
    if (fillPercentage >= lastFillPercentage && currentFillColor) {
      // Current fill is at or above last fill line, so text is on current fill color
      return getTextColorForFill(currentFillColor, 8, 500);
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
      const contrastColor = getTextColorForFill(currentFillColor, 8, 500);
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
            <View
              ref={cupRef}
              className={`w-full h-full bg-white/40 border border-white rounded-t-[16px] rounded-b-[50px] overflow-hidden relative`}
            >
              {/* Current fill - show filled area in both modes */}
              {fillPercentage > 0 && fillHeight > 0 && currentFillColor && (
                <View
                  className="absolute bottom-0 left-0 right-0 min-h-[1px]"
                  style={{
                    height: fillHeight,
                    backgroundColor: currentFillColor,
                  }}
                />
              )}
              {/* Current fill level text - big, in the middle (show in both modes) */}
              {fillPercentage > 0 && (
                <View className="absolute top-[50%] left-0 right-0 items-center justify-center z-10">
                  <Text className="text-base font-bold" style={{ color: currentTextColor,  }}>
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

