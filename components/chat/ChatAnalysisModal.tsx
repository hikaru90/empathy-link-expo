import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SquareCheck, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ChatAnalysisModalProps {
  visible: boolean;
  isAnalyzing: boolean;
  analysisComplete: boolean;
  analysisFailed: boolean;
  analysisId: string | null;
  onRetry: () => void;
  onClose: () => void;
}

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
            <ActivityIndicator size="large" color="#4ECDC4" style={styles.spinner} />
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
  spinner: {
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
