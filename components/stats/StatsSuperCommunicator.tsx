import baseColors from '@/baseColors.config';
import { Target, TrendingUp, Award } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface SuperCommunicatorData {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
  recentPoints?: Array<{
    date: string;
    points: number;
    source: 'chat' | 'learning' | 'resolution';
  }>;
}

interface StatsSuperCommunicatorProps {
  data: SuperCommunicatorData | null;
}

// Level definitions in German
const LEVELS = [
  { id: 1, name: 'Anfänger*in', minPoints: 0, maxPoints: 100, description: 'Du beginnst deine Reise' },
  { id: 2, name: 'Gefühlsscout', minPoints: 101, maxPoints: 250, description: 'Du entwickelst Bewusstsein' },
  { id: 3, name: 'Bedürfnisjäger*in', minPoints: 251, maxPoints: 500, description: 'Du beobachtest genau' },
  { id: 4, name: 'Herz-Decoder', minPoints: 501, maxPoints: 750, description: 'Du erkundest Gefühle' },
  { id: 5, name: 'Klartext-Champion', minPoints: 751, maxPoints: 1000, description: 'Du navigierst Bedürfnisse' },
  { id: 6, name: 'Dialog-Designer*in', minPoints: 1001, maxPoints: 1500, description: 'Du formulierst klare Bitten' },
  { id: 7, name: 'Empathie-Held*in', minPoints: 1501, maxPoints: 2000, description: 'Du baust Empathie auf' },
  { id: 8, name: 'Verbindungsprofi', minPoints: 2001, maxPoints: 3000, description: 'Du kommunizierst ausgewogen' },
  { id: 9, name: 'Kommunikationsguru', minPoints: 3001, maxPoints: 5000, description: 'Du meisterst die Kommunikation' },
  { id: 10, name: 'Super-Kommunikator*in', minPoints: 5001, maxPoints: Infinity, description: 'Du bist ein Super-Kommunikator*in!' },
];

