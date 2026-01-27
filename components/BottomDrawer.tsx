/**
 * Global bottom drawer component. Used by Header and other parts of the app
 * (e.g. FeelingsDrawer for the bodymap feelings selector).
 * When tall=true, the handle follows the touch during drag then snaps to initial or expanded.
 * Drag up from initial → expanded. Drag down from expanded → initial.
 * Drag down from initial → close. No sizes smaller than initial or in between.
 */

import baseColors from '@/baseColors.config';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const slideDistance = 300;
const SNAP_THRESHOLD = 40;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** When true, drawer has two snap points (initial/expanded). Drag handle to switch or close from initial. */
  tall?: boolean;
  children: React.ReactNode;
  /** Optional style for the content area (body) */
  contentStyle?: StyleProp<ViewStyle>;
  /** When tall, use this as initial height (e.g. from ScrollView onContentSizeChange + chrome). Overrides internal measure. */
  initialHeight?: number;
}

type TallSnap = 'initial' | 'expanded';

export default function BottomDrawer({
  visible,
  onClose,
  title,
  subtitle,
  tall = false,
  children,
  contentStyle,
  initialHeight: initialHeightProp,
}: BottomDrawerProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [contentBasedHeight, setContentBasedHeight] = useState<number | null>(null);

  const expandedHeight =
    windowHeight > 0 ? Math.min(windowHeight - 24, Math.round(windowHeight * 0.92)) : 600;
  const fallbackInitial = windowHeight > 0 ? Math.round(windowHeight * 0.75) : 400;
  const initialHeight =
    tall && (initialHeightProp ?? (contentBasedHeight != null && contentBasedHeight >= 80 ? contentBasedHeight : null)) != null
      ? Math.min(initialHeightProp ?? contentBasedHeight!, expandedHeight)
      : fallbackInitial;

  const heightsRef = useRef({ initial: initialHeight, expanded: expandedHeight });
  heightsRef.current = { initial: initialHeight, expanded: expandedHeight };

  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setContentBasedHeight((prev) => (prev == null ? h : Math.max(prev, h)));
  }, []);

  const slideAnim = useRef(new Animated.Value(slideDistance)).current;
  const heightAnim = useRef(new Animated.Value(initialHeight)).current;
  const [snap, setSnap] = useState<TallSnap>('initial');
  const snapRef = useRef<TallSnap>('initial');
  snapRef.current = snap;
  const lastHeightRef = useRef(initialHeight);
  const dragStartHeightRef = useRef(initialHeight);
  const dragStartSnapRef = useRef<TallSnap>('initial');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartSnapRef.current = snapRef.current;
          dragStartHeightRef.current = lastHeightRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          const { initial, expanded } = heightsRef.current;
          const newH = clamp(
            dragStartHeightRef.current - gestureState.dy,
            initial,
            expanded
          );
          heightAnim.setValue(newH);
          lastHeightRef.current = newH;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { initial, expanded } = heightsRef.current;
          const dy = gestureState.dy;
          const start = dragStartSnapRef.current;
          let targetHeight: number;
          let nextSnap: TallSnap;
          if (start === 'initial') {
            if (dy > SNAP_THRESHOLD) {
              onCloseRef.current();
              return;
            }
            if (dy < -SNAP_THRESHOLD) {
              targetHeight = expanded;
              nextSnap = 'expanded';
            } else {
              targetHeight = initial;
              nextSnap = 'initial';
            }
          } else {
            if (dy > SNAP_THRESHOLD) {
              targetHeight = initial;
              nextSnap = 'initial';
            } else {
              targetHeight = expanded;
              nextSnap = 'expanded';
            }
          }
          Animated.spring(heightAnim, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 65,
            friction: 11,
          }).start(() => {
            setSnap(nextSnap);
            lastHeightRef.current = targetHeight;
          });
        },
      }),
    []
  );

  const isMeasuring = tall && visible && contentBasedHeight == null && initialHeightProp == null;

  useEffect(() => {
    if (!visible) {
      setContentBasedHeight(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setSnap('initial');
      const h = heightsRef.current.initial;
      heightAnim.setValue(h);
      lastHeightRef.current = h;
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: slideDistance,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible, slideAnim, heightAnim]);

  useLayoutEffect(() => {
    if (!visible || !tall || contentBasedHeight == null) return;
    const h = heightsRef.current.initial;
    heightAnim.setValue(h);
    lastHeightRef.current = h;
  }, [visible, tall, contentBasedHeight, initialHeight, heightAnim]);

  const drawerContentHeightStyle = tall && !isMeasuring ? { height: heightAnim } : undefined;
  const drawerOnLayout = tall && isMeasuring ? handleContentLayout : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawerContent,
            tall ? [{ maxHeight: expandedHeight }, drawerContentHeightStyle] : null,
            { transform: [{ translateY: slideAnim }] },
          ]}
          onLayout={drawerOnLayout}
          onStartShouldSetResponder={() => true}
        >
          <View
            style={styles.drawerHandle}
            {...(tall ? panResponder.panHandlers : {})}
          />
          {(title != null || subtitle != null) && (
            <View style={styles.drawerHeader}>
              {title != null && <Text style={styles.drawerTitle}>{title}</Text>}
              {subtitle != null && (
                <Text style={styles.drawerSubtitle}>{subtitle}</Text>
              )}
            </View>
          )}
          <View
            style={[
              styles.drawerBody,
              tall && !isMeasuring && styles.drawerBodyTall,
              contentStyle,
            ]}
          >
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: baseColors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 32,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: baseColors.black + '33',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginLeft: 8,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  drawerBody: {
    paddingHorizontal: 16,
    gap: 8,
  },
  drawerBodyTall: {
    flex: 1,
    minHeight: 0,
  },
});
