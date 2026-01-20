import baseColors from '@/baseColors.config';
import { NeedTimeseriesData } from '@/lib/api/stats';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

interface NeedsLineChartProps {
  trackedNeeds: Array<{
    id: string;
    needId: string;
    needName: string;
  }>;
  timeseriesData: Record<string, NeedTimeseriesData[]>;
  selectedNeedId: string | null;
  onNeedPress: (needId: string) => void;
  currentFillLevels: Record<string, number | null>;
  height?: number;
}

export default function NeedsLineChart({
  trackedNeeds,
  timeseriesData,
  selectedNeedId,
  onNeedPress,
  currentFillLevels,
  height = 200,
}: NeedsLineChartProps) {
  if (trackedNeeds.length === 0) {
    return null;
  }

  const chartPadding = { top: 20, right: 40, bottom: 40, left: 8 };
  // Use full width minus padding
  const chartWidth = '100%';
  const chartHeight = height;
  // For calculations, use a reference width (will be scaled)
  const refWidth = 300;
  const plotWidth = refWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Collect all dates from all timeseries
  // Normalize dates to start of day to ensure same-day entries are grouped together
  const normalizeDateToDay = (date: Date): number => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    normalized.setMinutes(0, 0, 0);
    normalized.setSeconds(0, 0);
    normalized.setMilliseconds(0);
    return normalized.getTime();
  };

  const allDates = new Set<number>();
  trackedNeeds.forEach((need) => {
    const data = timeseriesData[need.id] || [];
    data.forEach((item) => {
      // Normalize to start of day to group same-day entries
      const date = new Date(item.date);
      allDates.add(normalizeDateToDay(date));
    });
  });

  const sortedDates = Array.from(allDates).sort((a, b) => a - b);

  // Check if there's any data for any tracked need
  const hasAnyData = trackedNeeds.some((need) => {
    const data = timeseriesData[need.id] || [];
    return data.length > 0;
  });

  if (!hasAnyData || sortedDates.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-sm text-gray-400 text-center mb-1">
          Noch keine Daten vorhanden
        </Text>
        <Text className="text-xs text-gray-400 text-center">
          Fülle deine Schalen, um den Verlauf zu sehen
        </Text>
      </View>
    );
  }

  // Normalize dates to 0-1 range
  const dateRange = sortedDates[sortedDates.length - 1] - sortedDates[0];
  const normalizeX = (date: number) => {
    if (dateRange === 0) return 0;
    return (date - sortedDates[0]) / dateRange;
  };

  // Normalize fill levels to 0-1 range (0-100%)
  const normalizeY = (fillLevel: number) => {
    return fillLevel / 100;
  };

  // Use first three colors from defaultColors array in StatsNeeds
  const defaultColors = [
    { line: baseColors.forest, point: baseColors.black },
    { line: baseColors.emerald, point: '#258490' },
    { line: baseColors.lilac, point: baseColors.purple },
  ];

  // Generate colors for each need based on index
  const getNeedColor = (needIndex: number) => {
    return defaultColors[needIndex % defaultColors.length];
  };

  // Generate path with horizontal segments near vertices and curves only in the middle
  const generateSmoothPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      const dx = next.x - current.x;
      const dy = next.y - current.y;

      // Define the flat sections (35% from each vertex - smaller transition area)
      const flatSection = 0.35;

      // Start of curve section (35% from current point)
      const curveStartX = current.x + dx * flatSection;
      const curveStartY = current.y; // Horizontal from current point

      // End of curve section (65% from current point, 35% from next point)
      const curveEndX = current.x + dx * (1 - flatSection);
      const curveEndY = next.y; // Horizontal to next point

      // Calculate the transition area (30% of total distance)
      const transitionWidth = curveEndX - curveStartX;
      const transitionHeight = curveEndY - curveStartY;

      // Control points positioned to create smooth curve without overshooting
      // Keep control points close to the horizontal lines for smooth connection
      const cp1x = curveStartX + transitionWidth * 0.33;
      const cp1y = curveStartY; // Start horizontal
      const cp2x = curveStartX + transitionWidth * 0.67;
      const cp2y = curveEndY; // End horizontal

      // Draw horizontal line to start of curve
      path += ` L ${curveStartX} ${curveStartY}`;

      // Draw curve in the middle section - smooth transition without overshooting
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curveEndX} ${curveEndY}`;

      // Draw horizontal line to next point
      path += ` L ${next.x} ${next.y}`;
    }

    return path;
  };

  return (
    <View className="w-full">
      <View className="items-center mb-4" style={{ width: '100%' }}>
        <View style={{ width: '100%', aspectRatio: refWidth / chartHeight }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${refWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = chartPadding.top + (1 - normalizeY(level)) * plotHeight;
              return (
                <Line
                  key={`grid-${level}`}
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartPadding.left + plotWidth}
                  y2={y}
                  stroke={baseColors.black + '11'}
                  strokeWidth="1"
                />
              );
            })}

            {/* Y-axis labels - on the right side, outside plot area */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = chartPadding.top + (1 - normalizeY(level)) * plotHeight;
              return (
                <SvgText
                  key={`label-${level}`}
                  x={chartPadding.left + plotWidth + 10}
                  y={y + 4}
                  fontSize="10"
                  fill="#666"
                  textAnchor="start"
                >
                  {level}%
                </SvgText>
              );
            })}

            {/* Draw lines for each tracked need - reversed so first need appears on top */}
            {[...trackedNeeds].reverse().map((need, reversedIndex) => {
              const data = timeseriesData[need.id] || [];
              if (data.length === 0) return null;

              // Calculate original index for color assignment
              const needIndex = trackedNeeds.length - 1 - reversedIndex;
              const isSelected = selectedNeedId === need.id;
              const colors = getNeedColor(needIndex);
              const opacity = selectedNeedId === null || isSelected ? 1 : 0.3;
              const strokeWidth = 14; // Same thickness for all lines

              // Sort data by date
              const sortedData = [...data].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );

              // Create points - normalize dates to start of day for x-position
              const points = sortedData.map((item) => {
                const date = new Date(item.date);
                const normalizedDate = normalizeDateToDay(date);
                const x = chartPadding.left + normalizeX(normalizedDate) * plotWidth;
                const y = chartPadding.top + (1 - normalizeY(item.fillLevel)) * plotHeight;
                return { x, y };
              });

              // Generate smooth curved path
              const pathData = generateSmoothPath(points);

              return (
                <React.Fragment key={need.id}>
                  {/* Smooth curved line */}
                  {points.length > 1 && (
                    <Path
                      d={pathData}
                      fill="none"
                      stroke={colors.line}
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* Data points - larger circles */}
                  {points.map((point, idx) => (
                    <Circle
                      key={`point-${need.id}-${idx}`}
                      cx={point.x}
                      cy={point.y}
                      r={7}
                      fill={colors.point}
                      opacity={opacity}
                    />
                  ))}
                </React.Fragment>
              );
            })}

            {/* X-axis - removed for cleaner look */}
            {/* Y-axis - removed for cleaner look */}

            {/* X-axis labels - ensure no overlap */}
            {(() => {
              const labels: Array<{ x: number; date: Date; idx: number }> = [];
              const minSpacing = 50; // Minimum spacing in pixels (scaled to refWidth)
              let lastLabelX = -Infinity;

              if (sortedDates.length === 0) return null;

              // Always show first label
              const firstX = chartPadding.left + normalizeX(sortedDates[0]) * plotWidth;
              labels.push({ x: firstX, date: new Date(sortedDates[0]), idx: 0 });
              lastLabelX = firstX;

              // Add intermediate labels with proper spacing
              for (let idx = 1; idx < sortedDates.length - 1; idx++) {
                const x = chartPadding.left + normalizeX(sortedDates[idx]) * plotWidth;
                // Only add if there's enough space from the last label
                if (x - lastLabelX >= minSpacing) {
                  labels.push({ x, date: new Date(sortedDates[idx]), idx });
                  lastLabelX = x;
                }
              }

              // Add last label only if there's enough space from the previous label
              if (sortedDates.length > 1) {
                const lastX = chartPadding.left + normalizeX(sortedDates[sortedDates.length - 1]) * plotWidth;
                if (lastX - lastLabelX >= minSpacing) {
                  labels.push({ x: lastX, date: new Date(sortedDates[sortedDates.length - 1]), idx: sortedDates.length - 1 });
                }
              }

              return labels.map(({ x, date, idx }) => (
                <SvgText
                  key={`xlabel-${idx}`}
                  x={x}
                  y={chartPadding.top + plotHeight + 20}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                >
                  {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </SvgText>
              ));
            })()}
          </Svg>
        </View>
      </View>

      {/* Legend */}
      <View className="gap-2 px-1">
        {trackedNeeds.map((need, needIndex) => {
          const isSelected = selectedNeedId === need.id;
          const data = timeseriesData[need.id] || [];

          // Calculate average from timeseries data
          const average = data.length > 0
            ? data.reduce((sum, item) => sum + item.fillLevel, 0) / data.length
            : null;

          const colors = getNeedColor(needIndex);
          const opacity = selectedNeedId === null || isSelected ? 1 : 0.3;

          return (
            <TouchableOpacity
              key={need.id}
              onPress={() => onNeedPress(need.id)}
              className="flex-row items-center justify-between border-b border-black/10 pb-1 last:border-b-0 w-full"
              style={{ opacity }}
            >
              <View className="flex-row items-center gap-2 flex-shrink">
                <View
                  className="rounded-full"
                  style={{
                    backgroundColor: colors.line, width: 20,
                    height: 12,
                    borderRadius: 6,
                  }}
                />
                <Text className={`text-sm ${isSelected ? 'font-semibold' : 'font-normal'} text-black whitespace-nowrap overflow-hidden text-ellipsis`}>
                  {need.needName}
                </Text>
              </View>
              {average !== null && (
                <View className="flex-row items-center flex-shrink-0 overflow-hidden rounded-full relative gap-1 px-2 bg-red-200">
                  <ImageBackground
                    source={require('@/assets/images/background-lilac.png')}
                    resizeMode="cover"
                    style={{ zIndex: -1, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  >
                  </ImageBackground>
                  <View className="px-3 py-1.5 rounded-full">
                    <Text className="text-xs font-medium text-black">
                      Ø {Math.round(average)}%
                    </Text>
                  </View>
                  <View className="rounded-full bg-white/20 flex items-center justify-center" >
                    <ChevronRight size={16} color="#666" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
