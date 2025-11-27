import baseColors from '@/baseColors.config';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateRangePicker from './DateRangePicker';
import DonutChart from './DonutChart';

interface NeedsData {
  value: string;
  count: number;
}

interface StatsNeedsProps {
  data: NeedsData[];
  rawAnalyses?: any[];
}

const timeframeOptions = [
  { value: 'today', label: 'Heute' },
  { value: 'lastWeek', label: 'Letzte Woche' },
  { value: 'lastMonth', label: 'Letzter Monat' },
  { value: 'lastYear', label: 'Letztes Jahr' },
];

export default function StatsNeeds({ data, rawAnalyses }: StatsNeedsProps) {
  const [showMore, setShowMore] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('lastWeek');

  const getDateFilter = (timeframe: string) => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'dayBeforeYesterday':
        const dayBeforeYesterday = new Date(now);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        startDate = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastWeek':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastMonth':
        // Use first day of last month to avoid date overflow issues
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastYear':
        // Use first day of the same month last year to avoid date overflow issues
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(0);
    }

    return startDate;
  };

  const filteredData = useMemo(() => {
    if (!rawAnalyses || rawAnalyses.length === 0) return [];

    const startDate = getDateFilter(selectedTimeframe);
    
    // For single-day filters, set end date to end of that day
    let endDate: Date | null = null;
    if (selectedTimeframe === 'today' || selectedTimeframe === 'yesterday' || selectedTimeframe === 'dayBeforeYesterday') {
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const filteredAnalyses = rawAnalyses.filter((analysis) => {
      if (!analysis.created) return false;
      const analysisDate = new Date(analysis.created);
      const isAfterStart = analysisDate >= startDate;
      const isBeforeEnd = endDate ? analysisDate <= endDate : true;
      return isAfterStart && isBeforeEnd;
    });

    const needs = filteredAnalyses.map((analysis) => analysis.needs).filter(Boolean);
    const res = needs.flat();
    const grouped = res.reduce((acc: { [key: string]: string[] }, need: string) => {
      if (need) { // Ensure need is not empty
        (acc[need] = acc[need] || []).push(need);
      }
      return acc;
    }, {});
    const countArray = Object.entries(grouped).map(([value, arr]) => ({
      value,
      count: (arr as string[]).length,
    }));
    countArray.sort((a, b) => b.count - a.count);
    return countArray;
  }, [rawAnalyses, selectedTimeframe]);

  const displayedData = showMore ? filteredData : filteredData.slice(0, 3);

  // Generate color array for legend to match DonutChart's default colors
  const defaultColors = [
    '#F0BADA', '#DB79AA', '#080638', '#17545A', '#D6BBFF', '#A366FF', '#FF9C34',
  ];
  const legendColors: string[] = [];
  for (let i = 0; i < filteredData.length; i++) {
    const colorIndex = i % defaultColors.length;
    if (i < defaultColors.length) {
      legendColors.push(defaultColors[colorIndex]);
    } else {
      legendColors.push(`${defaultColors[colorIndex]}80`);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bedürfnisse</Text>
          </View>
          <DateRangePicker
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
        </View>

        <View style={styles.chartContainer}>
          <DonutChart data={filteredData} />
        </View>

        <View style={styles.listContainer}>
          {filteredData.length === 0 ? (
            <Text style={styles.emptyText}>Keine Bedürfnisse gefunden</Text>
          ) : (
            <>
              {displayedData.map((need, index) => (
                <View
                  key={`${need.value}-${index}`}
                  style={[styles.listItem, index === 0 && styles.firstListItem]}
                >
                  <View style={styles.listItemLeft}>
                    <View
                      style={[styles.colorDot, { backgroundColor: legendColors[filteredData.indexOf(need)] }]}
                    />
                    <Text style={styles.listItemText}>{need.value}</Text>
                  </View>
                  <Text style={styles.listItemCount}>{need.count}</Text>
                </View>
              ))}
              <View style={styles.toggleButtonContainer}>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowMore(!showMore)}
                >
                  <Text style={styles.toggleButtonText}>
                    {showMore ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  card: {
    borderRadius: 16,
    backgroundColor: baseColors.offwhite+'90',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  firstListItem: {
    borderTopWidth: 0,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  colorDot: {
    width: 20,
    height: 12,
    borderRadius: 6,
  },
  listItemText: {
    fontSize: 14,
    color: '#000',
  },
  listItemCount: {
    fontSize: 14,
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  toggleButtonContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#000',
  },
});
