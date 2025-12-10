import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface DonutChartProps {
  data: Array<{ value: string; count: number }>;
  colors?: string[]; // Made optional since we'll use default colors
  showPercentage?: boolean; // Option to show percentage instead of total
  completedCount?: number; // For calculating percentage when showPercentage is true
  totalCount?: number; // For calculating percentage when showPercentage is true
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

// Generate extended color array with progressively reduced opacity
const generateColorArray = (baseColors: string[], count: number): string[] => {
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const colorIndex = i % baseColors.length;
    const color = baseColors[colorIndex];
    const cycle = Math.floor(i / baseColors.length);

    // Progressive opacity dropoff for each cycle - more pronounced
    if (cycle === 0) {
      // First cycle: 100% opacity (original colors)
      colors.push(color);
    } else if (cycle === 1) {
      // Second cycle: 50% opacity
      colors.push(`${color}80`); // 80 in hex = 50% opacity
    } else if (cycle === 2) {
      // Third cycle: 30% opacity
      colors.push(`${color}4D`); // 4D in hex = 30% opacity
    } else {
      // Fourth cycle and beyond: 15% opacity
      colors.push(`${color}26`); // 26 in hex = 15% opacity
    }
  }

  return colors;
};

export default function DonutChart({ 
  data, 
  colors, 
  size = 160,
  showPercentage = false,
  completedCount,
  totalCount
}: DonutChartProps & { size?: number }) {
  const ringThickness = size * 0.12; // Scale thickness relative to size
  const centerX = size / 2;
  const centerY = size / 2;

  // Define the middle radius (center of the ring)
  const radius = (size - ringThickness) / 2;
  const outerRadius = radius + ringThickness / 2;
  const innerRadius = radius - ringThickness / 2;

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
          <Text style={{ fontSize: size * 0.22, fontWeight: 'bold', color: '#999' }}>
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

    // Calculate the arc length of the segment
    const segmentAngleRad = (endAngleDeg - startAngleDeg) * Math.PI / 180;
    const outerArcLength = segmentAngleRad * outerRadius;
    const innerArcLength = segmentAngleRad * innerRadius;
    const radialLength = ringThickness;

    // Calculate radius for each of the 4 corners based purely on geometry
    // Each corner is limited by its two adjacent edges
    // Since there are 2 corners per edge, each corner can use at most half the edge length

    // For the outer arc: both corners share it, so each gets half
    const maxFromOuterArc = outerArcLength / 2;
    // For the inner arc: both corners share it, so each gets half
    const maxFromInnerArc = innerArcLength / 2;
    // For radial edges: each edge has 2 corners, so each gets half
    const maxFromRadial = radialLength / 2;

    // Each corner takes the minimum of its two adjacent edges
    // Start-Outer corner: limited by outer arc and start radial edge
    const r1 = Math.min(maxFromOuterArc, maxFromRadial);
    // End-Outer corner: limited by outer arc and end radial edge
    const r2 = Math.min(maxFromOuterArc, maxFromRadial);
    // End-Inner corner: limited by inner arc and end radial edge
    const r3 = Math.min(maxFromInnerArc, maxFromRadial);
    // Start-Inner corner: limited by inner arc and start radial edge
    const r4 = Math.min(maxFromInnerArc, maxFromRadial);

    // If all radii are too small, skip rounding
    if (Math.max(r1, r2, r3, r4) < 1) {
      const x1 = centerX + outerRadius * Math.cos(startAngle);
      const y1 = centerY + outerRadius * Math.sin(startAngle);
      const x2 = centerX + outerRadius * Math.cos(endAngle);
      const y2 = centerY + outerRadius * Math.sin(endAngle);
      const x3 = centerX + innerRadius * Math.cos(endAngle);
      const y3 = centerY + innerRadius * Math.sin(endAngle);
      const x4 = centerX + innerRadius * Math.cos(startAngle);
      const y4 = centerY + innerRadius * Math.sin(startAngle);

      return `M ${x1},${y1} A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x4},${y4} Z`;
    }

    // Calculate how much angle each corner radius takes up
    // We need to inset the path by the corner radius at each point
    const angleInsetOuterStart = r1 / outerRadius;
    const angleInsetOuterEnd = r2 / outerRadius;
    const angleInsetInnerStart = r4 / innerRadius;
    const angleInsetInnerEnd = r3 / innerRadius;

    // Adjusted angles - inset from the true corners
    const startAngleOuterInset = startAngle + angleInsetOuterStart;
    const endAngleOuterInset = endAngle - angleInsetOuterEnd;
    const startAngleInnerInset = startAngle + angleInsetInnerStart;
    const endAngleInnerInset = endAngle - angleInsetInnerEnd;

    // Main arc points (inset from corners)
    const ox1 = centerX + outerRadius * Math.cos(startAngleOuterInset);
    const oy1 = centerY + outerRadius * Math.sin(startAngleOuterInset);
    const ox2 = centerX + outerRadius * Math.cos(endAngleOuterInset);
    const oy2 = centerY + outerRadius * Math.sin(endAngleOuterInset);
    const ix1 = centerX + innerRadius * Math.cos(endAngleInnerInset);
    const iy1 = centerY + innerRadius * Math.sin(endAngleInnerInset);
    const ix2 = centerX + innerRadius * Math.cos(startAngleInnerInset);
    const iy2 = centerY + innerRadius * Math.sin(startAngleInnerInset);

    // Radial inset points (moved inward by corner radius along the radial direction)
    const startRadialOuterInsetR = outerRadius - r1;
    const startRadialInnerInsetR = innerRadius + r4;
    const endRadialOuterInsetR = outerRadius - r2;
    const endRadialInnerInsetR = innerRadius + r3;

    const rso_x = centerX + startRadialOuterInsetR * Math.cos(startAngle);
    const rso_y = centerY + startRadialOuterInsetR * Math.sin(startAngle);
    const rsi_x = centerX + startRadialInnerInsetR * Math.cos(startAngle);
    const rsi_y = centerY + startRadialInnerInsetR * Math.sin(startAngle);
    const reo_x = centerX + endRadialOuterInsetR * Math.cos(endAngle);
    const reo_y = centerY + endRadialOuterInsetR * Math.sin(endAngle);
    const rei_x = centerX + endRadialInnerInsetR * Math.cos(endAngle);
    const rei_y = centerY + endRadialInnerInsetR * Math.sin(endAngle);

    // Build path with rounded corners using small arc segments
    // Each corner uses its individually calculated radius
    return `
      M ${ox1},${oy1}
      A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${ox2},${oy2}
      A ${r2},${r2} 0 0 1 ${reo_x},${reo_y}
      L ${rei_x},${rei_y}
      A ${r3},${r3} 0 0 1 ${ix1},${iy1}
      A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${ix2},${iy2}
      A ${r4},${r4} 0 0 1 ${rsi_x},${rsi_y}
      L ${rso_x},${rso_y}
      A ${r1},${r1} 0 0 1 ${ox1},${oy1}
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
        <Text style={{ fontSize: size * 0.22, fontWeight: 'bold', color: '#000' }}>
          {showPercentage && completedCount !== undefined && totalCount !== undefined && totalCount > 0
            ? `${Math.round((completedCount / totalCount) * 100)}%`
            : total}
        </Text>
      </View>
    </View>
  );
}
