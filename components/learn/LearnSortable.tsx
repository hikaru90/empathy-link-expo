import {
  DndProvider,
  Draggable,
  Droppable,
  type DndProviderProps,
} from '@mgcrea/react-native-dnd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { runOnJS } from 'react-native-reanimated';

import LearnNavigation from './LearnNavigation';

type BucketId = 'A' | 'B' | null;

const DROPPABLE_IDS = {
  unsorted: 'unsorted',
  bucketA: 'bucket-A',
  bucketB: 'bucket-B',
} as const;

interface LearnSortableProps {
  content: {
    bucketA: string;
    bucketB: string;
    items: Array<{ text: string; correctBucket: 'A' | 'B' }>;
  };
  color: string;
  initialUserSorting?: { [itemText: string]: BucketId };
  onResponse?: (response: { userSorting: { [itemText: string]: BucketId } }) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function LearnSortable({
  content,
  color,
  initialUserSorting,
  onResponse,
  onNext,
  onPrev,
}: LearnSortableProps) {
  const buildInitial = (): Record<string, BucketId> => {
    if (initialUserSorting && Object.keys(initialUserSorting).length > 0) {
      return { ...initialUserSorting };
    }
    const out: Record<string, BucketId> = {};
    content.items.forEach((item) => {
      out[item.text] = null;
    });
    return out;
  };

  const [userSorting, setUserSorting] = useState<Record<string, BucketId>>(buildInitial);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (initialUserSorting && Object.keys(initialUserSorting).length > 0) {
      setUserSorting({ ...initialUserSorting });
    }
  }, [JSON.stringify(initialUserSorting)]);

  const applyDrop = useCallback(
    (itemText: string, overId: string) => {
      setUserSorting((prev) => {
        let bucket: BucketId = null;
        if (overId === DROPPABLE_IDS.bucketA) bucket = 'A';
        else if (overId === DROPPABLE_IDS.bucketB) bucket = 'B';
        const nextSorting = { ...prev, [itemText]: bucket };
        onResponse?.({ userSorting: nextSorting });
        return nextSorting;
      });
    },
    [onResponse]
  );

  const runApplyDrop = useMemo(() => runOnJS(applyDrop), [applyDrop]);

  const handleDragEnd = useCallback<NonNullable<DndProviderProps['onDragEnd']>>(
    ({ active, over }) => {
      "worklet";
      if (over) {
        runApplyDrop(String(active.id), String(over.id));
      }
    },
    [runApplyDrop]
  );

  const cycleBucket = (itemText: string) => {
    const current = userSorting[itemText] ?? null;
    const next: BucketId = current === null ? 'A' : current === 'A' ? 'B' : null;
    const nextSorting = { ...userSorting, [itemText]: next };
    setUserSorting(nextSorting);
    onResponse?.({ userSorting: nextSorting });
  };

  const unsortedItems = useMemo(
    () => content.items.filter((item) => (userSorting[item.text] ?? null) === null),
    [content.items, userSorting]
  );
  const bucketAItems = useMemo(
    () => content.items.filter((item) => userSorting[item.text] === 'A'),
    [content.items, userSorting]
  );
  const bucketBItems = useMemo(
    () => content.items.filter((item) => userSorting[item.text] === 'B'),
    [content.items, userSorting]
  );

  const validation = useMemo(() => {
    const correct: string[] = [];
    const incorrect: string[] = [];
    const incorrectBuckets: ('A' | 'B')[] = [];
    content.items.forEach((item) => {
      const userBucket = userSorting[item.text];
      if (userBucket === null) return;
      if (userBucket === item.correctBucket) correct.push(item.text);
      else {
        incorrect.push(item.text);
        if (!incorrectBuckets.includes(userBucket)) incorrectBuckets.push(userBucket);
      }
    });
    return { correctItems: correct, incorrectItems: incorrect, incorrectBuckets };
  }, [content.items, userSorting]);

  const allSorted = content.items.every((item) => (userSorting[item.text] ?? null) !== null);
  const isCorrect = allSorted && validation.incorrectItems.length === 0;

  useEffect(() => {
    setShowValidation(allSorted);
  }, [allSorted]);

  const buckets = [
    { id: 'A' as const, name: content.bucketA },
    { id: 'B' as const, name: content.bucketB },
  ];

  const renderChip = (
    item: { text: string; correctBucket: 'A' | 'B' },
    bucketId: BucketId,
    _isInBucket: boolean
  ) => {
    const isIncorrect = showValidation && validation.incorrectItems.includes(item.text);
    return (
      <Draggable key={item.text} id={item.text} data={{ itemText: item.text }}>
        <TouchableOpacity
          onPress={() => cycleBucket(item.text)}
          style={{
            backgroundColor: isIncorrect ? '#ef4444' : color,
          }}
          className="rounded-xl px-2 py-1"
          activeOpacity={0.8}
        >
          <Text className={`text-sm ${isIncorrect ? 'text-white' : ''}`}>{item.text}</Text>
        </TouchableOpacity>
      </Draggable>
    );
  };

  return (
    <View className="flex flex-grow flex-col justify-between">
      <View className="flex flex-grow flex-col gap-3">
        <DndProvider onDragEnd={handleDragEnd} minDistance={8}>
          {unsortedItems.length > 0 ? (
            <>
              <Text className="text-sm font-medium text-gray-700">Zu sortierende Elemente</Text>
              <Droppable id={DROPPABLE_IDS.unsorted}>
                <View className="flex flex-row flex-wrap gap-1">
                  {unsortedItems.map((item) => (
                    <Draggable key={item.text} id={item.text} data={{ itemText: item.text }}>
                      <TouchableOpacity
                        onPress={() => cycleBucket(item.text)}
                        style={{ backgroundColor: color }}
                        className="rounded-xl px-2 py-1"
                        activeOpacity={0.8}
                      >
                        <Text className="text-sm text-gray-900">{item.text}</Text>
                      </TouchableOpacity>
                    </Draggable>
                  ))}
                </View>
              </Droppable>
            </>
          ) : null}

          <View className="flex-row gap-4" style={{ flex: 1 }}>
            {buckets.map((bucket) => {
              const items = bucket.id === 'A' ? bucketAItems : bucketBItems;
              const isBucketIncorrect = showValidation && validation.incorrectBuckets.includes(bucket.id);
              const droppableId = bucket.id === 'A' ? DROPPABLE_IDS.bucketA : DROPPABLE_IDS.bucketB;
              return (
                <Droppable
                  key={bucket.id}
                  id={droppableId}
                  style={{
                    minHeight: 140,
                    flex: 1,
                    flexDirection: 'column',
                    borderRadius: 8,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    padding: 12,
                    borderColor: isBucketIncorrect ? '#ef4444' : color,
                    backgroundColor: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <Text className="py-1 text-center text-sm font-medium">{bucket.name}</Text>
                  <View className="mt-1 flex flex-1 flex-wrap gap-1">
                    {items.map((item) => renderChip(item, bucket.id, true))}
                    {items.length === 0 ? (
                      <View className="flex-1 items-center justify-center">
                        <Text className="text-center text-sm text-black/60">Elemente hier ablegen</Text>
                      </View>
                    ) : null}
                  </View>
                </Droppable>
              );
            })}
          </View>
        </DndProvider>

        <View className="items-center">
          <Text className="text-xs text-black/60">
            {content.items.length - unsortedItems.length} von {content.items.length} Elementen sortiert
          </Text>
          <View className="mx-4 mt-1 h-2 w-full rounded-full bg-black/5 p-0.5">
            <View
              className="h-full rounded-full"
              style={{
                width: `${((content.items.length - unsortedItems.length) / content.items.length) * 100}%`,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      </View>

      <LearnNavigation
        onNext={onNext ?? (() => {})}
        onPrev={onPrev}
        nextText="Weiter"
        showPrev={!!onPrev}
        disabled={!isCorrect}
      />
    </View>
  );
}
