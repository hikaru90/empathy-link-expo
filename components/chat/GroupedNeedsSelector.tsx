/**
 * Grouped needs selector component with collapsible categories
 * Based on the GroupedFeelingsSelector
 */

import baseColors from '@/baseColors.config';
import type { Need } from '@/lib/api/chat';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface GroupedNeedsProps {
  needs: Need[];
  onNeedPress: (needName: string) => void;
  isLoading?: boolean;
  selectedNeedIds?: string[]; // Optional: IDs of selected needs to highlight
}

interface GroupedCategory {
  category: string;
  categoryDE: string;
  visible: boolean;
  needs: Need[];
}

/**
 * Groups an array by a specified key
 */
const groupBy = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export default function GroupedNeedsSelector({
  needs,
  onNeedPress,
  isLoading = false,
  selectedNeedIds = []
}: GroupedNeedsProps) {
  const [groupedNeeds, setGroupedNeeds] = useState<GroupedCategory[]>([]);

  useEffect(() => {
    if (needs.length === 0) return;

    // Group by category
    const byCategory = groupBy(needs, 'category');

    const categories: GroupedCategory[] = Object.entries(byCategory).map(([category, categoryNeeds]) => {
      // Sort needs by sort field
      const sorted = categoryNeeds.sort((a, b) => a.sort - b.sort);

      // Get the German category name from the first need in this category
      const categoryDE = categoryNeeds[0]?.categoryDE || category;

      return {
        category,
        categoryDE,
        visible: false,
        needs: sorted,
      };
    });

    setGroupedNeeds(categories);
  }, [needs]);

  const toggleCategory = (category: string) => {
    setGroupedNeeds(prevCategories =>
      prevCategories.map(cat =>
        cat.category === category
          ? { ...cat, visible: !cat.visible }
          : cat
      )
    );
  };

  const getCategoryHeaderStyle = (isVisible: boolean): StyleProp<ViewStyle> => {
    return {
      backgroundColor: isVisible ? baseColors.forest+'66' : baseColors.forest + '22', // green-300
      boxShadow: isVisible ? 'inset 0 0 4px 0 rgba(0, 0, 0, 0.3)' : ''
    };
  };

  if (isLoading) {
    return (
      <View className="p-4 items-center">
        <ActivityIndicator size="small" color={baseColors.lilac} />
      </View>
    );
  }

  if (needs.length === 0) {
    return (
      <Text className="text-gray-500 p-4 text-center">Keine Bedürfnisse gefunden</Text>
    );
  }

  return (
    <ScrollView
      className="rounded-t-3xl"
      contentContainerStyle={{
        paddingVertical: 0
      }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
    >
      <View className="flex-row flex-wrap gap-2 px-3 py-3">
        {groupedNeeds.map((category, catIndex) => (
          <React.Fragment key={category.category}>
            {/* Category Header */}
            <TouchableOpacity
              onPress={() => toggleCategory(category.category)}
              className="rounded-full py-1 px-2 flex-row items-center gap-1"
              style={getCategoryHeaderStyle(category.visible)}
            >
              <View
                className=""
                style={{ backgroundColor: baseColors.lilac }}
              />
              <Text className="text-black font-medium">{category.categoryDE}</Text>
            </TouchableOpacity>

            {/* Category Needs */}
            {category.visible && category.needs.map((need) => {
              const isSelected = selectedNeedIds.includes(need.id);
              return (
                <TouchableOpacity
                  key={need.id}
                  onPress={() => onNeedPress(need.nameDE)}
                  className="rounded-full py-1 px-2 flex-row items-center gap-1"
                  style={{
                    backgroundColor: isSelected ? baseColors.lilac : 'transparent',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: '#000',
                  }}
                >
                  <View className="">
                    <Text className={`text-xs ${isSelected ? 'text-black' : 'text-black'}`}>
                      {isSelected ? '✓' : '+'}
                    </Text>
                  </View>
                  <Text className={`text-black ${isSelected ? 'font-semibold' : ''}`}>
                    {need.nameDE}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}
