/**
 * Inline select: trigger + dropdown positioned absolutely below the trigger.
 * Dropdown sizes to content; only limited by screen width when needed.
 */

import baseColors from '@/baseColors.config';
import { ChevronsUpDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export interface SelectInlineOption {
  value: string;
  label: string;
}

export interface SelectInlineProps {
  options: SelectInlineOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerIcon?: React.ReactNode;
  disabled?: boolean;
  triggerStyle?: StyleProp<ViewStyle>;
  triggerTextStyle?: StyleProp<TextStyle>;
}

const CHECKMARK_SLOT_WIDTH = 30;
const MIN_DROPDOWN_WIDTH = 240;
const SCREEN_PADDING = 24;

export default function SelectInline({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Auswählen',
  open,
  onOpenChange,
  triggerIcon,
  disabled = false,
  triggerStyle,
  triggerTextStyle,
}: SelectInlineProps) {
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.spring(opacity, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [open]);

  const selectedOption = options.find((o) => o.value === selectedValue);
  const selectedLabel = selectedOption?.label ?? placeholder;
  const maxDropdownWidth = Dimensions.get('window').width - SCREEN_PADDING;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.trigger, triggerStyle]}
        onPress={() => !disabled && onOpenChange(true)}
        disabled={disabled}
      >
        {triggerIcon}
        <Text style={[styles.triggerText, triggerTextStyle]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <ChevronsUpDown size={14} color={baseColors.black} />
      </TouchableOpacity>

      {open && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity,
              maxWidth: maxDropdownWidth,
            },
          ]}
        >
          <View style={styles.arrow} />
          <View style={styles.optionsList}>
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => {
                    onValueChange(opt.value);
                    onOpenChange(false);
                  }}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      numberOfLines={1}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <View style={styles.checkmarkSlot}>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: baseColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 20,
  },
  triggerText: {
    fontSize: 12,
    color: baseColors.black,
    marginRight: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 0,
    alignSelf: 'flex-start',
    minWidth: MIN_DROPDOWN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 99999,
  },
  arrow: {
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
  optionSelected: {
    backgroundColor: baseColors.offwhite,
  },
  optionContent: {
    flexShrink: 0,
    maxWidth: '100%',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: baseColors.black,
    fontWeight: '600',
  },
  checkmarkSlot: {
    width: CHECKMARK_SLOT_WIDTH,
    marginLeft: 12,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