export default function StatsSuperCommunicator({ data }: StatsSuperCommunicatorProps) {
  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Target size={24} color={baseColors.purple} strokeWidth={2} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Super-Kommunikator</Text>
            <Text style={styles.subtitle}>Starte deine Reise zur Kommunikationsmeisterschaft</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Beginne mit deinem ersten Chat oder einer Lerneinheit, um Punkte zu sammeln!
          </Text>
        </View>
      </View>
    );
  }

  const currentLevelInfo = LEVELS.find(level => level.id === data.currentLevel) || LEVELS[0];
  const nextLevelInfo = LEVELS.find(level => level.id === data.currentLevel + 1);
  const isMaxLevel = data.currentLevel === 10;

  // Calculate which levels to show (current level ± 2 levels)
  const visibleLevels = LEVELS.filter(level => {
    return level.id >= Math.max(1, data.currentLevel - 2) && 
           level.id <= Math.min(10, data.currentLevel + 2);
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Award size={28} color={baseColors.purple} strokeWidth={2} fill={baseColors.purple} fillOpacity={0.2} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Super-Kommunikator</Text>
          <Text style={styles.levelBadge}>{currentLevelInfo.name}</Text>
        </View>
      </View>

      {/* Current Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.pointsText}>{data.totalPoints.toLocaleString()} Punkte</Text>
          {!isMaxLevel && (
            <Text style={styles.nextLevelText}>
              {data.pointsNeededForNextLevel} bis {nextLevelInfo?.name}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${data.progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(data.progressPercentage)}%
          </Text>
        </View>

        {!isMaxLevel && (
          <Text style={styles.progressDescription}>
            {currentLevelInfo.description}
          </Text>
        )}
      </View>

      {/* Level Scale */}
      <View style={styles.scaleSection}>
        <Text style={styles.scaleTitle}>Dein Fortschritt</Text>
        <View style={styles.scaleContainer}>
          {visibleLevels.map((level, index) => {
            const isCurrent = level.id === data.currentLevel;
            const isPast = level.id < data.currentLevel;
            const isFuture = level.id > data.currentLevel;
            
            return (
              <View key={level.id} style={styles.scaleItem}>
                <View style={styles.scaleItemContent}>
                  {/* Level Marker */}
                  <View style={[
                    styles.levelMarker,
                    isCurrent && styles.levelMarkerCurrent,
                    isPast && styles.levelMarkerPast,
                    isFuture && styles.levelMarkerFuture,
                  ]}>
                    {isPast && <View style={styles.checkmark} />}
                    {isCurrent && <View style={styles.currentDot} />}
                  </View>
                  
                  {/* Level Info */}
                  <View style={styles.levelInfo}>
                    <Text style={[
                      styles.levelName,
                      isCurrent && styles.levelNameCurrent,
                      isPast && styles.levelNamePast,
                    ]}>
                      {level.id}. {level.name}
                    </Text>
                    <Text style={[
                      styles.levelPoints,
                      (isFuture || isPast) && styles.levelPointsMuted,
                    ]}>
                      {level.minPoints === 0 ? 'Start' : level.minPoints.toLocaleString()}
                      {level.maxPoints !== Infinity && ` - ${level.maxPoints.toLocaleString()}`}
                      {level.maxPoints === Infinity && '+'}
                    </Text>
                  </View>
                </View>
                
                {/* Connector Line */}
                {index < visibleLevels.length - 1 && (
                  <View style={[
                    styles.connectorLine,
                    isPast && styles.connectorLinePast,
                    isCurrent && styles.connectorLineCurrent,
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Activity */}
      {data.recentPoints && data.recentPoints.length > 0 && (
        <View style={styles.recentActivitySection}>
          <View style={styles.recentActivityHeader}>
            <TrendingUp size={16} color={baseColors.purple} strokeWidth={2} />
            <Text style={styles.recentActivityTitle}>Letzte Aktivität</Text>
          </View>
          <View style={styles.recentActivityList}>
            {data.recentPoints.slice(0, 3).map((activity, index) => (
              <View key={index} style={styles.recentActivityItem}>
                <Text style={styles.recentActivityDate}>
                  {new Date(activity.date).toLocaleDateString('de-DE', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Text>
                <Text style={styles.recentActivityPoints}>
                  +{activity.points} Punkte
                </Text>
                <Text style={styles.recentActivitySource}>
                  {activity.source === 'chat' ? '💬 Chat' : 
                   activity.source === 'learning' ? '📚 Lernen' : 
                   '✅ Lösung'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: baseColors.lilac,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  levelBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.purple,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  nextLevelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: baseColors.purple,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    minWidth: 40,
  },
  progressDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  scaleSection: {
    marginBottom: 20,
  },
  scaleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  scaleContainer: {
    position: 'relative',
  },
  scaleItem: {
    marginBottom: 8,
  },
  scaleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelMarkerPast: {
    borderColor: baseColors.purple,
    backgroundColor: baseColors.purple,
  },
  levelMarkerCurrent: {
    borderColor: baseColors.purple,
    borderWidth: 3,
    backgroundColor: baseColors.lilac,
  },
  levelMarkerFuture: {
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: '#fff',
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: baseColors.purple,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  levelNameCurrent: {
    color: baseColors.purple,
    fontSize: 14,
  },
  levelNamePast: {
    color: '#666',
  },
  levelPoints: {
    fontSize: 11,
    color: '#666',
  },
  levelPointsMuted: {
    color: '#999',
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginLeft: 15,
    marginTop: 4,
    marginBottom: 4,
  },
  connectorLinePast: {
    backgroundColor: baseColors.purple,
  },
  connectorLineCurrent: {
    backgroundColor: baseColors.lilac,
  },
  recentActivitySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  recentActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  recentActivityList: {
    gap: 8,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  recentActivityDate: {
    fontSize: 11,
    color: '#666',
    width: 60,
  },
  recentActivityPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: baseColors.purple,
    flex: 1,
    marginLeft: 12,
  },
  recentActivitySource: {
    fontSize: 11,
    color: '#666',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

