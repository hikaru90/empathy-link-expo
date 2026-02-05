import baseColors from '@/baseColors.config';
import { USER_GOALS } from '@/constants/onboarding';
import { useBottomDrawerSlot } from '@/hooks/use-bottom-drawer-slot';
import { ChevronDown } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserGoalProps {
  selectedGoal?: string;
  onSelectGoal?: (goal: string) => void;
}

export default function UserGoal({ selectedGoal = '', onSelectGoal }: UserGoalProps) {
  const { openDrawer, closeDrawer } = useBottomDrawerSlot();

  const handleOpenDrawer = () => {
    openDrawer({
      title: 'Was möchtest du mit Empathy-Link erreichen?',
      onClose: () => {},
      tall: true,
      initialHeight: 400,
      children: (
        <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
          {USER_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[styles.drawerOption, selectedGoal === goal && styles.drawerOptionSelected]}
              onPress={() => {
                onSelectGoal?.(goal);
                closeDrawer();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.drawerOptionText, selectedGoal === goal && styles.drawerOptionTextSelected]}
                numberOfLines={2}
              >
                {goal}
              </Text>
              {selectedGoal === goal && (
                <Text style={styles.drawerCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ),
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={handleOpenDrawer}
        activeOpacity={0.8}
      >
        <Text style={styles.selectionButtonText} numberOfLines={1}>
          {selectedGoal || 'Auswahl treffen'}
        </Text>
        <ChevronDown size={18} color={baseColors.black} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: baseColors.white + 'cc',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectionButtonText: {
    fontSize: 16,
    color: baseColors.black,
    flex: 1,
    marginRight: 8,
  },
  drawerScroll: {
    maxHeight: 400,
  },
  drawerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: baseColors.white + 'cc',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 8,
  },
  drawerOptionSelected: {
    backgroundColor: baseColors.black,
    borderColor: baseColors.black,
  },
  drawerOptionText: {
    fontSize: 15,
    color: baseColors.black,
    flex: 1,
  },
  drawerOptionTextSelected: {
    color: baseColors.offwhite,
  },
  drawerCheckmark: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.offwhite,
    marginLeft: 8,
  },
});
