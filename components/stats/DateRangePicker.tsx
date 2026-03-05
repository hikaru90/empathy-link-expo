import baseColors from '@/baseColors.config';
import DropdownModalWrapper from '@/components/ui/DropdownModalWrapper';
import { Calendar, ChevronsUpDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DateRangePickerProps {
  onTimeframeChange?: (timeframe: string) => void;
  selectedTimeframe?: string;
}

const timeframeOptions = [
  { value: 'today', label: 'Heute' },
  { value: 'yesterday', label: 'Gestern' },
  { value: 'dayBeforeYesterday', label: 'Vorgestern' },
  { value: 'lastWeek', label: 'Letzte Woche' },
  { value: 'lastMonth', label: 'Letzter Monat' },
  { value: 'lastYear', label: 'Letztes Jahr' },
];

export default function DateRangePicker({ onTimeframeChange, selectedTimeframe = 'lastWeek' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    onTimeframeChange?.(value);
    setIsOpen(false);
  };

  const selectedLabel = timeframeOptions.find((opt) => opt.value === selectedTimeframe)?.label || 'Zeitraum wählen';

  return (
    <DropdownModalWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      position="below"
      dropdownContent={
        <View style={styles.optionsList}>
          {timeframeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selectedTimeframe === option.value && styles.selectedOption,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedTimeframe === option.value && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
              {selectedTimeframe === option.value && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      }
    >
      <TouchableOpacity style={styles.triggerButton} onPress={() => setIsOpen((v) => !v)}>
        <Calendar size={12} color={baseColors.black} />
        <Text style={styles.triggerText}>{selectedLabel}</Text>
        <ChevronsUpDown size={14} color={baseColors.black} />
      </TouchableOpacity>
    </DropdownModalWrapper>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 12,
    color: baseColors.black,
    marginRight: 4,
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
