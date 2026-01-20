import baseColors from '@/baseColors.config';
import { ChevronsUpDown } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  buttonStyle?: any;
  buttonTextStyle?: any;
}

export default function SelectDropdown({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Auswählen',
  buttonStyle,
  buttonTextStyle,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showAbove, setShowAbove] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const buttonRef = useRef<View>(null);
  const dropdownRef = useRef<View>(null);
  const tooltipOpacity = useState(new Animated.Value(0))[0];
  const windowHeight = Dimensions.get('window').height;

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

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  const handleButtonPress = () => {
    buttonRef.current?.measureInWindow((pageX, pageY, width, height) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
      
      // Estimate dropdown height: padding (16) + option height (~50px each) + padding (16)
      const estimatedDropdownHeight = 16 + (options.length * 50) + 16;
      const spaceBelow = windowHeight - (pageY + height + 8);
      const spaceAbove = pageY - 8;
      
      // Show above if there's not enough space below but enough space above
      const shouldShowAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight;
      
      setShowAbove(shouldShowAbove);
      // Set initial position based on estimate
      setDropdownTop(shouldShowAbove 
        ? pageY - estimatedDropdownHeight - 8
        : pageY + height + 8
      );
      setIsOpen(true);
    });
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const selectedLabel = selectedOption?.label || placeholder;

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity style={[styles.triggerButton, buttonStyle]} onPress={handleButtonPress}>
          <View style={styles.triggerContent}>
            <Text style={[styles.triggerText, buttonTextStyle]}>{selectedLabel}</Text>
            {selectedOption?.description && (
              <Text style={styles.triggerDescription}>{selectedOption.description}</Text>
            )}
          </View>
          <ChevronsUpDown size={16} color={baseColors.black} />
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
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0)' }}
          onPress={() => setIsOpen(false)}
        >
          <Animated.View
            ref={dropdownRef}
            style={[
              styles.tooltipContent,
              {
                opacity: tooltipOpacity,
                top: dropdownTop,
                left: Math.max(20, Math.min(buttonLayout.x + buttonLayout.width / 2 - 120, buttonLayout.x)),
                maxWidth: 240,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onLayout={(event) => {
              const actualHeight = event.nativeEvent.layout.height;
              
              // Re-check positioning with actual height
              const spaceBelow = windowHeight - (buttonLayout.y + buttonLayout.height + 8);
              const spaceAbove = buttonLayout.y - 8;
              
              // If showing below but would go off-screen, switch to above
              if (!showAbove && spaceBelow < actualHeight && spaceAbove > actualHeight) {
                setShowAbove(true);
                setDropdownTop(buttonLayout.y - actualHeight - 8);
              }
              // If showing above but would go off-screen, switch to below (shouldn't happen often)
              else if (showAbove && spaceAbove < actualHeight && spaceBelow > actualHeight) {
                setShowAbove(false);
                setDropdownTop(buttonLayout.y + buttonLayout.height + 8);
              }
              // Adjust position if showing above to account for actual height
              else if (showAbove) {
                setDropdownTop(buttonLayout.y - actualHeight - 8);
              }
            }}
          >
            <View style={[
              styles.tooltipArrow,
              showAbove ? styles.tooltipArrowBottom : styles.tooltipArrowTop
            ]} />

            <View style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    selectedValue === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        selectedValue === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    )}
                  </View>
                  {selectedValue === option.value && (
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
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  triggerContent: {
    flex: 1,
    marginRight: 8,
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  triggerDescription: {
    fontSize: 14,
    color: '#666',
  },
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
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tooltipArrowTop: {
    top: -8,
    borderBottomWidth: 8,
    borderBottomColor: '#fff',
  },
  tooltipArrowBottom: {
    bottom: -8,
    borderTopWidth: 8,
    borderTopColor: '#fff',
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
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  selectedOptionText: {
    color: baseColors.black,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  checkmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: baseColors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
