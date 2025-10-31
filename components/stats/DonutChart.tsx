import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface DonutChartProps {
  data: Array<{ value: string; count: number }>;
  colors: string[];
}

export default function DonutChart({ data, colors }: DonutChartProps) {
  const size = 250;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Handle empty state
  if (data.length === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            stroke="#e5e5e5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 56, fontWeight: 'bold', color: '#999' }}>
            0
          </Text>
        </View>
      </View>
    );
  }

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Create segments using stroke-dasharray
  let accumulatedPercentage = 0;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" originX={centerX} originY={centerY}>
          {data.map((item, index) => {
            const percentage = item.count / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercentage * circumference;

            accumulatedPercentage += percentage;

            return (
              <Circle
                key={index}
                cx={centerX}
                cy={centerY}
                r={radius}
                stroke={colors[index] || '#ccc'}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 56, fontWeight: 'bold', color: '#000' }}>
          {data.length}
        </Text>
      </View>
    </View>
  );
}
