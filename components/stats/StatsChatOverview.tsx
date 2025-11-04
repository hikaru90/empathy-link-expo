import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import baseColors from '@/baseColors.config';

interface Analysis {
  id: string;
  title: string;
  created: string;
}

interface StatsChatOverviewProps {
  data: Analysis[];
}

export default function StatsChatOverview({ data }: StatsChatOverviewProps) {
  const router = useRouter();

  const displayedData = data.slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Meine Reflektionen</Text>
            {data.length > 0 && (
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push('/analyses')}
              >
                <Text style={styles.seeAllText}>Alle anzeigen</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { width: '20%' }]}>Datum</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Titel</Text>
            <View style={{ width: '15%' }} />
          </View>
        </View>

        <View style={styles.body}>
          {displayedData.map((record, index) => (
            <TouchableOpacity
              key={record.id}
              style={[
                styles.row,
                index === displayedData.length - 1 && styles.lastRow,
              ]}
              onPress={() => router.push(`/analysis/${record.id}`)}
            >
              <Text style={[styles.cellText, { width: '20%' }]}>
                {formatDate(record.created)}
              </Text>
              <Text
                style={[styles.cellText, { flex: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {record.title}
              </Text>
              <View style={[styles.iconContainer, { width: '15%' }]}>
                <View style={styles.iconButton}>
                  <ChevronRight size={12} color="#000" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: baseColors.offwhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  seeAllText: {
    fontSize: 12,
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    color: '#666',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cellText: {
    fontSize: 12,
    color: '#000',
  },
  iconContainer: {
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
