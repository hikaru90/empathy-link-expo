/**
 * LearnBodyMap component for React Native Expo
 * Port of ../empathy-link LearnBodyMap.svelte – bodyscan map to place points and assign feelings
 */

import LearnNavigation from '@/components/learn/LearnNavigation';
import { useFeelingsDrawer } from '@/hooks/use-feelings-drawer';
import { getFeelings, type Feeling } from '@/lib/api/chat';
import type { LearningSession } from '@/lib/api/learn';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// PNG export of assets/images/character.svg – use Image so it works on web and native without SVG transformer
const characterImage = require('@/assets/images/illustration-character.png');

const MAP_WIDTH = 192;
const POINT_HIT_RADIUS = 18;

interface BodymapPoint {
  id: number;
  x: number;
  y: number;
  feelings: string[]; // feeling ids
}

interface LearnBodyMapProps {
  content: { type: 'bodymap' };
  color: string;
  session: LearningSession | null;
  contentBlock: any;
  topicVersionId?: string;
  currentStep?: number;
  totalSteps?: Array<{ component: string; internalStep: number }>;
  onResponse: (response: { points: Array<{ x: number; y: number; feelings: string[] }> }) => void;
  gotoNextStep?: () => void;
  gotoPrevStep?: () => void;
  onParentNavigationVisibilityChange?: (visible: boolean) => void;
}

