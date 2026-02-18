import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import baseColors from '@/baseColors.config';
import MessageBubble from '@/components/chat/MessageBubble';
import Header from '@/components/Header';
import LoadingIndicator from '@/components/LoadingIndicator';
import TabBar from '@/components/TabBar';
import { useAuthGuard } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { getAnalysisById } from '@/lib/api/analysis';
import type { HistoryEntry } from '@/lib/api/chat';

import { Image } from 'expo-image';

const jungleImage = require('@/assets/images/Jungle.jpg');

interface Analysis {
  id: string;
  chatId?: string;
  title: string;
  observation?: string;
  feelings?: string[];
  needs?: string[];
  request?: string;
  conversationGoal?: string;
  dailyWin?: string;
  emotionalShift?: string;
  iStatementMuscle?: number;
  clarityOfAsk?: string;
  empathyAttempt?: boolean;
  feelingVocabulary?: number;
  created: string;
  chatHistory?: HistoryEntry[];
}

export default function AnalysisDetailScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { reopenChat, isLoading: isReopeningChat } = useChat();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatExpanded, setChatExpanded] = useState(false);

  const handleReopenChat = async () => {
    if (!analysis?.chatId) return;

    try {
      await reopenChat(analysis.chatId);
      // Navigate to the chat tab index route
      router.replace('/(protected)/(tabs)');
    } catch (err) {
      console.error('Failed to reopen chat:', err);
      setError('Chat konnte nicht wiedereröffnet werden');
    }
  };

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchAnalysis();
    }
  }, [id, isAuthenticated]);

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true);
      const data = await getAnalysisById(id as string);
      setAnalysis(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Analyse konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !analysis) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Analyse nicht gefunden'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(protected)/(tabs)/stats');
              }
            }}
          >
            <Text style={styles.backButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButtonInline}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(protected)/(tabs)/stats');
            }
          }}
        >
          <ChevronLeft size={16} color="#000" />
          <Text style={styles.backButtonInlineText}>zurück</Text>
        </TouchableOpacity>

        <View style={{ paddingHorizontal: 20, flex: 1, gap: 22 }}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{analysis.title}</Text>
              <Text style={styles.date}>
                {new Intl.DateTimeFormat('de-DE', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(new Date(analysis.created))}
              </Text>
            </View>
          </View>

          {/* Conversation Goal */}
          {analysis.conversationGoal && (
            <View style={styles.goalCard}>
              <Text style={styles.goalEmoji}>🎯</Text>
              <View style={styles.goalContent}>
                <Text style={styles.goalTitle}>Gesprächsziel</Text>
                <Text style={styles.goalText}>{analysis.conversationGoal}</Text>
              </View>
            </View>
          )}



          {/* Daily Win */}
          {analysis.dailyWin && (
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
              <Text style={styles.cardTitle}>Erkenntnis</Text>
              <Text style={styles.cardText}>{analysis.dailyWin}</Text>
            </View>
          )}

          {/* Session Insights */}
          <View style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: baseColors.white,
            padding: 16,
          }}>
            <Text style={styles.cardTitle}>Deine Chat Auswertung</Text>
            <View style={styles.insightsContainer}>
              {analysis.emotionalShift && (
                <View style={styles.card}>
                  <View style={styles.insightRowHeader}>
                    <View style={{ backgroundColor: baseColors.emerald, ...styles.insightEmojiContainer }}>
                      <Image source={require('@/assets/images/DNA.png')} style={{ width: 40, height: 40, marginTop: 2 }} />
                    </View>
                    <Text style={styles.insightLabel}>Emotionale Entwicklung</Text>
                  </View>
                  {/* <Text style={styles.insightEmoji}>🌡️</Text> */}
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightValue}>{analysis.emotionalShift}.</Text>
                  </View>
                </View>
              )}

              {analysis.iStatementMuscle !== undefined && (
                <View style={styles.card}>
                  <View style={styles.insightRowHeader}>
                    <View style={{ backgroundColor: baseColors.lilac, ...styles.insightEmojiContainer }}>
                      <Image source={require('@/assets/images/Mirror2.png')} style={{ width: 50, height: 50, marginTop: 10, marginLeft: -2 }} />
                    </View>
                    <Text style={styles.insightLabel}>Ich-Aussagen Anteil</Text>
                  </View>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightValue}>
                      {analysis.iStatementMuscle}% deiner Sprache fokussierte sich auf deine eigene Erfahrung.
                    </Text>
                  </View>
                </View>
              )}

              {analysis.clarityOfAsk && (
                <View style={styles.card}>
                  <View style={styles.insightRowHeader}>
                    <View style={{ backgroundColor: baseColors.zest, ...styles.insightEmojiContainer }}>
                      <Image source={require('@/assets/images/Mouth.png')} style={{ width: 30, height: 30, marginTop: 0, marginLeft: -2 }} />
                    </View>
                    <Text style={styles.insightLabel}>Klarheit der Bitte</Text>
                  </View>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightValue}>Deine finale Bitte war {analysis.clarityOfAsk}.</Text>
                  </View>
                </View>
              )}

              {analysis.empathyAttempt !== undefined && (
                <View style={styles.card}>
                  <View style={styles.insightRowHeader}>
                    <View style={{ backgroundColor: baseColors.purple, ...styles.insightEmojiContainer }}>
                      <Image source={require('@/assets/images/illustration-heartlilac.png')} style={{ width: 28, height: 28, marginTop: 2 }} />
                    </View>
                    <Text style={styles.insightLabel}>Empathie Versuch</Text>
                  </View>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightValue}>
                      {analysis.empathyAttempt
                        ? 'Du hast versucht, die Perspektive der anderen Person zu verstehen.'
                        : 'Du hast dich hauptsächlich auf deine eigene Perspektive konzentriert.'}
                    </Text>
                  </View>
                </View>
              )}

              {analysis.feelingVocabulary !== undefined && (
                <View style={styles.card}>
                  <View style={styles.insightRowHeader}>
                    <View style={{ backgroundColor: baseColors.lilac, ...styles.insightEmojiContainer }}>
                      <Image source={require('@/assets/images/Quote3.png')} style={{ width: 20, height: 20, marginTop: 2 }} />
                    </View>
                    <Text style={styles.insightLabel}>Gefühls-Wortschatz</Text>
                  </View>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightValue}>
                      Du hast {analysis.feelingVocabulary} unterschiedliche Gefühlswörter verwendet.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* NVC Components */}
          <View style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: baseColors.white,
            padding: 8,
            gap: 10,
            flexDirection: 'column',
            flex: 1,
          }}>

            <View style={styles.nvcCard}>
              <Text style={styles.nvcTitle}>Beobachtung</Text>
              {analysis.observation ? (
                <Text style={styles.nvcText}>{analysis.observation}</Text>
              ) : (
                <Text style={styles.nvcEmptyText}>Keine Beobachtung erfasst</Text>
              )}
            </View>

            <View style={styles.nvcCard}>
              <Text style={styles.nvcTitle}>Gefühle</Text>
              {analysis.feelings && analysis.feelings.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {analysis.feelings.map((feeling, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{feeling}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.nvcEmptyText}>Keine Gefühle erfasst</Text>
              )}
            </View>

            <View style={styles.nvcCard}>
              <Text style={styles.nvcTitle}>Bedürfnisse</Text>
              {analysis.needs && analysis.needs.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {analysis.needs.map((need, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{need}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.nvcEmptyText}>Keine Bedürfnisse erfasst</Text>
              )}
            </View>

            <View style={styles.nvcCard}>
              <Text style={styles.nvcTitle}>Bitte</Text>
              {analysis.request ? (
                <Text style={styles.nvcText}>{analysis.request}</Text>
              ) : (
                <Text style={styles.nvcEmptyText}>Keine Bitte erfasst</Text>
              )}
            </View>
          </View>

          

          {/* Chat History */}
          {analysis.chatHistory && analysis.chatHistory.length > 0 && (
            <View style={[styles.chatContainer, chatExpanded && styles.chatContainerExpanded]}>
              <Text style={styles.chatTitle}>Chat</Text>
              <ScrollView
                style={styles.chatMessagesScroll}
                contentContainerStyle={styles.chatMessages}
                nestedScrollEnabled={true}
              >
                {analysis.chatHistory
                  .filter((msg) => !msg.hidden)
                  .map((message, index) => (
                    <MessageBubble key={index} message={message} />
                  ))}
              </ScrollView>
              {/* <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setChatExpanded(!chatExpanded)}
              >
                <ChevronDown
                  size={16}
                  color="#fff"
                  style={[styles.expandIcon, chatExpanded && styles.expandIconRotated]}
                />
              </TouchableOpacity> */}
              {!chatExpanded && <View style={styles.chatGradient} />}
            </View>
          )}

          {/* Reopen Chat Button */}
          {analysis.chatId && (
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity
                onPress={handleReopenChat}
                disabled={isReopeningChat}
              >
                <ImageBackground
                  source={jungleImage}
                  resizeMode="cover"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    gap: 16,
                    paddingVertical: 8,
                    paddingLeft: 16,
                    paddingRight: 8,
                    borderRadius: 999,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {isReopeningChat ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <>
                      <Text style={{ fontSize: 14, color: baseColors.offwhite }}>
                        Chat fortsetzen
                      </Text>
                      <MessageSquare size={16} color="#fff" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                    </>
                  )}
                </ImageBackground>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: baseColors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 120 : 80,
    paddingBottom: Platform.OS === 'ios' ? 120 : 110, // Extra padding for tab bar
  },
  backButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  backButtonInlineText: {
    fontSize: 14,
    color: '#000',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    lineHeight: 26,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  goalCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  goalEmoji: {
    fontSize: 28,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: '#1e40af',
  },
  card: {
    marginHorizontal: -8,
    gap: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    backgroundColor: baseColors.offwhite + '90',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    position: 'relative',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#000',
  },
  insightsContainer: {
    gap: 10,
    marginBottom: -6,
  },
  insightRow: {
    flexDirection: 'column',
    gap: 8,
  },
  insightRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    marginLeft: -1,
    marginTop: -1,
  },
  insightEmojiContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    overflow: 'hidden',
  },
  insightTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  insightLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  insightValue: {
    fontSize: 14,
    color: '#000',
  },
  nvcCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    backgroundColor: baseColors.offwhite + '90',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    position: 'relative',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  nvcTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  nvcText: {
    fontSize: 14,
    color: '#444',
  },
  nvcEmptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#000',
  },
  chatContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    maxHeight: 384,
    overflow: 'hidden',
    position: 'relative',
  },
  chatContainerExpanded: {
    maxHeight: undefined,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  chatMessagesScroll: {
    maxHeight: 320,
  },
  chatMessages: {
    gap: 16,
    paddingBottom: 40,
  },
  expandButton: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -12 }],
    zIndex: 10,
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  chatGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    // Note: LinearGradient would be better but keeping simple for now
  },
});
