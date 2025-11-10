import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, MessageSquare, Play, RefreshCw, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import baseColors from '@/baseColors.config';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import { useAuthGuard } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { getAnalysisById } from '@/lib/api/analysis';

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
  chatHistory?: any[];
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
      router.replace('/(protected)/(tabs)/');
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
        <ActivityIndicator size="large" color={baseColors.lilac} />
        <Text style={styles.loadingText}>Lade Analyse...</Text>
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

        <View style={styles.contentContainer}>
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Erkenntnis</Text>
              <Text style={styles.cardText}>{analysis.dailyWin}</Text>
            </View>
          )}

          {/* Session Insights */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deine Session Auswertung</Text>
            <View style={styles.insightsContainer}>
              {analysis.emotionalShift && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>🌡️</Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightLabel}>Emotionale Entwicklung: </Text>
                    <Text style={styles.insightValue}>{analysis.emotionalShift}.</Text>
                  </View>
                </View>
              )}

              {analysis.iStatementMuscle !== undefined && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>💪</Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightLabel}>Ich-Aussagen Muskel: </Text>
                    <Text style={styles.insightValue}>
                      {analysis.iStatementMuscle}% deiner Sprache fokussierte sich auf deine eigene Erfahrung.
                    </Text>
                  </View>
                </View>
              )}

              {analysis.clarityOfAsk && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>🎯</Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightLabel}>Klarheit der Bitte: </Text>
                    <Text style={styles.insightValue}>Deine finale Bitte war {analysis.clarityOfAsk}.</Text>
                  </View>
                </View>
              )}

              {analysis.empathyAttempt !== undefined && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>❤️</Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightLabel}>Empathie Versuch: </Text>
                    <Text style={styles.insightValue}>
                      {analysis.empathyAttempt
                        ? 'Du hast versucht, die Perspektive der anderen Person zu verstehen.'
                        : 'Du hast dich hauptsächlich auf deine eigene Perspektive konzentriert.'}
                    </Text>
                  </View>
                </View>
              )}

              {analysis.feelingVocabulary !== undefined && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>🧠</Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightLabel}>Gefühls-Wortschatz: </Text>
                    <Text style={styles.insightValue}>
                      Du hast {analysis.feelingVocabulary} unterschiedliche Gefühlswörter verwendet.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* NVC Components */}
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

          {/* Reopen Chat Button */}
          {analysis.chatId && (
            <TouchableOpacity
              style={styles.reopenButton}
              onPress={handleReopenChat}
              disabled={isReopeningChat}
            >
              {isReopeningChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MessageSquare size={16} color="#fff" />
                  <Text style={styles.reopenButtonText}>Chat fortsetzen</Text>
                </>
              )}
            </TouchableOpacity>
          )}

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
                  .map((message, index) => {
                    const translatePathName = (path: string): string => {
                      const translations: Record<string, string> = {
                        'idle': 'Gesprächsführung',
                        'self_empathy': 'Selbst-Empathie',
                        'other_empathy': 'Fremd-Empathie',
                        'action_planning': 'Handlungsplanung',
                        'conflict_resolution': 'Konfliktlösung',
                        'feedback': 'Gespräch beenden',
                        'memory': 'Erinnerungen',
                      };
                      return translations[path] || path;
                    };

                    const getPathMarkerIcon = () => {
                      if (!message.pathMarker) return null;

                      switch (message.pathMarker.type) {
                        case 'path_start': return <Play size={10} color="white" strokeWidth={2} />;
                        case 'path_switch': return <RefreshCw size={10} color="white" strokeWidth={2} />;
                        case 'path_end': return <Square size={10} color="white" strokeWidth={2} />;
                        default: return null;
                      }
                    };

                    const getPathMarkerText = () => {
                      if (!message.pathMarker) return '';
                      const pathName = translatePathName(message.pathMarker.path);

                      switch (message.pathMarker.type) {
                        case 'path_start': return `Gestartet: ${pathName}`;
                        case 'path_switch': return `Gewechselt zu: ${pathName}`;
                        case 'path_end': return `Abgeschlossen: ${pathName}`;
                        default: return pathName;
                      }
                    };

                    return (
                      <View key={index}>
                        {message.pathMarker ? (
                          <View style={styles.pathMarkerContainer}>
                            <View style={styles.pathMarker}>
                              <View style={{ backgroundColor: baseColors.lilac, borderRadius: 12, padding: 2 }}>
                                {getPathMarkerIcon()}
                              </View>
                              <Text style={styles.pathMarkerText}>
                                {getPathMarkerText()}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.messageBubble,
                              message.role === 'user' ? styles.userMessage : styles.modelMessage,
                            ]}
                          >
                            <Text style={styles.messageText}>
                              {message.parts[0]?.text || ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
              </ScrollView>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setChatExpanded(!chatExpanded)}
              >
                <ChevronDown
                  size={16}
                  color="#fff"
                  style={[styles.expandIcon, chatExpanded && styles.expandIconRotated]}
                />
              </TouchableOpacity>
              {!chatExpanded && <View style={styles.chatGradient} />}
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
  contentContainer: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  reopenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: baseColors.pink,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 32,
  },
  reopenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    gap: 16,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  insightValue: {
    fontSize: 14,
    color: '#000',
  },
  nvcCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  pathMarkerContainer: {
    alignItems: 'center',
    marginVertical: 4,
    marginHorizontal: 16,
  },
  pathMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginBottom: 8,
  },
  pathMarkerText: {
    fontSize: 12,
    color: baseColors.black,
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 0,
    marginLeft: 40,
  },
  modelMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#fff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginRight: 40,
  },
  messageText: {
    fontSize: 14,
    color: '#000',
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
