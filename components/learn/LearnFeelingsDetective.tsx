/**
 * LearnFeelingsDetective component for React Native Expo
 * Multi-step component for exploring feelings in situations
 */

import baseColors from '@/baseColors.config';
import GroupedFeelingsSelector from '@/components/chat/GroupedFeelingsSelector';
import LearnMessageInput, {
  LearnInputExistingResponseButton,
  LearnInputPrevButton,
} from '@/components/learn/LearnMessageInput';
import LearnNavigation from '@/components/learn/LearnNavigation';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useBottomDrawerSlot } from '@/hooks/use-bottom-drawer-slot';
import { getFeelings, type Feeling } from '@/lib/api/chat';
import { feelingsDetectiveAI, type LearningSession } from '@/lib/api/learn';
import { ChevronLeft, ChevronRight, Send, SquareMousePointer } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
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
  const [lastReflectionInput, setLastReflectionInput] = useState<string | null>(null);
  const [lastSummarySignature, setLastSummarySignature] = useState<string | null>(null);
  const [feelingsDrawerOpen, setFeelingsDrawerOpen] = useState(false);
  const situationInputRef = useRef<TextInput>(null);
  const thoughtsInputRef = useRef<TextInput>(null);
  const { openDrawer, closeDrawer } = useBottomDrawerSlot();

  const summaryInputSignature = useMemo(() => {
    return JSON.stringify({
      situation: situationInput.trim(),
      thoughts: thoughtsInput.trim(),
      feelings: [...selectedFeelings].sort(),
    });
  }, [situationInput, thoughtsInput, selectedFeelings]);

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
      setLastReflectionInput(response.situationInput?.trim() || null);
      if (response.aiSummary) {
        setLastSummarySignature(
          JSON.stringify({
            situation: response.situationInput?.trim() || '',
            thoughts: response.thoughtsInput?.trim() || '',
            feelings: [...(response.selectedFeelings || [])].sort(),
          })
        );
      } else {
        setLastSummarySignature(null);
      }
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

  useEffect(() => {
    if (
      aiReflection &&
      lastReflectionInput &&
      situationInput.trim() !== lastReflectionInput
    ) {
      setAiReflection('');
      setLastReflectionInput(null);
    }
  }, [aiReflection, lastReflectionInput, situationInput]);

  useEffect(() => {
    if (
      aiSummary &&
      lastSummarySignature &&
      summaryInputSignature !== lastSummarySignature
    ) {
      setAiSummary('');
      setLastSummarySignature(null);
    }
  }, [aiSummary, lastSummarySignature, summaryInputSignature]);

  // Keep detective feelings drawer slot in sync when selection changes (step 3 only)
  useEffect(() => {
    if (totalSteps[currentStep]?.internalStep !== 3 || !feelingsDrawerOpen) return;
    openDrawer({
      title: 'Gefühle wählen',
      tall: true,
      onClose: () => {
        setFeelingsDrawerOpen(false);
        closeDrawer();
      },
      children: (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View className="mb-2 flex-row flex-wrap gap-1">
            {selectedFeelings.map((id) => {
              const f = feelings.find((x) => x.id === id);
              return (
                <View
                  key={id}
                  className="rounded-full px-2 py-1"
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: baseColors.forest + '22' }}
                >
                  <Text className="text-xs text-gray-800">{f?.nameDE ?? id}</Text>
                </View>
              );
            })}
          </View>
          <GroupedFeelingsSelector
            feelings={feelings}
            isLoading={feelingsLoading}
            selectType="multiple"
            highlightSelection={true}
            selectedFeelingIds={selectedFeelings}
            onSelectionChange={setSelectedFeelings}
          />
        </ScrollView>
      ),
    });
  }, [
    currentStep,
    totalSteps,
    feelingsDrawerOpen,
    selectedFeelings,
    feelings,
    feelingsLoading,
    openDrawer,
    closeDrawer,
  ]);

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
      setLastReflectionInput(situationInput.trim());

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

      console.log('submitThoughts: Saving response data:', responseData);
      await onResponse(responseData);
      console.log('submitThoughts: Response saved successfully');

      console.log('submitThoughts: Current step:', currentStep);
      console.log('submitThoughts: Current internalStep:', internalStep);
      console.log('submitThoughts: Calling gotoNextStep');
      gotoNextStep?.();
      console.log('submitThoughts: gotoNextStep called');
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
      setLastSummarySignature(summaryInputSignature);

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
          className="px-4"
          style={{
            paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 24 : 24,
          }}
        >
          <LearnMessageInput
            value={situationInput}
            onChangeText={setSituationInput}
            onSubmit={submitSituation}
            placeholder="Mein Chef meinte ich würde seine Erwartungen enttäuschen..."
            disabled={isLoading}
            isLoading={isLoading}
            sendDisabled={!situationInput.trim()}
            errorMessage={errorMessage}
            textInputRef={situationInputRef}
            leftActions={
              <>
                {gotoPrevStep && <LearnInputPrevButton onPress={gotoPrevStep} />}
                {existingResponse && (
                  <LearnInputExistingResponseButton onPress={() => gotoNextStep?.()} />
                )}
              </>
            }
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'Enter' && !(e.nativeEvent as { shiftKey?: boolean }).shiftKey) {
                e.preventDefault();
              }
            }}
          />
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
            className="py-4 border-t border-black/10 px-4"
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
          className="px-4"
          style={{
            paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 24 : 24,
          }}
        >
          <LearnMessageInput
            value={thoughtsInput}
            onChangeText={setThoughtsInput}
            onSubmit={submitThoughts}
            placeholder="Ich habe gedacht ich sei nicht gut genug..."
            disabled={isLoading}
            isLoading={isLoading}
            sendDisabled={!thoughtsInput.trim()}
            errorMessage={errorMessage}
            textInputRef={thoughtsInputRef}
            leftActions={
              <>
                {gotoPrevStep && <LearnInputPrevButton onPress={gotoPrevStep} />}
              </>
            }
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'Enter' && !(e.nativeEvent as { shiftKey?: boolean }).shiftKey) {
                e.preventDefault();
              }
            }}
          />
        </View>
      </View>
    );
  }

  // Step 3: Feelings Selection (uses BottomDrawer slot)
  if (internalStep === 3) {
    const selectedFeelingItems = selectedFeelings
      .map((id) => feelings.find((f) => f.id === id))
      .filter((feeling): feeling is Feeling => Boolean(feeling));

    function openFeelingsSelectionDrawer() {
      setFeelingsDrawerOpen(true);
    }

    return (
      <View className="flex-grow flex-col justify-between">
        <View className="flex-grow flex-col justify-center space-y-4">
          <View className="flex-grow items-center justify-center px-4">
            <Text className="max-w-xs text-center text-base font-medium text-gray-900">
              Wie fühlst Du Dich in dieser Situation?
            </Text>
          </View>

          <View className="px-4">
            <View className="rounded-2xl border border-white bg-white/20 p-3 mb-5">
              <Text className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ausgewählte Gefühle
              </Text>
              {selectedFeelingItems.length > 0 ? (
                <View className="flex-row flex-wrap justify-center gap-2 mb-3">
                  {selectedFeelingItems.map((feeling) => (
                    <View
                      key={feeling.id}
                      className="rounded-full bg-black/5 px-3 py-1"
                    >
                      <Text className="text-sm text-gray-800">{feeling.nameDE}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {feelingsLoading ? (
                <View className="flex items-center justify-center py-4">
                  <LoadingIndicator inline />
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
                <View className="flex items-center justify-center">
                <TouchableOpacity
                  onPress={openFeelingsSelectionDrawer}
                  className="rounded-full border border-white bg-white/60 py-1 px-4 flex items-center justify-between flex-row gap-4"
                >
                  <Text className="text-base font-medium text-gray-800">
                    {selectedFeelingItems.length > 0 ? 'Auswahl ändern' : 'Gefühle wählen'}
                  </Text>
                  <SquareMousePointer size={16} color="#666" />
                </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Navigation */}
        <View
          className="py-4 border-t border-black/10 px-4"
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
          <ScrollView
            className="flex-grow"
            contentContainerStyle={{
              flexGrow: 1,
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingBottom: 6,
            }}
          >
            <View className="flex-grow items-center justify-center px-4">
              <Text className="text-center text-base font-medium text-gray-900 mt-4">
                Lass uns eine Zusammenfassung deiner Erkenntnisse erstellen.
              </Text>
            </View>


            {isLoading ? (
              <View className="py-4 flex flex-row items-center justify-center">
                <ActivityIndicator size="small" color={baseColors.forest} />
                <Text className="ml-2">Erstelle Zusammenfassung...</Text>
              </View>
            ) : (
              <View
                className="py-4 border-t border-black/10 px-4"
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
          </ScrollView>
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
            className="py-4 border-t border-black/10 px-4"
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