export default function LearnBodyMap({
  content,
  color,
  session,
  contentBlock,
  currentStep = 0,
  totalSteps = [],
  onResponse,
  gotoNextStep,
  gotoPrevStep,
  onParentNavigationVisibilityChange,
}: LearnBodyMapProps) {
  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

  useLayoutEffect(() => {
    onParentNavigationVisibilityChange?.(false);
  }, [internalStep, onParentNavigationVisibilityChange]);

  const { openDrawer: openFeelingsDrawer, closeDrawer: closeFeelingsDrawer } = useFeelingsDrawer();
  const [points, setPoints] = useState<BodymapPoint[]>([]);
  const [showFeelings, setShowFeelings] = useState(false);
  const [activePointId, setActivePointId] = useState<number | null>(null);
  const [feelings, setFeelings] = useState<Feeling[]>([]);
  const [feelingsLoading, setFeelingsLoading] = useState(true);
  const [nextPointId, setNextPointId] = useState(0);
  const mapHeight = MAP_WIDTH * (638 / 365);
  const mapLayout = useRef({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_WIDTH * (638 / 365) });
  const pointsRef = useRef<BodymapPoint[]>(points);
  const activePointIdRef = useRef<number | null>(null);
  const dragStartPointPosRef = useRef({ x: 0, y: 0 });
  const nextPointIdRef = useRef(0);
  const hasEmitted = useRef(false);

  pointsRef.current = points;
  nextPointIdRef.current = nextPointId;
  activePointIdRef.current = activePointId;

  // Debounce onResponse so we don't hammer the API on every drag move (save ~400ms after last change)
  useEffect(() => {
    if (!hasEmitted.current) {
      hasEmitted.current = true;
      return;
    }
    const payload = { points: points.map((p) => ({ x: p.x, y: p.y, feelings: p.feelings })) };
    const t = setTimeout(() => {
      onResponse(payload);
    }, 400);
    return () => clearTimeout(t);
  }, [points, onResponse]);

  // Load feelings
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFeelingsLoading(true);
      try {
        const data = await getFeelings();
        if (!cancelled) setFeelings(data);
      } catch {
        if (!cancelled) setFeelings([]);
      } finally {
        if (!cancelled) setFeelingsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Restore from session
  useEffect(() => {
    if (!contentBlock || !session?.responses) return;
    const existing = session.responses.find(
      (r: any) =>
        r.blockType === 'bodymap' && JSON.stringify(r.blockContent) === JSON.stringify(contentBlock)
    );
    if (existing?.response?.points?.length) {
      const restored = existing.response.points.map((p: any, i: number) => ({
        id: i,
        x: p.x,
        y: p.y,
        feelings: p.feelings || [],
      }));
      setPoints(restored);
      setNextPointId(restored.length);
    }
  }, [contentBlock, session?.responses]);

  const constrain = useCallback((x: number, y: number) => {
    const w = mapLayout.current.width || MAP_WIDTH;
    const h = mapLayout.current.height || MAP_WIDTH * (638 / 365);
    return {
      x: Math.max(0, Math.min(x, w)),
      y: Math.max(0, Math.min(y, h)),
    };
  }, []);

  const hitTestPoint = useCallback((x: number, y: number, pts: BodymapPoint[]): number | null => {
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      const dx = x - p.x;
      const dy = y - p.y;
      if (dx * dx + dy * dy <= POINT_HIT_RADIUS * POINT_HIT_RADIUS) return p.id;
    }
    return null;
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touch = evt.nativeEvent.touches?.[0];
          if (!touch) return;
          const x = touch.locationX ?? 0;
          const y = touch.locationY ?? 0;
          const { x: cx, y: cy } = constrain(x, y);
          const pts = pointsRef.current;
          const hit = hitTestPoint(cx, cy, pts);
          if (hit !== null) {
            const pt = pts.find((p) => p.id === hit);
            if (pt) {
              dragStartPointPosRef.current = { x: pt.x, y: pt.y };
              activePointIdRef.current = hit;
              setActivePointId(hit);
            }
            return;
          }
          const nid = nextPointIdRef.current;
          const newPoint: BodymapPoint = { id: nid, x: cx, y: cy, feelings: [] };
          dragStartPointPosRef.current = { x: cx, y: cy };
          activePointIdRef.current = nid;
          nextPointIdRef.current = nid + 1;
          setPoints((prev) => [...prev, newPoint]);
          setNextPointId((n) => n + 1);
          setActivePointId(nid);
        },
        onPanResponderMove: (_evt, gestureState) => {
          const pid = activePointIdRef.current;
          if (pid === null) return;
          const start = dragStartPointPosRef.current;
          const { x: cx, y: cy } = constrain(start.x + gestureState.dx, start.y + gestureState.dy);
          setPoints((prev) =>
            prev.map((p) => (p.id === pid ? { ...p, x: cx, y: cy } : p))
          );
        },
        onPanResponderRelease: () => {
          // Open feelings drawer only after tap or drag ends
          if (activePointIdRef.current !== null) {
            setShowFeelings(true);
          }
        },
      }),
    [constrain, hitTestPoint]
  );

  const handleMapLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    mapLayout.current = { x, y, width, height };
  }, []);

  const removePoint = useCallback((pointId: number) => {
    setPoints((prev) => prev.filter((p) => p.id !== pointId));
    setActivePointId(null);
    setShowFeelings(false);
  }, []);

  const handleFeelingPress = useCallback(
    (feelingName: string) => {
      if (activePointId === null) return;
      const feeling = feelings.find((f) => f.nameDE === feelingName);
      if (!feeling) return;
      setPoints((prev) =>
        prev.map((p) => {
          if (p.id !== activePointId) return p;
          const has = p.feelings.includes(feeling.id);
          return {
            ...p,
            feelings: has ? p.feelings.filter((id) => id !== feeling.id) : [...p.feelings, feeling.id],
          };
        })
      );
    },
    [activePointId, feelings]
  );

  const activePoint = points.find((p) => p.id === activePointId);

  // Sync feelings drawer when a point is selected
  useEffect(() => {
    if (showFeelings && activePoint) {
      openFeelingsDrawer({
        feelings,
        activePoint,
        onFeelingPress: handleFeelingPress,
        removePoint,
        onClose: () => {
          setShowFeelings(false);
          setActivePointId(null);
        },
        feelingsLoading,
      });
    } else {
      closeFeelingsDrawer();
    }
  }, [showFeelings, activePoint, feelings, feelingsLoading, handleFeelingPress, removePoint, openFeelingsDrawer, closeFeelingsDrawer]);

  // Internal step 0: splash "Zeit zu Fühlen" and Weiter to enter the map
  if (internalStep === 0) {
    return (
      <View className="mb-6 flex flex-1 flex-col justify-between">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-xl font-medium text-gray-800">Zeit zu Fühlen</Text>
        </View>
        <View className="mt-4 px-0">
          <LearnNavigation
            onNext={gotoNextStep ?? (() => {})}
            onPrev={gotoPrevStep}
            showPrev={!!gotoPrevStep}
            nextText="Weiter"
          />
        </View>
      </View>
    );
  }

  // Internal step 1: bodymap
  return (
    <View className="mb-6 flex flex-1 flex-col">
      <Text className="mb-2 text-center text-lg font-medium text-gray-800">Zeit zu Fühlen</Text>

      <View className="items-center">
        <View
          style={[styles.mapContainer, { width: MAP_WIDTH, height: mapHeight }]}
          onLayout={handleMapLayout}
          {...panResponder.panHandlers}
        >
          <View pointerEvents="none" style={{ width: MAP_WIDTH, height: mapHeight }}>
            <Image
              source={characterImage}
              style={{ width: MAP_WIDTH, height: mapHeight }}
              resizeMode="contain"
            />
          </View>
          {points.map((point) => (
            <View
              key={point.id}
              pointerEvents="none"
              style={[
                styles.pointDot,
                {
                  left: point.x - 14,
                  top: point.y - 14,
                  zIndex: point.id === activePointId ? 20 : 10,
                },
              ]}
            >
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-xs font-medium text-gray-700">{point.feelings.length}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-2 flex-1 overflow-hidden px-1">
        {!showFeelings && (
          <Text className="py-2 text-center text-sm text-gray-500">
            Tippe auf den Körper, um zu beginnen
          </Text>
        )}
      </View>

      <View className="mt-4 px-0">
        <LearnNavigation
          onNext={gotoNextStep ?? (() => {})}
          onPrev={gotoPrevStep}
          showPrev={!!gotoPrevStep}
          nextText="Weiter"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  pointDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
