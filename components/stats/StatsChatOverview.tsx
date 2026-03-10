import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
      <View
        style={{
          borderRadius: 16,
          backgroundColor: baseColors.offwhite,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          overflow: 'hidden',
        }} 
        className="border border-white"
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
              Meine Reflektionen
            </Text>
            {data.length > 0 && (
              <TouchableOpacity
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                }}
                onPress={() => router.push('/analyses')}
              >
                <Text className="text-xs text-black">Alle anzeigen</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#666', width: '20%' }}>
              Datum
            </Text>
            <Text style={{ fontSize: 10, color: '#666', flex: 1 }}>Titel</Text>
            <View style={{ width: '15%' }} />
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          {displayedData.map((record, index) => (
            <TouchableOpacity
              key={record.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: index === displayedData.length - 1 ? 0 : 1,
                borderBottomColor: 'rgba(0, 0, 0, 0.05)',
              }}
              onPress={() => router.push(`/analysis/${record.id}`)}
            >
              <Text style={{ fontSize: 12, color: '#000', width: '20%' }}>
                {formatDate(record.created)}
              </Text>
              <Text
                style={{ fontSize: 12, color: '#000', flex: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {record.title}
              </Text>
              <View style={{ alignItems: 'flex-end', width: '15%' }}>
                <View
                  style={{
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
                  }}
                >
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
