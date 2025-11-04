import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

interface DonutChartProps {
  data: Array<{ value: string; count: number }>;
  colors?: string[]; // Made optional since we'll use default colors
}

interface Segment {
  color: string;
  angleDegrees: number;
  value: string;
  count: number;
}

// Default color palette
const defaultColors = [
  '#F0BADA', // rose
  '#DB79AA', // pink
  '#080638', // black
  '#17545A', // forest
  '#D6BBFF', // lilac
  '#A366FF', // purple
  '#FF9C34', // orange
];

// Generate extended color array with reduced opacity versions
const generateColorArray = (baseColors: string[], count: number): string[] => {
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const colorIndex = i % baseColors.length;
    const color = baseColors[colorIndex];

    // First cycle: use original colors
    if (i < baseColors.length) {
      colors.push(color);
    } else {
      // Second cycle and beyond: add with 50% opacity
      colors.push(`${color}80`); // 80 in hex = 50% opacity
    }
  }

  return colors;
};

export default function DonutChart({ data, colors }: DonutChartProps) {
  const size = 250;
  const ringThickness = 30;
  const centerX = size / 2;
  const centerY = size / 2;

  // Define the middle radius (center of the ring)
  const radius = (size - ringThickness) / 2;
  const outerRadius = radius + ringThickness / 2;
  const innerRadius = radius - ringThickness / 2;

  // Gap between segments in degrees
  const gapDegrees = 2;

  // Border radius for rounded corners
  const cornerRadius = 6;

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
            strokeWidth={ringThickness}
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

  // Generate color array based on data length
  const chartColors = colors || generateColorArray(defaultColors, data.length);

  // Calculate total available degrees (360 minus gaps)
  const totalGaps = gapDegrees * data.length;
  const availableDegrees = 360 - totalGaps;

  // Calculate each segment's angle in degrees
  const segments: Segment[] = data.map((item, index) => {
    const percentage = item.count / total;
    const angleDegrees = percentage * availableDegrees;

    return {
      color: chartColors[index] || '#ccc',
      angleDegrees,
      value: item.value,
      count: item.count,
    };
  });

  // Helper to convert angle to radians
  const toRadians = (angle: number) => ((angle - 90) * Math.PI) / 180;

  // Function to create a donut segment with properly integrated rounded corners
  const createSegmentPath = (startAngleDeg: number, endAngleDeg: number): string => {
    const startAngle = toRadians(startAngleDeg);
    const endAngle = toRadians(endAngleDeg);

    // Determine if this is a large arc
    const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

    // Calculate how much angle the corner radius takes up
    // We need to inset the path by the corner radius
    const angleInsetOuter = cornerRadius / outerRadius;
    const angleInsetInner = cornerRadius / innerRadius;

    // Adjusted angles - inset from the true corners
    const startAngleOuterInset = startAngle + angleInsetOuter;
    const endAngleOuterInset = endAngle - angleInsetOuter;
    const startAngleInnerInset = startAngle + angleInsetInner;
    const endAngleInnerInset = endAngle - angleInsetInner;

    // Main arc points (inset from corners)
    const ox1 = centerX + outerRadius * Math.cos(startAngleOuterInset);
    const oy1 = centerY + outerRadius * Math.sin(startAngleOuterInset);
    const ox2 = centerX + outerRadius * Math.cos(endAngleOuterInset);
    const oy2 = centerY + outerRadius * Math.sin(endAngleOuterInset);
    const ix1 = centerX + innerRadius * Math.cos(endAngleInnerInset);
    const iy1 = centerY + innerRadius * Math.sin(endAngleInnerInset);
    const ix2 = centerX + innerRadius * Math.cos(startAngleInnerInset);
    const iy2 = centerY + innerRadius * Math.sin(startAngleInnerInset);

    // Radial inset points (moved inward by cornerRadius along the radial direction)
    const startRadialOuterInsetR = outerRadius - cornerRadius;
    const startRadialInnerInsetR = innerRadius + cornerRadius;
    const endRadialOuterInsetR = outerRadius - cornerRadius;
    const endRadialInnerInsetR = innerRadius + cornerRadius;

    const rso_x = centerX + startRadialOuterInsetR * Math.cos(startAngle);
    const rso_y = centerY + startRadialOuterInsetR * Math.sin(startAngle);
    const rsi_x = centerX + startRadialInnerInsetR * Math.cos(startAngle);
    const rsi_y = centerY + startRadialInnerInsetR * Math.sin(startAngle);
    const reo_x = centerX + endRadialOuterInsetR * Math.cos(endAngle);
    const reo_y = centerY + endRadialOuterInsetR * Math.sin(endAngle);
    const rei_x = centerX + endRadialInnerInsetR * Math.cos(endAngle);
    const rei_y = centerY + endRadialInnerInsetR * Math.sin(endAngle);

    // Build path with rounded corners using small arc segments
    return `
      M ${ox1},${oy1}
      A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${ox2},${oy2}
      A ${cornerRadius},${cornerRadius} 0 0 1 ${reo_x},${reo_y}
      L ${rei_x},${rei_y}
      A ${cornerRadius},${cornerRadius} 0 0 1 ${ix1},${iy1}
      A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${ix2},${iy2}
      A ${cornerRadius},${cornerRadius} 0 0 1 ${rsi_x},${rsi_y}
      L ${rso_x},${rso_y}
      A ${cornerRadius},${cornerRadius} 0 0 1 ${ox1},${oy1}
      Z
    `.trim().replace(/\s+/g, ' ');
  };

  let currentAngle = 0;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {segments.map((segment, index) => {
          const startAngle = currentAngle;
          const endAngle = currentAngle + segment.angleDegrees;

          const pathData = createSegmentPath(startAngle, endAngle);

          // Move to next segment (add gap)
          currentAngle = endAngle + gapDegrees;

          return (
            <Path
              key={index}
              d={pathData}
              fill={segment.color}
            />
          );
        })}
      </Svg>
      <View
        style={{
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 56, fontWeight: 'bold', color: '#000' }}>
          {total}
        </Text>
      </View>
    </View>
  );
}
