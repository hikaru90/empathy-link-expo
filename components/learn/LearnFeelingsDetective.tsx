/**
 * LearnFeelingsDetective component for React Native Expo
 * Multi-step component for exploring feelings in situations
 */

import baseColors from '@/baseColors.config';
import GroupedFeelingsSelector from '@/components/chat/GroupedFeelingsSelector';
import LearnNavigation from '@/components/learn/LearnNavigation';
import { getFeelings, type Feeling } from '@/lib/api/chat';
import { feelingsDetectiveAI, type LearningSession } from '@/lib/api/learn';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

interface LearnFeelingsDetectiveProps {
  content: {
    type: 'feelingsDetective';
    question?: string;
  };
  color: string;
  session: LearningSession | null;
  contentBlock: any;
  currentStep: number;
  totalSteps: Array<{ component: string; internalStep: number }>;
  topicVersionId: string;
  onResponse: (response: any) => void;
  gotoNextStep?: () => void;
  gotoPrevStep?: () => void;
  onParentNavigationVisibilityChange?: (visible: boolean) => void;
  isPreview?: boolean;
}

export default function LearnFeelingsDetective({
  content,
  color,
  session,
  contentBlock,
  currentStep,
  totalSteps,
  topicVersionId,
  onResponse,
  gotoNextStep,
  gotoPrevStep,
  onParentNavigationVisibilityChange,
  isPreview = false,
}: LearnFeelingsDetectiveProps) {
  // Component state
  const [situationInput, setSituationInput] = useState('');
  const [thoughtsInput, setThoughtsInput] = useState('');
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [aiReflection, setAiReflection] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [feelings, setFeelings] = useState<Feeling[]>([]);
  const [feelingsLoading, setFeelingsLoading] = useState(true);
  const [feelingsError, setFeelingsError] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const situationInputRef = useRef<TextInput>(null);
  const thoughtsInputRef = useRef<TextInput>(null);

  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

  // Notify parent about navigation visibility
  // feelingsDetective handles its own navigation, so hide parent navigation
  useEffect(() => {
    onParentNavigationVisibilityChange?.(false);
  }, [internalStep, onParentNavigationVisibilityChange]);

  // Check for existing response in session
  const existingResponse = session?.responses?.find(
    (r) =>
      r.blockType === 'feelingsDetective' &&
      JSON.stringify(r.blockContent) === JSON.stringify(contentBlock)
  );

  // Initialize from existing response if available
  useEffect(() => {
    if (existingResponse?.response) {
      const response = existingResponse.response;
      setSituationInput(response.situationInput || '');
      setThoughtsInput(response.thoughtsInput || '');
      setSelectedFeelings(response.selectedFeelings || []);
      setAiReflection(response.aiReflection || '');
      setAiSummary(response.aiSummary || '');
      setResponseTime(response.responseTime || null);
    }
  }, [existingResponse]);

  // Load feelings on mount
  useEffect(() => {
    const loadFeelings = async () => {
      setFeelingsLoading(true);
      setFeelingsError(false);
      try {
        const feelingsData = await getFeelings();
        setFeelings(feelingsData);
      } catch (error) {
        console.error('Error loading feelings:', error);
        setFeelingsError(true);
      } finally {
        setFeelingsLoading(false);
      }
    };

    loadFeelings();
  }, []);

  // Handle keyboard show/hide on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      });
      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }
  }, []);

  // Clear error message when user starts typing
  useEffect(() => {
    if ((situationInput || thoughtsInput) && errorMessage) {
      setErrorMessage('');
    }
  }, [situationInput, thoughtsInput, errorMessage]);

  const submitSituation = async () => {
    if (!situationInput.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');
    const startTime = Date.now();

    try {
      const response = await feelingsDetectiveAI('reflection', situationInput.trim());

      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);
      setResponseTime(timeTaken);

      setAiReflection(response);

      // Save partial response
      const responseData = {
        situationInput: situationInput.trim(),
        aiReflection: response,
        thoughtsInput,
        selectedFeelings,
        aiSummary,
        timestamp: new Date().toISOString(),
        responseTime: timeTaken,
      };
      await onResponse(responseData);

      gotoNextStep?.();
    } catch (error) {
      console.error('Error getting AI response:', error);
      setErrorMessage("Sorry, I couldn't process your answer right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitThoughts = async () => {
    if (!thoughtsInput.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Update response data with thoughts
      const responseData = {
        situationInput,
        aiReflection,
        thoughtsInput: thoughtsInput.trim(),
        selectedFeelings,
        aiSummary,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
      };
      await onResponse(responseData);

      gotoNextStep?.();
    } catch (error) {
      console.error('Error saving thoughts:', error);
      setErrorMessage("Sorry, I couldn't save your thoughts right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeelings = async () => {
    if (selectedFeelings.length === 0 || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Update response data with feelings
      const responseData = {
        situationInput,
        aiReflection,
        thoughtsInput,
        selectedFeelings: [...selectedFeelings],
        aiSummary,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
      };
      await onResponse(responseData);

      gotoNextStep?.();
    } catch (error) {
      console.error('Error saving feelings:', error);
      setErrorMessage("Sorry, I couldn't save your feelings right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async () => {
    if (isLoading) return;

    // Validate that we have the required data
    if (!situationInput.trim()) {
      setErrorMessage('Please complete the situation input first');
      return;
    }

    if (!thoughtsInput.trim()) {
      setErrorMessage('Please complete the thoughts input first');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    const startTime = Date.now();

    try {
      // Convert feeling IDs to feeling names
      const feelingNames = selectedFeelings.map((id) => {
        const feeling = feelings.find((f) => f.id === id);
        return feeling?.nameDE || id;
      });

      const response = await feelingsDetectiveAI(
        'summary',
        situationInput,
        thoughtsInput,
        feelingNames
      );

      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);
      setResponseTime(timeTaken);

      setAiSummary(response);

      // Save final complete response
      await onResponse({
        situationInput,
        aiReflection,
        thoughtsInput,
        selectedFeelings,
        aiSummary: response,
        timestamp: new Date().toISOString(),
        responseTime: timeTaken,
      });

      // Don't call gotoNextStep here - the summary should be displayed in the same step
    } catch (error) {
      console.error('Error generating summary:', error);
      setErrorMessage("Sorry, I couldn't generate the summary right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 0: Situation Input
  if (internalStep === 0) {
    return (
      <View className="flex-grow flex-col justify-between">
        {/* Question */}
        <View className="flex-grow items-center justify-center px-4">
          <Text className="max-w-xs text-base font-medium text-gray-900">
            {content.question || 'Beschreibe eine Situation, die du erlebt hast:'}
          </Text>
        </View>

        {/* Input Section */}
        <View
          className="px-4 pb-4"
          style={{
            paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 16 : 16,
          }}
        >
          <View className="flex flex-col gap-2 rounded-2xl border border-white p-2 shadow-lg overflow-hidden">
            <LinearGradient
              colors={['#ffffff', baseColors.offwhite]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View className="flex flex-col gap-2 relative z-10">
              <TextInput
                ref={situationInputRef}
                value={situationInput}
                onChangeText={setSituationInput}
                placeholder="Mein Chef meinte ich würde seine Erwartungen enttäuschen..."
                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                className="flex-1 rounded-md bg-transparent px-2 py-1 text-base"
                style={styles.textInput}
                multiline
                scrollEnabled={true}
                maxLength={2000}
                editable={!isLoading}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={submitSituation}
              />

              {/* Action Buttons */}
              <View className="flex-row items-end justify-between">
                <View className="flex-row items-center gap-2">
                  {gotoPrevStep ? (
                    <TouchableOpacity
                      onPress={gotoPrevStep}
                      className="flex items-center gap-2 rounded-full bg-white px-1 py-1"
                      style={styles.shadowButton}
                    >
                      <View className="flex h-4 w-4 items-center justify-center rounded-full">
                        <ChevronLeft size={12} color="#000" />
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {existingResponse ? (
                    <TouchableOpacity
                      onPress={gotoNextStep}
                      className="flex flex-row items-center gap-2 rounded-full bg-white py-1 pl-3 pr-1"
                      style={styles.shadowButton}
                    >
                      <Text className="text-xs">Zur vorherigen Antwort</Text>
                      <View className="flex h-4 w-4 items-center justify-center rounded-full bg-black/5">
                        <ChevronRight size={12} color="#000" />
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={submitSituation}
                  disabled={!situationInput.trim() || isLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black"
                  style={styles.shadowButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Error message display */}
          {errorMessage ? (
            <View className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-800">{errorMessage}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // Step 1: AI Reflection
  if (internalStep === 1) {
    if (aiReflection) {
      return (
        <View className="flex-grow flex-col justify-between">
          <ScrollView className="flex-grow" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-grow items-center justify-center px-4 py-6">
              <View className="max-w-xs">
                <Markdown
                  markdownit={markdownItInstance}
                  style={{
                    body: {
                      fontSize: 16,
                      color: '#374151',
                      lineHeight: 22,
                    },
                    paragraph: {
                      marginBottom: 12,
                    },
                  }}
                >
                  {aiReflection}
                </Markdown>
              </View>
            </View>
          </ScrollView>

          {/* Navigation */}
          <View
            className="px-4 py-4 border-t border-black/10"
            style={{ backgroundColor: baseColors.background }}
          >
            <LearnNavigation
              onNext={() => {
                gotoNextStep?.();
              }}
              onPrev={() => {
                gotoPrevStep?.();
              }}
              showPrev={true}
              nextText="Genau"
            />
          </View>
        </View>
      );
    } else {
      // AI Reflection is missing - show error/retry UI
      return (
        <View className="flex-grow flex-col items-center justify-center p-8" style={{ gap: 16 }}>
          <View className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <Text className="mb-2 text-center text-lg font-semibold text-yellow-900">
              Reflexion fehlt
            </Text>
            <Text className="mb-4 text-center text-sm text-yellow-800">
              Die KI-Reflexion konnte nicht geladen werden. Du kannst sie neu erstellen oder zum
              nächsten Schritt springen.
            </Text>
            <View style={{ gap: 8 }}>
              {situationInput.trim() ? (
                <TouchableOpacity
                  onPress={submitSituation}
                  disabled={isLoading}
                  className="rounded-lg bg-yellow-600 px-4 py-2"
                  style={{ opacity: isLoading ? 0.5 : 1 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-center text-white">Reflexion neu erstellen</Text>
                  )}
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => gotoNextStep?.()}
                className="rounded-lg bg-gray-600 px-4 py-2"
              >
                <Text className="text-center text-white">Überspringen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => gotoPrevStep?.()}
                className="rounded-lg bg-gray-200 px-4 py-2"
              >
                <Text className="text-center text-gray-700">Zurück</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
  }

  // Step 2: Thoughts Input
  if (internalStep === 2) {
    return (
      <View className="flex-grow flex-col justify-between">
        {/* Question */}
        <View className="flex-grow items-center justify-center px-4">
          <Text className="max-w-xs text-center text-base font-medium text-gray-900">
            Welche Urteile und Bewertungen hattest Du spontan im Kopf?
          </Text>
        </View>

        {/* Input Section */}
        <View
          className="px-4 pb-4"
          style={{
            paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 16 : 16,
          }}
        >
          <View className="flex flex-col gap-2 rounded-2xl border border-white p-2 shadow-lg overflow-hidden">
            <LinearGradient
              colors={['#ffffff', baseColors.offwhite]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View className="flex flex-col gap-2 relative z-10">
              <TextInput
                ref={thoughtsInputRef}
                value={thoughtsInput}
                onChangeText={setThoughtsInput}
                placeholder="Ich habe gedacht ich sei nicht gut genug..."
                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                className="flex-1 rounded-md bg-transparent px-2 py-1 text-base"
                style={styles.textInput}
                multiline
                scrollEnabled={true}
                maxLength={2000}
                editable={!isLoading}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={submitThoughts}
              />

              {/* Action Buttons */}
              <View className="flex-row items-end justify-between">
                {gotoPrevStep ? (
                  <TouchableOpacity
                    onPress={gotoPrevStep}
                    className="flex items-center gap-2 rounded-full bg-white px-1 py-1"
                    style={styles.shadowButton}
                  >
                    <View className="flex h-4 w-4 items-center justify-center rounded-full">
                      <ChevronLeft size={12} color="#000" />
                    </View>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={submitThoughts}
                  disabled={!thoughtsInput.trim() || isLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black"
                  style={styles.shadowButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Error message display */}
          {errorMessage ? (
            <View className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-800">{errorMessage}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // Step 3: Feelings Selection
  if (internalStep === 3) {
    return (
      <View className="flex-grow flex-col justify-between">
        <View className="flex-grow flex-col justify-center space-y-4">
          <View className="flex-grow items-center justify-center px-4">
            <Text className="max-w-xs text-center text-base font-medium text-gray-900">
              Welche Gefühle löst diese Situation in Dir aus?
            </Text>
          </View>

          <View className="max-h-64">
            {feelingsLoading ? (
              <View className="flex items-center justify-center p-8">
                <ActivityIndicator size="small" color="#9ca3af" />
                <Text className="ml-2 text-sm text-gray-600">Gefühle werden geladen...</Text>
              </View>
            ) : feelingsError ? (
              <View className="rounded-lg border border-red-200 bg-red-50 p-4">
                <Text className="mb-2 text-sm text-red-800">
                  Fehler beim Laden der Gefühle. Bitte versuche es erneut.
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    setFeelingsLoading(true);
                    setFeelingsError(false);
                    try {
                      const feelingsData = await getFeelings();
                      setFeelings(feelingsData);
                    } catch (error) {
                      setFeelingsError(true);
                    } finally {
                      setFeelingsLoading(false);
                    }
                  }}
                  className="mt-2 rounded-lg bg-red-600 px-3 py-1"
                >
                  <Text className="text-xs text-white">Erneut versuchen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView className="max-h-64">
                <GroupedFeelingsSelector
                  feelings={feelings}
                  onFeelingPress={(feelingName) => {
                    // Find feeling by nameDE
                    const feeling = feelings.find((f) => f.nameDE === feelingName);
                    if (feeling) {
                      setSelectedFeelings((prev) => {
                        if (prev.includes(feeling.id)) {
                          return prev.filter((id) => id !== feeling.id);
                        } else {
                          return [...prev, feeling.id];
                        }
                      });
                    }
                  }}
                  isLoading={feelingsLoading}
                />
              </ScrollView>
            )}
          </View>
        </View>

        {/* Navigation */}
        <View
          className="px-4 py-4 border-t border-black/10"
          style={{ backgroundColor: baseColors.background }}
        >
          <LearnNavigation
            onNext={submitFeelings}
            onPrev={gotoPrevStep}
            showPrev={!!gotoPrevStep}
            nextText="Weiter"
          />
        </View>
      </View>
    );
  }

  // Step 4: Generate/Display Summary
  if (internalStep === 4) {
    if (!aiSummary) {
      return (
        <View className="flex-grow flex-col justify-between">
          <View className="flex-grow items-center justify-center px-4">
            <Text className="text-center text-base font-medium text-gray-900">
              Lass uns eine Zusammenfassung deiner Erkenntnisse erstellen.
            </Text>
          </View>

          {isLoading ? (
            <View className="flex items-center justify-center">
              <ActivityIndicator size="small" />
              <Text className="ml-2">Erstelle Zusammenfassung...</Text>
            </View>
          ) : (
            <View
              className="px-4 py-4 border-t border-black/10"
              style={{ backgroundColor: baseColors.background }}
            >
              <LearnNavigation
                onNext={generateSummary}
                onPrev={gotoPrevStep}
                showPrev={!!gotoPrevStep}
                nextText="Zusammenfassung erstellen"
              />
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View className="flex-grow flex-col justify-between">
          <ScrollView className="flex-grow" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-grow items-center justify-center px-4 py-6">
              <View className="max-w-sm max-h-80">
                <Markdown
                  markdownit={markdownItInstance}
                  style={{
                    body: {
                      fontSize: 16,
                      color: '#374151',
                      lineHeight: 22,
                    },
                    paragraph: {
                      marginBottom: 12,
                    },
                  }}
                >
                  {aiSummary}
                </Markdown>
              </View>
            </View>
          </ScrollView>

          {/* Navigation */}
          <View
            className="px-4 py-4 border-t border-black/10"
            style={{ backgroundColor: baseColors.background }}
          >
            <LearnNavigation
              onNext={() => {
                gotoNextStep?.();
              }}
              onPrev={gotoPrevStep}
              showPrev={!!gotoPrevStep}
              nextText="Weiter"
            />
          </View>
        </View>
      );
    }
  }

  // Fallback: Unknown step
  return (
    <View className="flex-grow flex-col items-center justify-center p-8" style={{ gap: 16 }}>
      <View className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <Text className="mb-2 text-center text-lg font-semibold text-yellow-900">
          Unerwarteter Schritt
        </Text>
        <Text className="mb-2 text-center text-sm text-yellow-800">
          Interner Schritt: {internalStep}
        </Text>
        <Text className="mb-4 text-center text-sm text-yellow-800">
          Aktueller Schritt: {currentStep} von {totalSteps?.length ?? '?'}
        </Text>
        {gotoPrevStep ? (
          <TouchableOpacity
            onPress={gotoPrevStep}
            className="rounded-lg bg-yellow-600 px-4 py-2"
          >
            <Text className="text-center text-white">Zurück</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 40,
    maxHeight: 120,
  },
  shadowButton: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

