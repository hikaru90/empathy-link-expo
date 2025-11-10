import baseColors from '@/baseColors.config';
import { getInspirationalQuote, type InspirationalQuote } from '@/lib/api/stats';
import { Quote } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function StatsInspiration() {
  const [quote, setQuote] = useState<InspirationalQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);

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

  return (
    <View 
      className="rounded-2xl p-5 mb-8 min-h-[80px] justify-center shadow-lg shadow-black/10"
      style={{ backgroundColor: baseColors.offwhite }}
    >
      {loadingQuote ? (
        <View className="items-center justify-center py-5">
          <ActivityIndicator size="small" color={baseColors.lilac} />
        </View>
      ) : quote ? (
        <>
          <View className="mb-3">
            <Quote size={24} color="transparent" fill={baseColors.lilac} />
          </View>
          <Text className="text-base leading-6 text-gray-800 italic mb-2">{quote.quote}</Text>
          <Text className="text-sm text-black/40 text-right mt-2">
            — {quote.author || 'Unbekannt'}
          </Text>
        </>
      ) : null}
    </View>
  );
}
