/**
 * Feelings drawer for the bodymap. Uses the global BottomDrawer and
 * useFeelingsDrawer context. Rendered in the layout, not in Header.
 */

import GroupedFeelingsSelector from '@/components/chat/GroupedFeelingsSelector';
import BottomDrawer from '@/components/BottomDrawer';
import { useFeelingsDrawer } from '@/hooks/use-feelings-drawer';
import { Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

/** Handle + header + paddingBottom so BottomDrawer initial height fits content. */
const DRAWER_CHROME = 28 + 52 + 32;

export default function FeelingsDrawer() {
  const {
    isOpen,
    payload,
    closeDrawer,
  } = useFeelingsDrawer();
  const [contentHeight, setContentHeight] = useState(0);

  function handleClose() {
    payload?.onClose?.();
    closeDrawer();
  }

  return (
    <BottomDrawer
      visible={isOpen && !!payload}
      onClose={handleClose}
      title="Gefühle wählen"
      tall
      initialHeight={contentHeight > 0 ? contentHeight + DRAWER_CHROME : undefined}
    >
      {payload ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          onContentSizeChange={(_w, h) => setContentHeight(h)}
        >
          <View className="mb-2 flex-row flex-wrap gap-1">
            {payload.activePoint.feelings.map((id) => {
              const f = payload.feelings.find((x) => x.id === id);
              return (
                <View
                  key={id}
                  className="rounded-full bg-gray-200 px-2 py-1"
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text className="text-xs text-gray-800">{f?.nameDE ?? id}</Text>
                </View>
              );
            })}
          </View>
          <GroupedFeelingsSelector
            feelings={payload.feelings}
            onFeelingPress={payload.onFeelingPress}
            isLoading={payload.feelingsLoading}
          />
          <TouchableOpacity
            onPress={() => {
              payload.removePoint(payload.activePoint.id);
              closeDrawer();
            }}
            className="mt-2 flex-row items-center justify-center gap-1 rounded-lg bg-red-500 px-3 py-2"
            style={{ marginBottom: 16 }}
          >
            <Trash2 size={14} color="#fff" />
            <Text className="text-xs font-medium text-white">löschen</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </BottomDrawer>
  );
}
