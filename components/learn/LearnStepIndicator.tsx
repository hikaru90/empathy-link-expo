import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LearnStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
  backgroundColor?: string;
  inactiveColor?: string;
}

export default function LearnStepIndicator({
  currentStep,
  totalSteps,
  color = '#A366FF',
  inactiveColor = 'rgba(0,0,0,0.1)',
}: LearnStepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {Array.from({ length: totalSteps }, (_, index) => index).map((stepIndex) => (
          <View
            key={stepIndex}
            style={[
              styles.segment,
              {
                backgroundColor: currentStep >= stepIndex ? color : inactiveColor,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(115,115,115,0.05)',
    padding: 4,
    width: '75%',
  },
  segment: {
    height: 8,
    flexGrow: 1,
    borderRadius: 6,
  },
});
