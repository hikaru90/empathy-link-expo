import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import baseColors from '@/baseColors.config';
import ChatAnalysisModal from '@/components/chat/ChatAnalysisModal';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import Header from '@/components/Header';
import { useAuthGuard } from '@/hooks/use-auth';
import { ChatProvider, useChat } from '@/hooks/use-chat';
import { LinearGradient } from 'expo-linear-gradient';
import { SquareCheck } from 'lucide-react-native';

function ChatContent() {
  const { history, isLoading, error, initializeChat, isSending, finishChat, isAnalyzing, chatId } = useChat();
  const flatListRef = useRef<FlatList>(null);
  const [feelingSelectorVisible, setFeelingSelectorVisible] = useState(false);
  const [needSelectorVisible, setNeedSelectorVisible] = useState(false);
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize if we don't already have a chat loaded
    // This prevents overriding a chat that was just reopened
    if (!hasInitialized.current && !chatId) {
      hasInitialized.current = true;
      initializeChat('de', 'idle');
    }
  }, [initializeChat, chatId]);

  // Helper function to scroll to last message with offset
  const scrollToBottom = () => {
    if (history && history.length > 0 && flatListRef.current) {
      // Use a small delay to ensure heights are measured
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: history.length - 1,
            viewPosition: 0, // 0 = top of viewport, 1 = bottom
            viewOffset: 100, // Offset from top in pixels
            animated: true
          });
        } catch (error) {
          // Fallback to scrollToEnd if scrollToIndex fails
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 50);
    }
  };

  const getItemLayout = (data: any, index: number) => {
    const height = itemHeights.current.get(index) || 100; // Default estimated height
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeights.current.get(i) || 100;
    }
    return { length: height, offset, index };
  };

  const onItemLayout = (index: number, height: number) => {
    itemHeights.current.set(index, height);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    // Show finish button when there are more than 4 messages (same logic as Svelte version)
    setShowFinishButton(history.length > 4);
  }, [history]);

  // Scroll to bottom when selectors open
  useEffect(() => {
    if (feelingSelectorVisible || needSelectorVisible) {
      setTimeout(() => {
        scrollToBottom();
      }, 150); // Slightly longer delay to account for layout change
    }
  }, [feelingSelectorVisible, needSelectorVisible]);

  const handleFinishChat = async () => {
    setShowAnalysisModal(true);
    setAnalysisComplete(false);
    setAnalysisFailed(false);
    setAnalysisId(null);

    try {
      const result = await finishChat('de');
      setAnalysisComplete(true);
      setAnalysisId(result.analysisId);
    } catch (err) {
      console.error('Failed to finish chat:', err);
      setAnalysisFailed(true);
    }
  };

  const handleRetryAnalysis = () => {
    setAnalysisFailed(false);
    handleFinishChat();
  };

  const handleCloseModal = () => {
    setShowAnalysisModal(false);
    setAnalysisComplete(false);
    setAnalysisFailed(false);
    setAnalysisId(null);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={baseColors.lilac} />
        <Text style={styles.loadingText}>Starte Chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Fehler: {error}</Text>
        <Text style={styles.errorHint}>Bitte stelle sicher, dass der Backend-Server läuft.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'android' ? 70 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={history || []}
        keyExtractor={(item, index) => `${index}-${item.timestamp}`}
        renderItem={({ item, index }) => (
          <View
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              onItemLayout(index, height);
            }}
          >
            <MessageBubble message={item} />
          </View>
        )}
        contentContainerStyle={[
          styles.messageList,
          {
            paddingBottom: (feelingSelectorVisible || needSelectorVisible)
              ? Platform.OS === 'web' ? 200 :  Platform.OS === 'ios' ? 380 : 320  // Extra padding when selectors are open
              : Platform.OS === 'web' ? 60 : Platform.OS === 'ios' ? 260 : 180
          }
        ]}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          // Wait for layout and retry
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              viewPosition: 0,
              viewOffset: 100,
              animated: true
            });
          }, 100);
        }}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          <>
            {isSending && <TypingIndicator />}
            {showFinishButton && (
              <View style={styles.finishButtonContainer}>
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={handleFinishChat}
                >
                  <Text style={styles.finishButtonText}>Chat abschließen</Text>
                  <SquareCheck size={16} color="#fff" style={styles.finishButtonIcon} />
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        style={styles.flatList}
        scrollEnabled={true}
      />
        <LinearGradient
          colors={[baseColors.background,'rgba(231, 217, 249, 0.8)', 'rgba(231, 217, 249, 0)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradient}
        >
        </LinearGradient>
      <MessageInput 
        onSelectorStateChange={(feelingVisible, needVisible) => {
          setFeelingSelectorVisible(feelingVisible);
          setNeedSelectorVisible(needVisible);
        }}
      />
      <ChatAnalysisModal
        visible={showAnalysisModal}
        isAnalyzing={isAnalyzing}
        analysisComplete={analysisComplete}
        analysisFailed={analysisFailed}
        analysisId={analysisId}
        onRetry={handleRetryAnalysis}
        onClose={handleCloseModal}
      />
    </KeyboardAvoidingView>
  );
}

export default function ChatScreen() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <ActivityIndicator size="large" color={baseColors.lilac} />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <ChatProvider>
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <Header />
        <ChatContent />
      </View>
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: 60,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 70 : 0,
    zIndex: 5,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 120 : 80, // Account for floating header
  },
  messageList: {
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 120 : 80, // Account for floating header
    paddingBottom: Platform.OS === 'ios' ? 260 : 80, // Account for floating header
    // backgroundColor: 'red',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  flatList: {
    flex: 1,
    paddingBottom: 160,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  finishButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#fff',
    backgroundColor: baseColors.black,
  },
  finishButtonText: {
    fontSize: 14,
    color: baseColors.offwhite,
  },
  finishButtonIcon: {
    marginLeft: 4,
  },
});