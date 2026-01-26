import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { SquareCheck, AlertCircle, Quote } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import LoadingIndicator from '@/components/LoadingIndicator';

interface ChatAnalysisModalProps {
  visible: boolean;
  isAnalyzing: boolean;
  analysisComplete: boolean;
  analysisFailed: boolean;
  analysisId: string | null;
  onRetry: () => void;
  onClose: () => void;
}

// 5 random quotes to cycle through during analysis
const LOADING_QUOTES = [
  { quote: "Der Kern aller Wut ist ein Bedürfnis, das nicht erfüllt wird.", author: "Marshall B. Rosenberg" },
  { quote: "Worte können Fenster sein oder Mauern.", author: "Marshall B. Rosenberg" },
  { quote: "Deine Präsenz ist das wertvollste Geschenk, das du einem anderen machen kannst.", author: "Marshall B. Rosenberg" },
  { quote: "Gefühle entstehen aus Bedürfnissen – nicht aus dem Verhalten anderer.", author: "Marshall B. Rosenberg" },
  { quote: "Empathie ist keine Technik, sondern eine Haltung des Herzens.", author: "Marshall B. Rosenberg" }
];

export default function ChatAnalysisModal({
  visible,
  isAnalyzing,
  analysisComplete,
  analysisFailed,
  analysisId,
  onRetry,
  onClose,
}: ChatAnalysisModalProps) {
  const router = useRouter();
  const REDIRECT_DELAY = 500; // Brief delay to show completion state
  const [selectedQuote] = useState(() => LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in the quote when analyzing starts
  useEffect(() => {
    if (isAnalyzing && visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isAnalyzing, visible]);

  // Redirect immediately when analysis is complete
  useEffect(() => {
    if (analysisComplete && analysisId && visible) {
      const timer = setTimeout(() => {
        onClose();
        // Navigate directly to analysis page
        router.push(`/analysis/${analysisId}`);
      }, REDIRECT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [analysisComplete, analysisId, visible, onClose, router]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Chat Auswertung</Text>

        {isAnalyzing && (
          <View style={styles.contentContainer}>
            {/* Quote display - above loader */}
            <Animated.View style={[styles.quoteContainer, { opacity: fadeAnim }]}>
              <Quote size={24} color="#9333ea" style={styles.quoteIcon} />
              <Text style={styles.quoteText}>{selectedQuote.quote}</Text>
              <Text style={styles.quoteAuthor}>— {selectedQuote.author}</Text>
            </Animated.View>

            <LoadingIndicator />
            <Text style={styles.statusText}>Dein Chat wird ausgewertet</Text>
          </View>
        )}

        {analysisFailed && (
          <View style={styles.contentContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={48} color="#ef4444" />
            </View>
            <Text style={styles.errorText}>Dein Chat konnte nicht ausgewertet werden.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Erneut versuchen</Text>
            </TouchableOpacity>
          </View>
        )}

        {analysisComplete && analysisId && (
          <View style={styles.contentContainer}>
            <View style={styles.successIconContainer}>
              <SquareCheck size={48} color="#10b981" />
            </View>
            <Text style={styles.successText}>Dein Chat wurde ausgewertet</Text>
            <Text style={styles.redirectingText}>Weiterleitung zur Analyse...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7D9F9',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60, // Center visually
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    marginHorizontal: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quoteIcon: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  redirectingText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
