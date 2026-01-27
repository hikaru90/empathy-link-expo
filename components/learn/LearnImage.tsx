import { getPocketBaseFileUrl } from '@/lib/api/learn';
import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';

interface LearnImageProps {
  content: {
    src: string;
    alt?: string;
    caption?: string;
  };
  collectionId?: string;
  recordId?: string;
}

export default function LearnImage({
  content,
  collectionId,
  recordId,
}: LearnImageProps) {
  const [error, setError] = useState(false);

  const getImageUri = (): string => {
    const src = content.src || '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.includes('/api/files/')) return src;
    if (collectionId && recordId) {
      return getPocketBaseFileUrl(collectionId, recordId, src);
    }
    return src;
  };

  const uri = getImageUri();

  return (
    <View className="flex flex-col justify-between items-center w-full flex-grow">
      <View className="flex flex-col flex-grow justify-center items-center w-full">
        {!error && uri ? (
          <Image
            source={{ uri }}
            className="w-full"
            style={{ aspectRatio: 1, maxHeight: 300 }}
            resizeMode="contain"
            onError={() => setError(true)}
            accessibilityLabel={content.alt || ''}
          />
        ) : null}
        {content.caption ? (
          <Text className="mt-2 text-sm text-gray-600 italic">{content.caption}</Text>
        ) : null}
      </View>
    </View>
  );
}
