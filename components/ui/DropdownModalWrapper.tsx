/**
 * Wrapper for dropdowns: trigger in a relative box; when open, dropdown is
 * rendered in a Modal and positioned from the trigger with screen-edge clamping and padding.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, StatusBar, View } from 'react-native';

const GAP = 8;
const SCREEN_PADDING = 28;
const PANEL_MAX_WIDTH = 240;
/** On Android, Modal content can be inset; add this to top so the dropdown appears below the trigger. */
const TOP_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const { width: windowWidth } = Dimensions.get('window');

export type DropdownPosition = 'below' | 'above';

export interface DropdownModalWrapperProps {
  /** Trigger element (e.g. the open button). */
  children: React.ReactNode;
  /** Content to show in the dropdown list when open. */
  dropdownContent: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: DropdownPosition;
}

export default function DropdownModalWrapper({
  children,
  dropdownContent,
  open,
  onOpenChange,
  position = 'below',
}: DropdownModalWrapperProps) {
  const wrapperRef = useRef<View>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const showAbove = position === 'above';
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (open && wrapperRef.current) {
      wrapperRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
      });
    } else {
      setTriggerLayout(null);
      setPanelHeight(0);
    }
  }, [open]);

  useEffect(() => {
    Animated.spring(opacity, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [open, opacity]);

  const panelWidth = Math.min(PANEL_MAX_WIDTH, windowWidth - 2 * SCREEN_PADDING);
  const triggerLayoutReady = triggerLayout !== null;

  const leftClamped = triggerLayoutReady
    ? Math.max(
        SCREEN_PADDING,
        Math.min(
          triggerLayout!.x + triggerLayout!.width / 2 - panelWidth / 2,
          windowWidth - SCREEN_PADDING - panelWidth,
        ),
      )
    : 0;
  const topForBelow = triggerLayoutReady ? triggerLayout!.y + triggerLayout!.height + GAP + TOP_OFFSET : 0;
  const topForAbove = triggerLayoutReady ? triggerLayout!.y - (panelHeight || 200) - GAP - TOP_OFFSET : 0;

  const panelStyle = {
    position: 'absolute' as const,
    left: leftClamped,
    width: panelWidth,
    ...(position === 'below' ? { top: topForBelow } : { top: topForAbove }),
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  };

  return (
    <>
      <View ref={wrapperRef} style={{ position: 'relative', alignSelf: 'flex-start' }} collapsable={false}>
        {children}
      </View>
      {open && (
        <Modal visible transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'transparent' }} onPress={() => onOpenChange(false)}>
            {triggerLayoutReady && (
              <Animated.View
                style={[panelStyle, { opacity }]}
                pointerEvents="box-none"
                onLayout={(e) => setPanelHeight(e.nativeEvent.layout.height)}
              >
                <View
                  style={[
                    {
                      position: 'absolute',
                      left: triggerLayout!.x + triggerLayout!.width / 2 - leftClamped - 8,
                      width: 0,
                      height: 0,
                      borderLeftWidth: 8,
                      borderRightWidth: 8,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                    },
                    showAbove
                      ? { bottom: -8, borderTopWidth: 8, borderTopColor: '#fff' }
                      : { top: -8, borderBottomWidth: 8, borderBottomColor: '#fff' },
                  ]}
                />
                {dropdownContent}
              </Animated.View>
            )}
          </Pressable>
        </Modal>
      )}
    </>
  );
}
