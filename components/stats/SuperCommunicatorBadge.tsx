import baseColors from '@/baseColors.config';
import { Image } from 'expo-image';
import { Award } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface SuperCommunicatorData {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
}

interface SuperCommunicatorBadgeProps {
  data: SuperCommunicatorData | null;
  onPress?: () => void;
}

// Level definitions in German
const LEVELS = [
  { id: 1, name: 'Anfänger*in', minPoints: 0, maxPoints: 100 },
  { id: 2, name: 'Gefühlsscout', minPoints: 101, maxPoints: 250 },
  { id: 3, name: 'Bedürfnisjäger*in', minPoints: 251, maxPoints: 500 },
  { id: 4, name: 'Herz-Decoder', minPoints: 501, maxPoints: 750 },
  { id: 5, name: 'Klartext-Champion', minPoints: 751, maxPoints: 1000 },
  { id: 6, name: 'Dialog-Designer*in', minPoints: 1001, maxPoints: 1500 },
  { id: 7, name: 'Empathie-Held*in', minPoints: 1501, maxPoints: 2000 },
  { id: 8, name: 'Verbindungsprofi', minPoints: 2001, maxPoints: 3000 },
  { id: 9, name: 'Kommunikationsguru', minPoints: 3001, maxPoints: 5000 },
  { id: 10, name: 'Super-Kommunikator*in', minPoints: 5001, maxPoints: Infinity },
];

export default function SuperCommunicatorBadge({ data, onPress }: SuperCommunicatorBadgeProps) {
  if (!data) {
    return (
      <TouchableOpacity
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: baseColors.white+'88',
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#fff',
          marginBottom: 12,
        }}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image source={require('@/assets/images/background-lilac.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        <View style={styles.iconContainer}>
          <Image source={require('@/assets/images/background-lilac.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
          <Award size={20} color={baseColors.lemonade} strokeWidth={2} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Anfänger*in</Text>
          <Text style={styles.subtitle}>Starte deine Reise</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const currentLevelInfo = LEVELS.find(level => level.id === data.currentLevel) || LEVELS[0];
  const nextLevelInfo = LEVELS.find(level => level.id === data.currentLevel + 1);
  const isMaxLevel = data.currentLevel === 10;

  return (
    <TouchableOpacity
      style={{
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: baseColors.white+'88',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fff',
        marginBottom: 12,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        backgroundColor: baseColors.lilac,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
      }}>
        <Image source={require('@/assets/images/background-lilac.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
        <Award
          size={20}
          color={baseColors.lemonade}
          strokeWidth={2}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{currentLevelInfo.name}</Text>
        {!isMaxLevel && (
          <>

            {/* Progress Bar */}
            <View className='flex-row items-center justify-between my-1'>
              <View className='flex-1 h-3 rounded-full overflow-hidden mr-2' style={{ backgroundColor: baseColors.background }}>
                <View
                  className='h-full rounded-full flex-row items-center justify-end pr-1'
                  style={{ width: `${data.progressPercentage}%`, backgroundColor: baseColors.lilac }}
                >
                  <Text className='text-[9px] font-medium text-white'>{Math.round(data.progressPercentage)}%</Text>
                </View>
              </View>
            </View>
            <View className='flex-row items-center justify-between'>
              <Text className='text-xs font-medium text-black/80'>{data.totalPoints.toLocaleString()} Punkte</Text>
              <Text className='text-xs font-medium text-black/80'>{data.pointsNeededForNextLevel} bis {nextLevelInfo?.name}</Text>
            </View>
          </>
        )}
        {isMaxLevel && (
          <Text style={styles.nextLevel}>Maximales Level erreicht!</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: baseColors.lilac,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  nextLevel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 6,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: baseColors.lilac,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    minWidth: 35,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
});

