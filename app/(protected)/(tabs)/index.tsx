import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import jungleImage from '@/assets/images/Jungle.jpg';
import baseColors from '@/baseColors.config';
import ChatAnalysisModal from '@/components/chat/ChatAnalysisModal';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import SafetyResources from '@/components/chat/SafetyResources';
import TypingIndicator from '@/components/chat/TypingIndicator';
import LoadingIndicator from '@/components/LoadingIndicator';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import { useAuthGuard } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import type { HistoryEntry } from '@/lib/api/chat';
import { ChatProvider, useChat } from '@/hooks/use-chat';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

function ChatContent() {
  const {
    history,
    isLoading,
    error,
    initializeChat,
    isSending,
    finishChat,
    isAnalyzing,
    chatId,
    safetyStatus,
    crisisResources,
    loadCrisisResources,
    requestAppeal,
  } = useChat();
  const flatListRef = useRef<FlatList>(null);
  const [feelingSelectorVisible, setFeelingSelectorVisible] = useState(false);
  const [needSelectorVisible, setNeedSelectorVisible] = useState(false);
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [appealInProgress, setAppealInProgress] = useState(false);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const hasInitialized = useRef(false);

  // Merge path-marker-only messages into the previous model message so the path indicator appears above the text
  const displayHistory = useMemo(() => {
    if (!history?.length) return history || [];
    const result: HistoryEntry[] = [];
    for (let i = 0; i < history.length; i++) {
      const curr = history[i];
      const prev = result[result.length - 1];
      const isPathMarkerOnly =
        curr.role === 'model' &&
        curr.pathMarker &&
        !curr.parts?.[0]?.text &&
        !curr.nvcKnowledge?.length;
      const prevIsModelWithText =
        prev?.role === 'model' && prev.parts?.[0]?.text;

      if (isPathMarkerOnly && prevIsModelWithText && curr.pathMarker) {
        result[result.length - 1] = { ...prev, pathMarker: curr.pathMarker };
      } else {
        result.push(curr);
      }
    }
    return result;
  }, [history]);

  useEffect(() => {
    if (!hasInitialized.current && !chatId) {
      hasInitialized.current = true;
      initializeChat('de', 'idle');
    }
  }, [initializeChat, chatId]);

  // Load crisis resources when safety status indicates we should show them
  useEffect(() => {
    if (safetyStatus?.showResources || safetyStatus?.suspended) {
      loadCrisisResources('de');
    }
  }, [safetyStatus?.showResources, safetyStatus?.suspended, loadCrisisResources]);

  // Helper function to scroll to last message with offset
  const scrollToBottom = () => {
    const list = displayHistory || [];
    if (list.length > 0 && flatListRef.current) {
      // Use a small delay to ensure heights are measured
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: list.length - 1,
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
        <LoadingIndicator />
      </View>
    );
  }

  // When suspended, show crisis resources full-screen (no chat)
  if (safetyStatus?.suspended) {
    return (
      <View style={[styles.centerContainer, { flex: 1 }]}>
        <SafetyResources
          resources={crisisResources || []}
          suspended={true}
          onAppeal={async () => {
            setAppealInProgress(true);
            try {
              return await requestAppeal();
            } finally {
              setAppealInProgress(false);
            }
          }}
          appealInProgress={appealInProgress}
        />
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

  const gradientSize = 500;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'android' ? 70 : 0}
    >
      <View style={{ position: 'absolute', top: -gradientSize / 3, left: -gradientSize / 3, right: 0, bottom: 0, zIndex: -1}}>

        <Svg height={gradientSize} width={gradientSize}>
          <Defs>
            <RadialGradient
              id="grad"
              cx={gradientSize / 2} 
              cy={gradientSize / 2}
              rx={gradientSize / 2}
              ry={gradientSize / 2}
              fx={gradientSize / 2}
              fy={gradientSize / 2}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor='white' stopOpacity="1" />
              <Stop offset="1" stopColor='white' stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={gradientSize / 2} cy={gradientSize / 2} rx={gradientSize / 2} ry={gradientSize / 2} fill="url(#grad)" />
        </Svg>
      </View>
      <FlatList
        ref={flatListRef}
        data={displayHistory || []}
        keyExtractor={(item, index) => `${index}-${item.timestamp}`}
        ListHeaderComponent={
          safetyStatus?.showResources && !safetyStatus?.suspended ? (
            <View style={styles.safetyBanner}>
              <SafetyResources
                resources={crisisResources || []}
                suspended={false}
                onAppeal={requestAppeal}
                compact
              />
            </View>
          ) : null
        }
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
              ? Platform.OS === 'web' ? 200 : Platform.OS === 'ios' ? 380 : 320  // Extra padding when selectors are open
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
                  onPress={handleFinishChat}
                >
                  <ImageBackground source={jungleImage} resizeMode="cover" style={{
                    width: '100%', height: '100%', flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    paddingVertical: 8,
                    paddingLeft: 16,
                    paddingRight: 8,
                    borderRadius: 999,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  }}>
                    <Text style={styles.finishButtonText}>Chat abschließen & auswerten</Text>
                    <Check size={16} color="#fff" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        style={styles.flatList}
        scrollEnabled={true}
      />
      <LinearGradient
        colors={[baseColors.background, baseColors.background + 'ee', baseColors.background + '00']}
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
  const { isAuthenticated, isLoading } = useAuthGuard();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <View className="flex-1 justify-center items-center -mt-6">
          <LoadingIndicator />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <ChatProvider>
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <ChatContent />
      </View>
      <OnboardingWelcome
        visible={showOnboarding === true}
        onComplete={completeOnboarding}
      />
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
    overflow: 'hidden',
  },
  safetyBanner: {
    marginBottom: 16,
  },
  finishButtonText: {
    fontSize: 14,
    color: baseColors.offwhite,
  },
});