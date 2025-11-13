import baseColors from '@/baseColors.config';
import { generateBlindSpotsAnalysis, getBlindSpotsAnalysis, type BlindSpotInsight } from '@/lib/api/stats';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Eye, Lightbulb, RefreshCw, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StatsBlindSpots() {
  const [insight, setInsight] = useState<BlindSpotInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchBlindSpots();
  }, []);

  const fetchBlindSpots = async () => {
    try {
      setLoading(true);
      const data = await getBlindSpotsAnalysis();
      console.log('📊 Blind Spots Data:', {
        hasInsight: data.hasInsight,
        canGenerateNew: data.canGenerateNew,
        isAdmin: data.isAdmin,
        daysUntilNext: data.daysUntilNext,
        fullData: data
      });
      console.log('📊 Full insight object:', JSON.stringify(data, null, 2));
      setInsight(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching blind spots:', err);
      setError('Fehler beim Laden der Analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    console.log('🔧 Generate button clicked', {
      isAdmin: insight?.isAdmin,
      canGenerateNew: insight?.canGenerateNew,
      daysUntilNext: insight?.daysUntilNext
    });

    try {
      setIsGenerating(true);
      setError(null);
      console.log('🚀 Calling generateBlindSpotsAnalysis...');
      const newInsight = await generateBlindSpotsAnalysis();
      console.log('✅ New insight received:', newInsight);
      setInsight(newInsight);
      setIsExpanded(true); // Auto-expand when new insight is generated

      Alert.alert(
        'Analyse erstellt',
        'Deine neue Muster-Analyse wurde erfolgreich erstellt!',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('❌ Error generating insight:', err);
      const errorMessage = err?.message || 'Fehler beim Erstellen der Analyse';
      Alert.alert('Fehler', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatNextAvailableDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    return date.toLocaleDateString('de-DE', options);
  };

  if (loading) {
    return (
      <View
        className="rounded-2xl p-5 min-h-[120px] justify-center shadow-lg shadow-black/10"
        style={{ backgroundColor: baseColors.offwhite }}
      >
        <View className="items-center justify-center py-5">
          <ActivityIndicator size="small" color={baseColors.lilac} />
          <Text className="text-sm text-gray-600 mt-2">Analysiere deine Muster...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="rounded-2xl p-5 min-h-[120px] justify-center shadow-lg shadow-black/10"
        style={{ backgroundColor: baseColors.offwhite }}
      >
        <Text className="text-sm text-red-600 text-center">{error}</Text>
      </View>
    );
  }

  if (!insight?.hasInsight) {
    return (
      <View
        className="rounded-2xl p-5 shadow-lg shadow-black/10"
        style={{ backgroundColor: baseColors.offwhite }}
      >
        <View className="items-center justify-center py-3">
          <Eye size={32} color={baseColors.lilac} strokeWidth={1.5} />
          <Text className="text-base text-gray-700 text-center mt-3 leading-6">
            {insight?.message || 'Starte deine erste Konversation, um Muster und Blind Spots zu erkennen.'}
          </Text>
        </View>

        {/* Debug info */}
        {__DEV__ && (
          <Text className="text-xs text-gray-400 text-center mt-2">
            Debug: isAdmin={String(insight?.isAdmin)}, canGenerate={String(insight?.canGenerateNew)}
          </Text>
        )}

        {/* Generate Button for empty state - show for admins */}
        {insight?.isAdmin && (
          <Pressable
            onPress={handleGenerateInsight}
            disabled={isGenerating}
            className="mt-4 py-3 px-4 rounded-xl flex-row items-center justify-center"
            style={{
              backgroundColor: isGenerating ? '#d1d5db' : baseColors.lilac,
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-sm font-semibold text-white ml-2">
                  Erstelle Analyse...
                </Text>
              </>
            ) : (
              <>
                <RefreshCw size={16} color="white" strokeWidth={2} />
                <Text className="text-sm font-semibold text-white ml-2">
                  Neue Analyse erstellen (Admin)
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View
      className="rounded-2xl p-5 shadow-lg shadow-black/10"
      style={{ backgroundColor: baseColors.offwhite }}
    >
      {/* Header with Icon and Generate Button */}
      <View className="flex-row justify-between items-center mb-4">
        <Eye size={28} color={baseColors.lilac} strokeWidth={1.5} />

        {/* Generate Button - top right corner */}
        {(insight.canGenerateNew || insight.isAdmin) && (
          <TouchableOpacity
            className="px-3 py-1 rounded-full border border-black/10 flex-row items-center gap-1"
            onPress={handleGenerateInsight}
            disabled={isGenerating}
            style={{ opacity: isGenerating ? 0.5 : 1 }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color={baseColors.lilac} />
                <Text className="text-xs text-black ml-1">Erstelle...</Text>
              </>
            ) : (
              <>
                <RefreshCw size={12} color="#000" strokeWidth={2} />
                <Text className="text-xs text-black">Neu generieren</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Weekly Limit Notice */}
      {insight.nextAvailableDate && insight.daysUntilNext !== undefined && insight.daysUntilNext > 0 && (
        <View
          className="mb-4 p-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: baseColors.orange + '30' }}
        >
          <Clock size={16} color={baseColors.orange} strokeWidth={2} />
          <Text className="text-sm ml-2 flex-1 leading-[18px]" style={{ color: '#B85C00' }}>
            Nächste Analyse {insight.daysUntilNext === 1
              ? 'morgen'
              : `in ${insight.daysUntilNext} Tagen`} verfügbar
            
          </Text>
        </View>
      )}

      {/* Analysis Summary - Always visible */}
      {insight.analysis && (
        <View style={{ position: 'relative', marginBottom: 16 }}>
          <Text className="text-base leading-6 text-gray-800 mb-4">
            {insight.analysis}
          </Text>

          {/* Gradient fade indicator when not expanded */}
          {!isExpanded && (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0)', baseColors.offwhite]}
              style={styles.fadeGradient}
              pointerEvents="none"
            />
          )}
        </View>
      )}

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {/* Patterns Section */}
          {insight.patterns && insight.patterns.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <TrendingUp size={18} color={baseColors.lilac} strokeWidth={2} />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  Wiederkehrende Muster
                </Text>
              </View>
              {insight.patterns.map((pattern, index) => (
                <View key={index} className="flex-row mb-2 ml-1">
                  <Text className="text-gray-600 mr-2">•</Text>
                  <Text className="text-sm text-gray-700 flex-1 leading-5">{pattern}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Situations Section */}
          {insight.situations && insight.situations.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Typische Situationen
              </Text>
              {insight.situations.map((situation, index) => (
                <View key={index} className="flex-row mb-2 ml-1">
                  <Text className="text-gray-600 mr-2">•</Text>
                  <Text className="text-sm text-gray-700 flex-1 leading-5">{situation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Advice Section */}
          {insight.advice && (
            <View
              className="p-4 rounded-xl"
              style={{ backgroundColor: baseColors.lilac + '15' }}
            >
              <View className="flex-row items-center mb-2">
                <Lightbulb size={18} color={baseColors.lilac} strokeWidth={2} />
                <Text className="text-sm font-semibold ml-2" style={{ color: baseColors.lilac }}>
                  Empfehlung für dich
                </Text>
              </View>
              <Text className="text-sm text-gray-800 leading-5">
                {insight.advice}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Show More/Less Button */}
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Text style={{ fontSize: 12, color: '#000' }}>
            {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
});
