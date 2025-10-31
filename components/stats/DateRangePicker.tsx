import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface DateRangePickerProps {
  onTimeframeChange?: (timeframe: string) => void;
  selectedTimeframe?: string;
}

const timeframeOptions = [
  { value: 'today', label: 'Heute' },
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
    <>
      <TouchableOpacity style={styles.triggerButton} onPress={() => setIsOpen(true)}>
        <Calendar size={14} color="#666" />
        <Text style={styles.triggerText}>{selectedLabel}</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zeitraum wählen</Text>
            </View>

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
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  triggerText: {
    fontSize: 12,
    color: '#666',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  optionsList: {
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#c084fc',
    fontWeight: '600',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
