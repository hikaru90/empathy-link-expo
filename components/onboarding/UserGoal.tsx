import baseColors from '@/baseColors.config';
import { USER_GOALS } from '@/constants/onboarding';
import { ChevronDown } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

interface UserGoalProps {
  selectedGoal?: string;
  onSelectGoal?: (goal: string) => void;
}

export default function UserGoal({ selectedGoal = '', onSelectGoal }: UserGoalProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current;

  useEffect(() => {
    if (pickerVisible && !isClosing) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(WINDOW_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    }
  }, [pickerVisible, isClosing, backdropOpacity, sheetTranslateY]);

  useEffect(() => {
    if (!isClosing) return;
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: WINDOW_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setPickerVisible(false);
        setIsClosing(false);
      }
    });
  }, [isClosing, backdropOpacity, sheetTranslateY]);

  const handleOpenPicker = () => setPickerVisible(true);
  const handleClosePicker = () => {
    if (pickerVisible && !isClosing) setIsClosing(true);
  };

  const handleSelectGoal = (goal: string) => {
    onSelectGoal?.(goal);
    if (pickerVisible && !isClosing) setIsClosing(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={handleOpenPicker}
        activeOpacity={0.8}
      >
        <Text style={styles.selectionButtonText} numberOfLines={1}>
          {selectedGoal || 'Auswahl treffen'}
        </Text>
        <ChevronDown size={18} color={baseColors.black} />
      </TouchableOpacity>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="none"
        onRequestClose={handleClosePicker}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      >
        <View style={styles.pickerRoot}>
          <Pressable style={styles.pickerBackdropTouch} onPress={handleClosePicker}>
            <Animated.View style={[styles.pickerOverlay, { opacity: backdropOpacity }]} />
          </Pressable>
          <Animated.View
            style={[styles.pickerSheet, { transform: [{ translateY: sheetTranslateY }] }]}
            pointerEvents="box-none"
          >
            <View style={styles.pickerSheetInner} pointerEvents="box-none">
              <View style={styles.pickerHandle} />
              <Text style={styles.pickerTitle}>Was möchtest du mit Empathy-Link erreichen?</Text>
              <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
                {USER_GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.drawerOption, selectedGoal === goal && styles.drawerOptionSelected]}
                    onPress={() => handleSelectGoal(goal)}
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
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  pickerRoot: {
    flex: 1,
  },
  pickerBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: baseColors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    maxHeight: '92%',
  },
  pickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: baseColors.black + '33',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  drawerScroll: {
    maxHeight: 400,
    paddingHorizontal: 16,
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
