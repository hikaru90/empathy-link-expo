import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

/** Returns a value between -20 and -80: step 0 => -20, middle => -50, last step => -80 (linear) */
function getStepTranslateX(steps: number, currentStep: number): number {
  if (steps <= 1) return -20;
  const t = currentStep / (steps - 1);
  return -20 - 60 * t;
}

interface LearnStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
  backgroundColor?: string;
  inactiveColor?: string;
  stepName?: string;
}

export default function LearnStepIndicator({
  currentStep,
  totalSteps,
  color = '#A366FF',
  inactiveColor = 'rgba(0,0,0,0.1)',
  stepName,
}: LearnStepIndicatorProps) {
  return (
    <View style={{ marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderRadius: 999,
          backgroundColor: 'rgba(115,115,115,0.05)',
          padding: 4,
          width: '75%',
        }}
      >
        {Array.from({ length: totalSteps }, (_, index) => index).map((stepIndex) => (
          <View
            key={stepIndex}
            style={{
              height: 8,
              flexGrow: 1,
              borderRadius: 6,
              backgroundColor: currentStep >= stepIndex ? color : inactiveColor,
              position: 'relative',
            }}
          >
            {stepName && currentStep === stepIndex ? (
              <View>
                <View style={{ position: 'absolute', bottom: -16, left: '50%', transform: [{ translateX: '-50%' }], zIndex: 10 }}>
                  <Svg width={8} height={4} viewBox="0 0 12 8" style={{ alignSelf: 'center' }}>
                    <Polygon points="6,0 0,8 12,8" fill={color} />
                  </Svg>
                </View>
                <View style={{
                  position: 'absolute',
                  bottom: -16,
                  left: '50%',
                  transform: [{ translateX: `${getStepTranslateX(totalSteps, currentStep)}%` }, { translateY: '100%' as any }],
                  marginTop: 12,
                alignItems: 'center',
                justifyContent: 'center'
                }}>
                <Text numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: inactiveColor,
                      textAlign: 'center',
                      backgroundColor: color,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    {stepName}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
