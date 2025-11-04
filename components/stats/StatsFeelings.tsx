import baseColors from '@/baseColors.config';
import { Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateRangePicker from './DateRangePicker';
import DonutChart from './DonutChart';

interface FeelingsData {
  value: string;
  count: number;
}

interface StatsFeelingsProps {
  data: FeelingsData[];
  rawAnalyses?: any[];
}

const timeframeOptions = [
  { value: 'today', label: 'Heute' },
  { value: 'lastWeek', label: 'Letzte Woche' },
  { value: 'lastMonth', label: 'Letzter Monat' },
  { value: 'lastYear', label: 'Letztes Jahr' },
];

export default function StatsFeelings({ data, rawAnalyses }: StatsFeelingsProps) {
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

  const filteredData = React.useMemo(() => {
    if (!rawAnalyses || rawAnalyses.length === 0) return [];

    const startDate = getDateFilter(selectedTimeframe);

    const filteredAnalyses = rawAnalyses.filter((analysis) => {
      if (!analysis.created) return false;
      const analysisDate = new Date(analysis.created);
      return analysisDate >= startDate;
    });

    const feelings = filteredAnalyses
      .map((analysis) => analysis.feelings)
      .filter(Boolean);
    const res = feelings.flat();

    const grouped = res.reduce((acc: { [key: string]: string[] }, feeling: string) => {
      if (feeling) { // Ensure feeling is not empty
        (acc[feeling] = acc[feeling] || []).push(feeling);
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
            <View style={styles.iconContainer}>
              <Heart size={14} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.title}>Gefühle</Text>
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
            <Text style={styles.emptyText}>Keine Gefühle gefunden</Text>
          ) : (
            <>
              {displayedData.map((feeling, index) => (
                <View
                  key={`${feeling.value}-${index}`}
                  style={[styles.listItem, index === 0 && styles.firstListItem]}
                >
                  <View style={styles.listItemLeft}>
                    <View
                      style={[styles.colorDot, { backgroundColor: legendColors[filteredData.indexOf(feeling)] }]}
                    />
                    <Text style={styles.listItemText}>{feeling.value}</Text>
                  </View>
                  <Text style={styles.listItemCount}>{feeling.count}</Text>
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
    backgroundColor: baseColors.offwhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    zIndex: 10,
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
    backgroundColor: '#c084fc',
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#000',
  },
});
