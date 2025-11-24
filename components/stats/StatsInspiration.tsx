import baseColors from '@/baseColors.config';
import GradientImage from '@/components/GradientImage';
import { getInspirationalQuote, type InspirationalQuote } from '@/lib/api/stats';
import { Quote } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

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
    <>
    <TouchableOpacity onPress={() => setLoadingQuote(!loadingQuote)}>Toggle State</TouchableOpacity>
    <View
      className="rounded-2xl p-5 justify-center shadow-lg shadow-black/10"
      style={{ backgroundColor: baseColors.offwhite }}
    >
      <Animated.View style={{ height: heightAnim, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loadingQuote ? (
          <View className="items-center justify-center py-5 flex-grow">
            <GradientImage style={{ width: 40, height: 20, borderRadius: 16, boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.1)' }} fast />
          </View>
        ) : quote ? (
          <Animated.View style={{ opacity: contentOpacity }} onLayout={handleContentLayout}>
            <View className="mb-3">
              <Quote size={24} color="transparent" fill={baseColors.lilac} />
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
    </>
  );
}
