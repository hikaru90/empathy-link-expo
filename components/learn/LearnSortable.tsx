import {
  DragndropContextProvider,
  DragndropDragContent,
  DragndropEndPoint,
  DragndropStartPoint,
  type DragndropData,
} from '@/lib/dragndrop';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import LearnNavigation from './LearnNavigation';

type BucketId = 'A' | 'B' | null;

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

  const handleDrop = useCallback(
    (data: DragndropData, bucket: BucketId) => {
      setUserSorting((prev) => {
        const nextSorting = { ...prev, [data.itemText]: bucket };
        queueMicrotask(() => onResponse?.({ userSorting: nextSorting }));
        return nextSorting;
      });
    },
    [onResponse]
  );

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

  const bucketStyle = (isIncorrect: boolean) => ({
    minHeight: 100,
    flex: 1,
    flexShrink: 1,
    flexDirection: 'column' as const,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    padding: 12,
    borderColor: isIncorrect ? '#ef4444' : color,
  });

  const renderPill = (
    item: { text: string; correctBucket: 'A' | 'B' },
    isIncorrect: boolean,
    pillColor: string
  ) => (
    <DragndropStartPoint
      key={item.text}
      data={{ itemText: item.text, correctBucket: item.correctBucket }}
    >
      <TouchableOpacity
        testID={`sortable-item-${item.text}--${item.correctBucket}`}
        style={{ backgroundColor: pillColor }}
        className="rounded-xl px-2 py-1"
        activeOpacity={0.8}
      >
        <Text className={`text-sm ${isIncorrect ? 'text-white' : 'text-gray-900'}`}>
          {item.text}
        </Text>
      </TouchableOpacity>
    </DragndropStartPoint>
  );

  return (
    <View testID="sortable-container" className="flex flex-col justify-between mb-5 gap-3" style={{ flex: 1, minHeight: 0 }}>
      <View
        className="flex flex-col gap-3"
        style={{ flex: 1, flexShrink: 1, minHeight: 0 }}
      >
        <DragndropContextProvider>
          <DragndropDragContent
            renderContent={(data) => (
              <View
                style={{
                  backgroundColor: color,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text className="text-sm text-gray-900">{data.itemText}</Text>
              </View>
            )}
          />

          <View style={{ position: 'relative', zIndex: 20 }}>
            <Text className="text-sm font-medium text-gray-700">Unsortierte Elemente ({unsortedItems.length})
            </Text>
            <DragndropEndPoint
              zoneId="unsorted"
              onDrop={(data) => handleDrop(data, null)}
              style={{
                borderColor: color,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <View style={{ minHeight: 44 }}>
                {unsortedItems.length > 0 ? (
                  <View className="flex flex-row flex-wrap gap-1">
                    {unsortedItems.map((item) => renderPill(item, false, color))}
                  </View>
                ) : (
                  <View className="flex-1 items-center justify-center py-2">
                    <Text className="text-center text-sm text-black/60">
                      Hierher ziehen zum Zurücksetzen
                    </Text>
                  </View>
                )}
              </View>
            </DragndropEndPoint>
          </View>

          <View
            className="flex-row gap-4"
            style={{ flex: 1, flexShrink: 1, minHeight: 0, position: 'relative' }}
          >
            {buckets.map((bucket) => {
              const items = bucket.id === 'A' ? bucketAItems : bucketBItems;
              const isBucketIncorrect =
                showValidation && validation.incorrectBuckets.includes(bucket.id);
              return (
                <View
                  key={bucket.id}
                  testID={`sortable-bucket-${bucket.id}`}
                  style={{ flex: 1, flexShrink: 1, minHeight: 0, position: 'relative', zIndex: 10 }}
                >
                  <DragndropEndPoint
                    zoneId={`bucket-${bucket.id}`}
                    onDrop={(data) => handleDrop(data, bucket.id)}
                    style={bucketStyle(isBucketIncorrect)}
                  >
                    <View style={{ flex: 1, minHeight: 0 }}>
                      <Text className="py-1 text-center text-sm font-medium">{bucket.name} ({items.length})</Text>
                      <ScrollView
                        style={{ flex: 1, minHeight: 0 }}
                        contentContainerStyle={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 4,
                          paddingTop: 4,
                          alignItems: 'flex-start',
                          flexGrow: items.length === 0 ? 1 : undefined,
                        }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled
                      >
                        {items.map((item) => {
                          const isIncorrect =
                            showValidation && validation.incorrectItems.includes(item.text);
                          return renderPill(
                            item,
                            isIncorrect,
                            isIncorrect ? '#ef4444' : color
                          );
                        })}
                        {items.length === 0 ? (
                          <View
                            style={{
                              flex: 1,
                              minHeight: 60,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text className="text-center text-sm text-black/60">
                              Elemente hier ablegen
                            </Text>
                          </View>
                        ) : null}
                      </ScrollView>
                    </View>
                  </DragndropEndPoint>
                </View>
              );
            })}
          </View>
        </DragndropContextProvider>

      </View>

      <View className="flex-shrink-0">
        <LearnNavigation
          onNext={onNext ?? (() => { })}
          onPrev={onPrev}
          nextText="Weiter"
          showPrev={!!onPrev}
          disabled={!isCorrect}
        />
      </View>
    </View>
  );
}
