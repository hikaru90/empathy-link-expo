import baseColors from '@/baseColors.config';
import DropdownModalWrapper from '@/components/ui/DropdownModalWrapper';
import { ListFilter } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  const handleSelect = (selectedValue: FeelingTypeFilter) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <DropdownModalWrapper
      open={isOpen}
      onOpenChange={setIsOpen}
      position="below"
      dropdownContent={
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
      }
    >
      <TouchableOpacity
        className="flex-row items-center gap-1.5 py-1.5 px-2 rounded-lg"
        onPress={() => setIsOpen((v) => !v)}
      >
        <ListFilter size={14} color={baseColors.black} />
      </TouchableOpacity>
    </DropdownModalWrapper>
  );
}

const styles = StyleSheet.create({
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

