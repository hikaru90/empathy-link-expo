import QuoteIconImage from '@/assets/icons/Quote.png';
import LoadingIndicator from '@/components/LoadingIndicator';
import { getInspirationalQuote, type InspirationalQuote } from '@/lib/api/stats';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

const COLLAPSED_HEIGHT = 60;

export default function StatsInspiration() {
  const [quote, setQuote] = useState<InspirationalQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [targetHeight, setTargetHeight] = useState(COLLAPSED_HEIGHT);
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const contentHeightRef = useRef(COLLAPSED_HEIGHT);

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    try {
      setLoadingQuote(true);
      const quoteData = await getInspirationalQuote();
      setQuote(quoteData);
    } catch (err) {
      console.error('Error fetching inspirational quote:', err);
      // Don't show error for quote - it's optional
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    const toValue = loadingQuote ? COLLAPSED_HEIGHT : targetHeight;
    Animated.spring(heightAnim, {
      toValue,
      useNativeDriver: false,
      tension: 120,
      friction: 18,
    }).start();
  }, [heightAnim, loadingQuote, targetHeight]);

  const handleContentLayout = (event: any) => {
    if (loadingQuote) return;
    const measuredHeight = Math.max(event.nativeEvent.layout.height, COLLAPSED_HEIGHT);
    if (Math.abs(measuredHeight - contentHeightRef.current) > 4) {
      contentHeightRef.current = measuredHeight;
      setTargetHeight(measuredHeight);
    }
  };

  const contentOpacity = heightAnim.interpolate({
    inputRange: [COLLAPSED_HEIGHT, Math.max(targetHeight, COLLAPSED_HEIGHT + 1)],
    outputRange: [0, 1],
  });

  return (
    <View
      className="rounded-2xl p-5 justify-center overflow-hidden shadow-xl shadow-black/10"
      style={{ position: 'relative' }}
    >
      <Image 
        source={require('@/assets/images/background-lilac-highres.png')} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          zIndex: -1 
        }} 
      />
      <Animated.View style={{ height: heightAnim, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loadingQuote ? (
          <View className="items-center justify-center py-5 flex-grow">
            <LoadingIndicator />
          </View>
        ) : quote ? (
          <Animated.View style={{ opacity: contentOpacity }} onLayout={handleContentLayout}>
            <View className="mb-3">
              <Image source={QuoteIconImage} style={{ width: 40, height: 40, marginBottom: -8 }} />
            </View>
            <Text className="text-base leading-6 text-gray-800 italic mb-2">
              {quote.quote}
            </Text>
            <Text className="text-sm text-black/40 text-right mt-2">
              — {quote.author || 'Unbekannt'}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
