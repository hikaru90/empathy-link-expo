import baseColors from '@/baseColors.config';
import { getInspirationalQuote, type InspirationalQuote } from '@/lib/api/stats';
import { Quote } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.quoteContainer}>
      {loadingQuote ? (
        <View style={styles.quoteLoadingContainer}>
          <ActivityIndicator size="small" color={baseColors.lilac} />
        </View>
      ) : quote ? (
        <>
          <Quote size={32} color="transparent" fill={baseColors.lilac} style={styles.quoteIcon} />
          <Text style={styles.quoteText}>{quote.quote}</Text>
          <Text style={styles.quoteAuthor}>
            — {quote.author || 'Unbekannt'}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  quoteContainer: {
    backgroundColor: baseColors.offwhite,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  quoteIcon: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'normal',
  },
});
