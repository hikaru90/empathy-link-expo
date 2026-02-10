/**
 * Grouped feelings selector component with collapsible categories.
 * Supports single/multiple select, optional highlight, and prepend text.
 */

import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import type { Feeling } from '@/lib/api/chat';
import { useEffect, useState } from 'react';
import { ScrollView, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export type GroupedFeelingsSelectType = 'single' | 'multiple';

export interface GroupedFeelingsProps {
  feelings: Feeling[];
  /** Called per tap when not using onSelectionChange. Value is nameDE or id depending on selection mode. */
  onFeelingPress?: (value: string) => void;
  isLoading?: boolean;
  /** When provided (and highlightSelection !== false), feelings in this array use the selected chip style. */
  selectedFeelingIds?: string[];
  /** Single: one choice per tap (e.g. add name to text). Multiple: toggle many by id. Used when onSelectionChange is provided. */
  selectType?: GroupedFeelingsSelectType;
  /** When false, no selection styling. When true and selectedFeelingIds provided, chips are highlighted. Default true when selection is used. */
  highlightSelection?: boolean;
  /** When provided, selection is driven by this callback instead of onFeelingPress. Use with selectType and selectedFeelingIds. */
  onSelectionChange?: (ids: string[]) => void;
  /** Optional text shown before each feeling name in non-header chips (e.g. "+ "). */
  prependText?: string;
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
  isLoading = false,
  selectedFeelingIds = [],
  selectType = 'multiple',
  highlightSelection = true,
  onSelectionChange,
  prependText = '',
}: GroupedFeelingsProps) {
  const [groupedFeelings, setGroupedFeelings] = useState<GroupedFeelings[]>([]);
  const isSelectionMode = onSelectionChange != null;
  const idsForStyle =
    highlightSelection && selectedFeelingIds.length > 0 ? selectedFeelingIds : undefined;

  const handleChipPress = (value: string) => {
    if (isSelectionMode) {
      const feeling = feelings.find((f) => f.id === value || f.nameDE === value);
      if (!feeling) return;
      const id = feeling.id;
      if (selectType === 'single') {
        onSelectionChange(selectedFeelingIds.includes(id) ? [] : [id]);
      } else {
        onSelectionChange(
          selectedFeelingIds.includes(id)
            ? selectedFeelingIds.filter((x) => x !== id)
            : [...selectedFeelingIds, id]
        );
      }
    } else {
      onFeelingPress?.(value);
    }
  };

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

  const getSelectedCountInCategory = (category: GroupedCategory): number => {
    return category.feelings.filter(
      (f) => f.nameEN !== category.category && selectedFeelingIds.includes(f.id)
    ).length;
  };

  const getChipStyle = (
    feeling: Feeling,
    category: GroupedCategory,
    isPositive: boolean,
    isHeader: boolean,
    isVisible: boolean,
    isSelected?: boolean,
    selectedInCategory?: number
  ): StyleProp<ViewStyle> => {
    if (isHeader) {
      const hasSelected = (selectedInCategory ?? 0) > 0;
      if (isPositive) {
        return {
          backgroundColor: isVisible ? `${baseColors.lilac}` : `${baseColors.lilac}80`,
          boxShadow: isVisible ? `inset 0 0 4px 0 rgba(0, 0, 0, 0.3)` : ``,
          ...(hasSelected && {
            borderWidth: 2,
            borderColor: baseColors.purple,
          }),
        };
      }
      return {
        backgroundColor: isVisible ? baseColors.forest+'88' : `${baseColors.forest}22`,
        boxShadow: isVisible ? `inset 0 0 4px 0 rgba(0, 0, 0, 0.3)` : ``,
        ...(hasSelected && {
          borderWidth: 2,
          borderColor: baseColors.purple,
        }),
      };
    }
    if (isSelected) {
      return {
        borderRadius: 0,
        borderBottomWidth: 1,
        borderBottomColor: baseColors.purple,
      };
    }
    return { backgroundColor: `transparent`, boxShadow: `none` };
  };

  if (isLoading) {
    return (
      <View className="p-4 items-center">
        <LoadingIndicator />
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
              const isSelected = !isHeader && (idsForStyle?.includes(feeling.id) ?? false);
              const chipValue = isSelectionMode || idsForStyle != null ? feeling.id : feeling.nameDE;
              const selectedInCategory = getSelectedCountInCategory(category);

              if (!shouldShow) return null;

              return (
                <TouchableOpacity
                  key={feeling.id}
                  testID={isHeader ? 'feeling-category-header' : 'feeling-chip'}
                  onPress={() => {
                    if (isHeader) {
                      toggleCategory(category.category);
                    } else {
                      handleChipPress(chipValue);
                    }
                  }}
                  className={`rounded-full py-1 flex-row items-center gap-1 ${
                    isHeader ? 'px-2' : 'px-0.5'
                  }`}
                  style={getChipStyle(feeling, category, isPositive, isHeader, category.visible, isSelected, selectedInCategory)}
                >
                  <Text className={isSelected ? 'text-black font-semibold' : 'text-black'}>
                    {!isHeader && prependText !== '' && (<Text className="text-xs text-black/40">{prependText}</Text>)}
                    {feeling.nameDE}
                    {isHeader && selectedInCategory > 0 ? ` (${selectedInCategory})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })
          ))
        ))}
      </View>
    </ScrollView>
  );
}
