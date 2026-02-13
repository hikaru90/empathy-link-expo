import baseColors from '@/baseColors.config';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

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
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const handleImageLoad = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex flex-1 flex-col justify-between p-2">
      <View
        className="relative flex flex-1 w-full flex-col items-start justify-between overflow-hidden rounded-xl p-6"
        style={{ backgroundColor: categoryColor }}
      >
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        }}>
          <LinearGradient
            colors={[baseColors.lilac+'99', baseColors.lilac+'00']}
            style={{
              width: '100%',
              height: '100%',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>
        {image && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
              },
              { opacity: imageOpacity },
            ]}
          >
            <ImageBackground
              source={{ uri: getPocketBaseFileUrl(collectionId, recordId, image) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              onLoad={handleImageLoad}
            />
          </Animated.View>
        )}
        <Text className="relative z-10 text-xl font-light text-black">
          <Text className="mb-1">{titleParts[0] || 'Loading...'}</Text>
          <Text className="font-bold">{titleParts[1] || ''}</Text>
        </Text>

        {/* Start Button */}
        <TouchableOpacity
          testID="learn-step-next"
          onPress={onStart}
          className="flex h-10 w-full flex-row items-center justify-between gap-2 rounded-full bg-black py-3 pl-6 pr-2 relative z-10"
        >
          <Text className="font-medium text-white">Starten</Text>
          <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <ArrowRight size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

