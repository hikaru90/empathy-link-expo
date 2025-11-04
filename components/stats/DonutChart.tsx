import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface DonutChartProps {
  data: Array<{ value: string; count: number }>;
  colors?: string[]; // Made optional since we'll use default colors
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
  const midRadius = (size - ringThickness) / 2;
  const outerRadius = midRadius + ringThickness / 2;
  const innerRadius = midRadius - ringThickness / 2;

  // Gap between segments in degrees
  const gapDegrees = 2;

  // Handle empty state
  if (data.length === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={centerX}
            cy={centerY}
            r={midRadius}
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
  const segments = data.map((item, index) => {
    const percentage = item.count / total;
    const angleDegrees = percentage * availableDegrees;

    return {
      color: chartColors[index] || '#ccc',
      angleDegrees,
      value: item.value,
      count: item.count,
    };
  });

  // Function to create a rounded donut segment path
  const createSegmentPath = (
    startAngleDeg: number,
    endAngleDeg: number,
    borderRadius: number
  ): string => {
    // Convert to radians
    const startAngle = (startAngleDeg - 90) * (Math.PI / 180);
    const endAngle = (endAngleDeg - 90) * (Math.PI / 180);

    // Calculate the actual arc length to determine if we need to reduce border radius
    const arcLength = ((endAngleDeg - startAngleDeg) * Math.PI / 180) * midRadius;
    const maxBorderRadius = Math.min(borderRadius, arcLength / 2, ringThickness / 2);

    // Outer arc points
    const outerStartX = centerX + outerRadius * Math.cos(startAngle);
    const outerStartY = centerY + outerRadius * Math.sin(startAngle);
    const outerEndX = centerX + outerRadius * Math.cos(endAngle);
    const outerEndY = centerY + outerRadius * Math.sin(endAngle);

    // Inner arc points
    const innerStartX = centerX + innerRadius * Math.cos(startAngle);
    const innerStartY = centerY + innerRadius * Math.sin(startAngle);
    const innerEndX = centerX + innerRadius * Math.cos(endAngle);
    const innerEndY = centerY + innerRadius * Math.sin(endAngle);

    // Determine if we need a large arc flag
    const largeArcFlag = (endAngleDeg - startAngleDeg) > 180 ? 1 : 0;

    // If border radius is very small or zero, use simple path
    if (maxBorderRadius < 0.5) {
      return `
        M ${outerStartX} ${outerStartY}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
        L ${innerEndX} ${innerEndY}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
        Z
      `.trim().replace(/\s+/g, ' ');
    }

    // Calculate offset for border radius on the arcs
    const outerOffsetAngle = (maxBorderRadius / outerRadius);
    const innerOffsetAngle = (maxBorderRadius / innerRadius);

    // Adjusted angles for rounded corners
    const outerStartAngleAdj = startAngle + outerOffsetAngle;
    const outerEndAngleAdj = endAngle - outerOffsetAngle;
    const innerStartAngleAdj = startAngle + innerOffsetAngle;
    const innerEndAngleAdj = endAngle - innerOffsetAngle;

    // Adjusted outer arc points
    const outerStartXAdj = centerX + outerRadius * Math.cos(outerStartAngleAdj);
    const outerStartYAdj = centerY + outerRadius * Math.sin(outerStartAngleAdj);
    const outerEndXAdj = centerX + outerRadius * Math.cos(outerEndAngleAdj);
    const outerEndYAdj = centerY + outerRadius * Math.sin(outerEndAngleAdj);

    // Adjusted inner arc points
    const innerStartXAdj = centerX + innerRadius * Math.cos(innerStartAngleAdj);
    const innerStartYAdj = centerY + innerRadius * Math.sin(innerStartAngleAdj);
    const innerEndXAdj = centerX + innerRadius * Math.cos(innerEndAngleAdj);
    const innerEndYAdj = centerY + innerRadius * Math.sin(innerEndAngleAdj);

    // Calculate the radial direction vectors for the corners
    const startRadialX = Math.cos(startAngle);
    const startRadialY = Math.sin(startAngle);
    const endRadialX = Math.cos(endAngle);
    const endRadialY = Math.sin(endAngle);

    // Corner centers (for the rounded corners)
    const startOuterCornerX = centerX + (outerRadius - maxBorderRadius) * startRadialX;
    const startOuterCornerY = centerY + (outerRadius - maxBorderRadius) * startRadialY;
    const startInnerCornerX = centerX + (innerRadius + maxBorderRadius) * startRadialX;
    const startInnerCornerY = centerY + (innerRadius + maxBorderRadius) * startRadialY;

    const endOuterCornerX = centerX + (outerRadius - maxBorderRadius) * endRadialX;
    const endOuterCornerY = centerY + (outerRadius - maxBorderRadius) * endRadialY;
    const endInnerCornerX = centerX + (innerRadius + maxBorderRadius) * endRadialX;
    const endInnerCornerY = centerY + (innerRadius + maxBorderRadius) * endRadialY;

    // Build path with rounded corners
    return `
      M ${outerStartXAdj} ${outerStartYAdj}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndXAdj} ${outerEndYAdj}
      A ${maxBorderRadius} ${maxBorderRadius} 0 0 1 ${innerEndXAdj} ${innerEndYAdj}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartXAdj} ${innerStartYAdj}
      A ${maxBorderRadius} ${maxBorderRadius} 0 0 1 ${outerStartXAdj} ${outerStartYAdj}
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

          // Calculate border radius based on segment size
          // Full border radius for segments with enough space
          const fullBorderRadius = 8;
          const minSegmentDegreesForFullRadius = 15;

          let borderRadius: number;
          if (segment.angleDegrees >= minSegmentDegreesForFullRadius) {
            borderRadius = fullBorderRadius;
          } else {
            // Scale down border radius proportionally for smaller segments
            borderRadius = (segment.angleDegrees / minSegmentDegreesForFullRadius) * fullBorderRadius;
          }

          const pathData = createSegmentPath(startAngle, endAngle, borderRadius);

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
