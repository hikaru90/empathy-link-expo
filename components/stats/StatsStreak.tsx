import FlameIconImage from '@/assets/icons/Flame.png';
import baseColors from '@/baseColors.config';
import { Image } from 'expo-image';
import { Calendar, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastChatDate: string | null;
  totalChatsCompleted: number;
}

interface StatsStreakProps {
  data: StreakData;
}

export default function StatsStreak({ data }: StatsStreakProps) {
  const formatLastChatDate = (dateString: string | null) => {
    if (!dateString) return 'Noch keine Chats';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';

    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStreakMessage = () => {
    if (data.currentStreak === 0) {
      return 'Starte deine Serie heute!';
    } else if (data.currentStreak === 1) {
      return 'Toller Start! Mach morgen weiter!';
    } else if (data.currentStreak < 7) {
      return `${data.currentStreak} Tage in Folge! Weiter so!`;
    } else if (data.currentStreak < 30) {
      return `Wow! ${data.currentStreak} Tage Serie!`;
    } else {
      return `Unglaublich! ${data.currentStreak} Tage!`;
    }
  };

  return (
    <View className="">
      <View className="">
        {/* Current Streak Card */}
        <View className="flex-row items-center justify-start pt-4 pb-5 pl-4 pr-6 shadow shadow-black/10 mb-1" style={{borderWidth: 1, borderColor: '#fff', borderRadius: 16, backgroundColor: baseColors.white+'88'}}>
          <Image source={FlameIconImage} style={{ width: 50, height: 50, marginLeft: -8, marginRight: 4 }} />
          <View className="flex-1">
            <Text className="text-base font-bold text-black">{data.currentStreak} tages Streak</Text>
            <Text className="text-xs text-black">{getStreakMessage()}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3 py-2">
          {/* Longest Streak */}
          <View className="flex-1 rounded-xl p-4 items-start justify-center bg-white/50 border border-white shadow shadow-black/10">
            <View className="flex-row" style={{marginTop:-5}}>
              <TrendingUp size={20} color={baseColors.lilac} strokeWidth={2} style={{ marginRight: 6, marginTop:3 }} />
              <Text className="text-lg font-bold text-black">{data.longestStreak}</Text>
            </View>
            <Text className="text-xs text-black/80 text-center">Bester Streak</Text>
          </View>

          {/* Total Chats */}
          <View className="flex-1 rounded-xl p-4 items-start justify-center bg-white/50 border border-white shadow shadow-black/10">
            <View className="flex-row" style={{marginTop:-5}}>
              <Calendar size={17} color={baseColors.lilac} strokeWidth={2} style={{ marginRight: 6, marginTop:5 }} />
            <Text className="text-lg font-bold text-black">{data.totalChatsCompleted}</Text>
            </View>
            <Text className="text-xs text-black/80 text-center">Anzahl Chats</Text>
          </View>
        </View>

        {/* Last Chat Date */}
        {data.lastChatDate && (
          <View className="flex-row justify-center items-center px-3 py-1">
            <Text className="text-xs text-black/80">Letzter Chat: </Text>
            <Text className="text-xs text-black/80">
              {formatLastChatDate(data.lastChatDate)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

