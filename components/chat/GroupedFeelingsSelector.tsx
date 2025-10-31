/**
 * Grouped feelings selector component with collapsible categories
 * Based on the FeelingSelector from empathy-link
 */

import baseColors from '@/baseColors.config';
import type { Feeling } from '@/lib/api/chat';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface GroupedFeelingsProps {
  feelings: Feeling[];
  onFeelingPress: (feelingName: string) => void;
  isLoading?: boolean;
}

interface GroupedCategory {
  category: string;
  visible: boolean;
  feelings: Feeling[];
}

interface GroupedFeelings {
  positive: boolean;
  categories: GroupedCategory[];
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

export default function GroupedFeelingsSelector({
  feelings,
  onFeelingPress,
  isLoading = false
}: GroupedFeelingsProps) {
  const [groupedFeelings, setGroupedFeelings] = useState<GroupedFeelings[]>([]);

  useEffect(() => {
    if (feelings.length === 0) return;

    // First group by positive/negative
    const byPositive = groupBy(feelings, 'positive');

    // Then group each positive/negative group by category
    const grouped: GroupedFeelings[] = Object.entries(byPositive).map(([positive, feelingsList]) => {
      const byCategory = groupBy(feelingsList, 'category');

      const categories: GroupedCategory[] = Object.entries(byCategory).map(([category, categoryFeelings]) => {
        // Sort feelings, but ensure the category header (nameEN === category) comes first
        const sorted = categoryFeelings.sort((a, b) => {
          const aIsHeader = a.nameEN === category;
          const bIsHeader = b.nameEN === category;

          if (aIsHeader && !bIsHeader) return -1;
          if (!aIsHeader && bIsHeader) return 1;
          return a.sort - b.sort;
        });

        return {
          category,
          visible: false,
          feelings: sorted,
        };
      });

      return {
        positive: positive === 'true',
        categories,
      };
    });

    setGroupedFeelings(grouped);
  }, [feelings]);

  const toggleCategory = (category: string) => {
    setGroupedFeelings(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        categories: group.categories.map(cat =>
          cat.category === category
            ? { ...cat, visible: !cat.visible }
            : cat
        ),
      }))
    );
  };

  const isCategoryHeader = (feeling: Feeling, category: GroupedCategory): boolean => {
    return feeling.nameEN === category.category;
  };

  const shouldShowFeeling = (feeling: Feeling, category: GroupedCategory): boolean => {
    return isCategoryHeader(feeling, category) || category.visible;
  };

  const getChipStyle = (feeling: Feeling, category: GroupedCategory, isPositive: boolean, isHeader: boolean, isVisible: boolean): StyleProp<ViewStyle> => {
    if (isHeader) {
      if(isPositive) {
        return { 
          backgroundColor: isVisible ? `${baseColors.lilac}` : `${baseColors.lilac}80`, 
          boxShadow: isVisible ? `inset 0 0 4px 0 rgba(0, 0, 0, 0.3)` : `` 
        };
      } 
      return { backgroundColor: isVisible ? `#dddddd` : `#dddddd80`, 
        boxShadow: isVisible ? `inset 0 0 4px 0 rgba(0, 0, 0, 0.3)` : `` 
      };
    }
    return { backgroundColor: `transparent`, boxShadow: `none` };
  };

  if (isLoading) {
    return (
      <View className="p-4 items-center">
        <ActivityIndicator size="small" color={baseColors.lilac} />
      </View>
    );
  }

  if (feelings.length === 0) {
    return (
      <Text className="text-gray-500 p-4 text-center">Keine Gefühle gefunden</Text>
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
      <View className="flex-row flex-wrap gap-2 px-3 py-3 ">
        {groupedFeelings.map((positiveGroup, groupIndex) => (
          positiveGroup.categories.map((category, catIndex) => (
            category.feelings.map((feeling, feelingIndex) => {
              const isHeader = isCategoryHeader(feeling, category);
              const shouldShow = shouldShowFeeling(feeling, category);
              const isPositive = feeling.positive;

              if (!shouldShow) return null;

              return (
                <TouchableOpacity
                  key={feeling.id}
                  onPress={() => {
                    if (isHeader) {
                      toggleCategory(category.category);
                    } else {
                      onFeelingPress(feeling.nameDE);
                    }
                  }}
                  className={`rounded-full py-1 flex-row items-center gap-1 ${
                    isHeader
                      ? 'px-2'
                      : 'px-1'
                  }` }
                  style={getChipStyle(feeling, category, isPositive, isHeader, category.visible)}
                >
                  {!isHeader && (
                    <View
                      className=""
                    >
                      <Text className="text-xs text-black">+</Text>
                    </View>
                  )}
                  <Text className="text-black">{feeling.nameDE}</Text>
                </TouchableOpacity>
              );
            })
          ))
        ))}
      </View>
    </ScrollView>
  );
}
