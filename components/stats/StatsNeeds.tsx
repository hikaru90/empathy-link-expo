import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import DonutChart from './DonutChart';
import DateRangePicker from './DateRangePicker';

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

// Generate colors for the chart
const generateColors = (count: number): string[] => {
  const baseColorsArray = [
    '#f43f5e', // rose
    '#c084fc', // lilac
    '#000000', // black
    '#10b981', // forest/green
    '#f97316', // orange
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColorsArray[i % baseColorsArray.length]);
  }
  return colors;
};

export default function StatsNeeds({ data, rawAnalyses }: StatsNeedsProps) {
  const [showMore, setShowMore] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('lastWeek');

  const getDateFilter = (timeframe: string) => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'lastWeek':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(0);
    }

    return startDate;
  };

  const filteredData = React.useMemo(() => {
    if (!rawAnalyses) return data || [];

    const startDate = getDateFilter(selectedTimeframe);
    const filteredAnalyses = rawAnalyses.filter((analysis) => {
      const analysisDate = new Date(analysis.created);
      return analysisDate >= startDate;
    });

    const needs = filteredAnalyses.map((analysis) => analysis.needs).filter(Boolean);
    const res = needs.flat();
    const grouped = res.reduce((acc: { [key: string]: string[] }, need: string) => {
      (acc[need] = acc[need] || []).push(need);
      return acc;
    }, {});
    const countArray = Object.entries(grouped).map(([value, arr]) => ({
      value,
      count: arr.length,
    }));
    countArray.sort((a, b) => b.count - a.count);
    return countArray;
  }, [rawAnalyses, selectedTimeframe, data]);

  const colors = generateColors(filteredData.length);
  const displayedData = showMore ? filteredData : filteredData.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <Sparkles size={14} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.title}>Bedürfnisse</Text>
          </View>
          <DateRangePicker
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
        </View>

        <View style={styles.chartContainer}>
          <DonutChart data={filteredData} colors={colors} />
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
                      style={[styles.colorDot, { backgroundColor: colors[index] }]}
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
    backgroundColor: '#f5f5f5',
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#000',
  },
});
