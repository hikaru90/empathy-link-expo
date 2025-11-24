import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import baseColors from '@/baseColors.config';
import GradientImage from '@/components/GradientImage';
import Header from '@/components/Header';
import StatsBlindSpots from '@/components/stats/StatsBlindSpots';
import StatsChatOverview from '@/components/stats/StatsChatOverview';
import StatsConflictResolution from '@/components/stats/StatsConflictResolution';
import StatsFeelings from '@/components/stats/StatsFeelings';
import StatsInspiration from '@/components/stats/StatsInspiration';
import StatsNeeds from '@/components/stats/StatsNeeds';
import StatsTrackedNeeds from '@/components/stats/StatsTrackedNeeds';
import { useAuthGuard } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';

interface Analysis {
  id: string;
  title: string;
  created: string;
  feelings?: string[];
  needs?: string[];
  request?: string;
}

interface Memory {
  id: string;
  type: string;
  key: string;
  value: string;
  confidence: 'certain' | 'likely' | 'uncertain';
}

interface StatsData {
  analyses: Analysis[];
  memories: Memory[];
}

// Removed menu tabs - now showing only overview content

export default function StatsScreen() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchStatsData();
    }
  }, [user]);

  const fetchStatsData = async () => {
    try {
      setLoadingData(true);
      console.log('Fetching stats with auth...');

      // Use Better Auth's $fetch which returns {data, error} format
      const result = await authClient.$fetch(`${API_BASE_URL}/api/stats`, {
        method: 'GET',
      });

      console.log('Stats response received:', result);

      // Better Auth returns {data: ..., error: ...}
      if ((result as any).error) {
        console.error('Stats error:', (result as any).error);
        const errorMessage = typeof (result as any).error === 'string'
          ? (result as any).error
          : (result as any).error?.message || 'Unknown error';
        throw new Error(errorMessage);
      }

      const data = (result as any).data as StatsData;
      console.log('Stats data received:', {
        analysesCount: data.analyses?.length || 0,
        memoriesCount: data.memories?.length || 0,
        sampleAnalysis: data.analyses?.[0],
      });

      setStatsData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Fehler beim Laden der Statistiken');
      // Set mock data for development
      setStatsData({
        analyses: [],
        memories: [],
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getFeelings = () => {
    console.log('getFeelings called, statsData:', statsData);

    if (!statsData?.analyses) {
      console.log('No analyses data available');
      return [];
    }

    console.log('Number of analyses:', statsData.analyses.length);

    // Extract all feelings from analyses
    const feelings = statsData.analyses
      .map((analysis) => {
        console.log('Analysis feelings:', analysis.feelings);
        return analysis.feelings || [];
      })
      .filter((f) => Array.isArray(f)); // Ensure it's an array

    console.log('Extracted feelings arrays:', feelings);

    const res = feelings.flat();

    // Group and count feelings
    const grouped = res.reduce((acc: { [key: string]: string[] }, feeling: string) => {
      if (feeling) { // Ensure feeling is not empty
        (acc[feeling] = acc[feeling] || []).push(feeling);
      }
      return acc;
    }, {});

    const countArray = Object.entries(grouped).map(([value, arr]) => ({
      value,
      count: arr.length,
    }));

    countArray.sort((a, b) => b.count - a.count);

    return countArray;
  };

  const getNeeds = () => {
    if (!statsData?.analyses) return [];

    // Extract all needs from analyses
    const needs = statsData.analyses
      .map((analysis) => analysis.needs || [])
      .filter((n) => Array.isArray(n)); // Ensure it's an array

    const res = needs.flat();

    // Group and count needs
    const grouped = res.reduce((acc: { [key: string]: string[] }, need: string) => {
      if (need) { // Ensure need is not empty
        (acc[need] = acc[need] || []).push(need);
      }
      return acc;
    }, {});

    const countArray = Object.entries(grouped).map(([value, arr]) => ({
      value,
      count: arr.length,
    }));

    countArray.sort((a, b) => b.count - a.count);

    return countArray;
  };

  const getRequests = () => {
    if (!statsData?.analyses) return [];

    // Extract all analyses with requests
    return statsData.analyses
      .filter((analysis) => analysis.request && analysis.request.trim().length > 0)
      .map((analysis) => ({
        id: analysis.id,
        analysisId: analysis.id,
        request: analysis.request!,
        title: analysis.title,
        created: analysis.created,
      }));
  };


  if (isLoading || loadingData) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <Header />
        <View className="flex-1 justify-center items-center -mt-6">
          <GradientImage style={{ width: 40, height: 20, borderRadius: 16 }} fast />
          <Text className="text-gray-600 mt-2">Loading...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {/* Content */}
            <View style={styles.contentContainer}>
              <View style={styles.section}>

                <StatsInspiration />

                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <Text style={styles.sectionTitle}>Deine häufigsten Gefühle</Text>
                  <Text style={styles.sectionDescription}>
                    Diese Gefühle sind in deinen Reflexionen aufgetaucht. Je öfter du sie benennst, desto bewusster wirst du dir deiner emotionalen Muster.
                  </Text>
                </View>
                <StatsFeelings data={getFeelings()} rawAnalyses={statsData?.analyses} />

                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <Text style={styles.sectionTitle}>Bedürfnisse</Text>
                  <Text style={styles.sectionDescription}>
                    Diese Bedürfnisse haben sich in deinen Gesprächen gezeigt. Sie zu kennen hilft dir, bewusstere Entscheidungen zu treffen und besser für dich zu sorgen.
                  </Text>
                </View>
                <StatsNeeds data={getNeeds()} rawAnalyses={statsData?.analyses} />

                <StatsTrackedNeeds />

                <View style={[styles.sectionHeader, { marginTop: 0 }]}>
                  <Text style={styles.sectionTitle}>Wiederkehrende Muster</Text>
                  <Text style={styles.sectionDescription}>
                    Erkenne Blind Spots und wiederkehrende Muster in deinen Gesprächen. In welchen Situationen treten sie auf?
                  </Text>
                </View>
                <StatsBlindSpots />

                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <Text style={styles.sectionTitle}>Konfliktlösung</Text>
                  <Text style={styles.sectionDescription}>
                    Verfolge deine Bitten und markiere gelöste Konflikte als erledigt.
                  </Text>
                </View>
                <StatsConflictResolution requests={getRequests()} />


                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <Text style={styles.sectionTitle}>Deine Reflektionen im Überblick</Text>
                  <Text style={styles.sectionDescription}>
                    Jedes Gespräch ist ein Schritt zu mehr Klarheit. Entdecke hier deine Entwicklung und gewonnene Einsichten.
                  </Text>
                </View>
                {statsData?.analyses && <StatsChatOverview data={statsData.analyses} />}


              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? 80 : 120, // Account for floating header
    paddingBottom: 64,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
});