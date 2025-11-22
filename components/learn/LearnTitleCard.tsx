import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { getPocketBaseFileUrl } from '@/lib/api/learn';

interface LearnTitleCardProps {
  title: string;
  categoryColor: string;
  image?: string;
  collectionId: string;
  recordId: string;
  onStart: () => void;
}

export default function LearnTitleCard({
  title,
  categoryColor,
  image,
  collectionId,
  recordId,
  onStart,
}: LearnTitleCardProps) {
  const titleParts = title?.split('||') || ['', ''];

  return (
    <View className="mb-6 flex flex-1 flex-col justify-between p-2">
      <View
        className="relative flex flex-1 w-full flex-col items-start justify-between overflow-hidden rounded-xl p-6"
        style={{ backgroundColor: categoryColor }}
      >
        <Text className="relative z-10 text-xl font-light text-black">
          <Text className="mb-1">{titleParts[0] || 'Loading...'}</Text>
          <Text className="font-bold">{titleParts[1] || ''}</Text>
        </Text>
        
        {/* Start Button */}
        <TouchableOpacity
          onPress={onStart}
          className="flex h-10 w-full flex-row items-center justify-between gap-2 rounded-full bg-black py-3 pl-6 pr-2"
        >
          <Text className="font-medium text-white">Starten</Text>
          <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <ArrowRight size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Topic Image */}
        {image && (
          <Image
            source={{ uri: getPocketBaseFileUrl(collectionId, recordId, image) }}
            className="absolute right-0 top-1/2 -z-0 -mr-10 w-2/3 opacity-30"
            style={{ transform: [{ rotate: '12deg' }, { translateY: -50 }] }}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
}

