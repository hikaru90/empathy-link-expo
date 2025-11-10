import baseColors from '@/baseColors.config';
import { ListFilter } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type FeelingTypeFilter = 'all' | 'positive' | 'negative';

interface FeelingTypeFilterProps {
  value: FeelingTypeFilter;
  onChange: (value: FeelingTypeFilter) => void;
}

const filterOptions: Array<{ value: FeelingTypeFilter; label: string }> = [
  { value: 'all', label: 'Alle Gefühle' },
  { value: 'positive', label: 'Positive Gefühle' },
  { value: 'negative', label: 'Negative Gefühle' },
];

export default function FeelingTypeFilter({ value, onChange }: FeelingTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);
  const tooltipOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isOpen) {
      Animated.spring(tooltipOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(tooltipOpacity, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isOpen]);

  const handleSelect = (selectedValue: FeelingTypeFilter) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleButtonPress = () => {
    buttonRef.current?.measureInWindow((pageX, pageY, width, height) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
      setIsOpen(true);
    });
  };

  // Calculate tooltip position - center it on the button
  const tooltipWidth = 180; // minWidth from styles
  const tooltipLeft = buttonLayout.x + buttonLayout.width / 2 - tooltipWidth / 2;

  const selectedLabel = filterOptions.find((opt) => opt.value === value)?.label || 'Filter';

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity className="flex-row items-center gap-1.5 py-1.5 px-2 rounded-lg" onPress={handleButtonPress}>
          <ListFilter size={14} color={baseColors.black} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          onPress={() => setIsOpen(false)}
        >
          <Animated.View
            style={[
              styles.tooltipContent,
              {
                opacity: tooltipOpacity,
                top: buttonLayout.y + buttonLayout.height + 8,
                left: tooltipLeft,
                maxWidth: 240,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.tooltipArrow} />

            <View style={styles.optionsList}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    value === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option.value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tooltipContent: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 2000,
    minWidth: 180,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  optionsList: {
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: baseColors.offwhite,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: baseColors.black,
    fontWeight: '600',
  },
  checkmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: baseColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

