/**
 * LearnAIQuestion component for React Native Expo
 * Allows users to answer a question and receive AI feedback
 */

import baseColors from '@/baseColors.config';
import GroupedFeelingsSelector from '@/components/chat/GroupedFeelingsSelector';
import GroupedNeedsSelector from '@/components/chat/GroupedNeedsSelector';
import LearnMessageInput, {
  LearnInputExistingResponseButton,
  LearnInputFeelingsButton,
  LearnInputNeedsButton,
  LearnInputPrevButton,
} from '@/components/learn/LearnMessageInput';
import LearnNavigation from '@/components/learn/LearnNavigation';
import { getFeelings, getNeeds, type Feeling, type Need } from '@/lib/api/chat';
import { askAIQuestion, type LearningSession } from '@/lib/api/learn';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

interface LearnAIQuestionProps {
  content: {
    type: 'aiQuestion';
    question: string;
    systemPrompt?: string;
    placeholder?: string;
    showFeelingsButton?: boolean;
    showNeedsButton?: boolean;
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
  isPreview?: boolean;
}

export default function LearnAIQuestion({
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
  isPreview = false,
}: LearnAIQuestionProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [feelings, setFeelings] = useState<Feeling[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [feelingSelectorVisible, setFeelingSelectorVisible] = useState(false);
  const [needSelectorVisible, setNeedSelectorVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);

  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

  // Check for existing response in session
  const existingResponse = session?.responses?.find(
    (r) =>
      r.blockType === 'aiQuestion' &&
      JSON.stringify(r.blockContent) === JSON.stringify(contentBlock)
  );

  // Debug logging on component load and when key values change
  useEffect(() => {
    console.log('=== LearnAIQuestion Component Load/Render ===');
    console.log('currentStep:', currentStep);
    console.log('internalStep:', internalStep);
    console.log('totalSteps:', totalSteps);
    console.log('totalSteps[currentStep]:', totalSteps[currentStep]);
    console.log('hasSubmitted:', hasSubmitted);
    console.log('aiResponse:', aiResponse ? aiResponse.substring(0, 50) + '...' : null);
    console.log('userAnswer:', userAnswer);
    console.log('existingResponse:', existingResponse);
    console.log('isLoading:', isLoading);
    console.log('errorMessage:', errorMessage);
    console.log('session:', session ? 'exists' : 'null');
    console.log('contentBlock:', contentBlock);
    console.log('===========================================');
  }, [currentStep, internalStep, hasSubmitted, aiResponse, userAnswer, existingResponse, isLoading, errorMessage, totalSteps, session, contentBlock]);

  // Initialize from existing response if available
  useEffect(() => {
    if (existingResponse?.response) {
      const response = existingResponse.response;
      setUserAnswer(response.userAnswer || '');
      setAiResponse(response.aiResponse || '');
      setHasSubmitted(!!response.aiResponse);
      setResponseTime(response.responseTime || null);
    }
  }, [existingResponse]);

  // Clear error message when user starts typing
  useEffect(() => {
    if (userAnswer && errorMessage) {
      setErrorMessage('');
    }
  }, [userAnswer, errorMessage]);

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

  // Load feelings and needs on mount if buttons are enabled
  useEffect(() => {
    const loadData = async () => {
      if (content.showFeelingsButton || content.showNeedsButton) {
        setIsLoadingData(true);
        try {
          const promises: Promise<Feeling[] | Need[]>[] = [];
          if (content.showFeelingsButton) {
            promises.push(getFeelings());
          }
          if (content.showNeedsButton) {
            promises.push(getNeeds());
          }
          const results = await Promise.all(promises);
          let idx = 0;
          if (content.showFeelingsButton && results[idx]) {
            setFeelings(results[idx] as Feeling[]);
            idx++;
          }
          if (content.showNeedsButton && results[idx]) {
            setNeeds(results[idx] as Need[]);
          }
        } catch (error) {
          console.error('Failed to load feelings/needs:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    loadData();
  }, [content.showFeelingsButton, content.showNeedsButton]);

  const submitAnswer = async () => {
    if (!userAnswer.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    const startTime = Date.now();

    try {
      const response = await askAIQuestion(
        content.question,
        userAnswer.trim(),
        content.systemPrompt || ''
      );

      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);
      setResponseTime(timeTaken);

      setAiResponse(response);
      setHasSubmitted(true);

      // Save the response
      await onResponse({
        userAnswer: userAnswer.trim(),
        aiResponse: response,
        timestamp: new Date().toISOString(),
        responseTime: timeTaken,
      });

      // Advance to internalStep 1 to show the response view
      gotoNextStep?.();
    } catch (error) {
      console.error('Error getting AI response:', error);
      setErrorMessage(
        "Sorry, I couldn't process your answer right now. Please try again."
      );
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const addText = (text: string) => {
    if (!textInputRef.current) {
      // Fallback: just append to the end
      const currentText = userAnswer;
      const textToAdd =
        currentText && currentText[currentText.length - 1] !== ' ' ? ' ' + text : text;
      setUserAnswer(currentText + textToAdd);
      return;
    }

    // Get the current selection/cursor position
    const currentText = userAnswer;
    const selectionStart = textInputRef.current.selectionStart || currentText.length;
    const selectionEnd = textInputRef.current.selectionEnd || currentText.length;

    // Determine what text to insert
    let textToInsert = text;
    if (selectionStart > 0 && currentText[selectionStart - 1] !== ' ') {
      textToInsert = ' ' + text;
    }

    // Insert the text at the cursor position
    const newText =
      currentText.substring(0, selectionStart) +
      textToInsert +
      currentText.substring(selectionEnd);
    setUserAnswer(newText);

    // Set cursor position after inserted text (setNativeProps not available on web)
    const newCursorPosition = selectionStart + textToInsert.length;
    setTimeout(() => {
      const input = textInputRef.current;
      if (input && typeof (input as any).setNativeProps === 'function') {
        (input as any).setNativeProps({
          selection: { start: newCursorPosition, end: newCursorPosition },
        });
      }
    }, 0);
  };

  const toggleFeelingSelector = () => {
    setNeedSelectorVisible(false);
    setFeelingSelectorVisible((prev) => !prev);
  };

  const toggleNeedSelector = () => {
    setFeelingSelectorVisible(false);
    setNeedSelectorVisible((prev) => !prev);
  };

  // Check render decision
  console.log('=== Render Decision ===');
  console.log('internalStep === 0:', internalStep === 0);
  console.log('internalStep === 1:', internalStep === 1);
  console.log('hasResponse:', !!(aiResponse || existingResponse?.response?.aiResponse || hasSubmitted));

  // Show response view FIRST when internalStep === 1 (ALWAYS, even if no response yet)
  if (internalStep === 1) {
    const responseText = aiResponse || existingResponse?.response?.aiResponse || '';

    console.log('=== Checking Response View ===');
    console.log('internalStep === 1:', true);
    console.log('responseText:', responseText ? responseText.substring(0, 50) + '...' : 'empty');
    console.log('hasSubmitted:', hasSubmitted);
    console.log('✅ RENDERING RESPONSE VIEW (internalStep === 1)');

    // ALWAYS show response view when internalStep === 1
    return (
      <View className="flex-grow flex-col justify-between">
        {responseText ? (
          <ScrollView
            className="flex-grow"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="flex-grow items-center justify-center px-4">
              <View className="max-h-80 rounded-lg">
                <Markdown
                  markdownit={markdownItInstance}
                  style={{
                    body: {
                      fontSize: 18,
                    },
                    paragraph: {
                      marginBottom: 12,
                    },
                  }}
                >
                  {responseText}
                </Markdown>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-grow items-center justify-center">
            <Text>Loading response...</Text>
          </View>
        )}

        {/* Navigation - ALWAYS show when on response step */}
        <View
          className="border-t border-black/10"
          style={{
            backgroundColor: baseColors.background,
            paddingTop: 16,
            marginLeft: -16,
            marginRight: -16,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <LearnNavigation
            onNext={() => {
              console.log('Navigation Next clicked');
              gotoNextStep?.();
            }}
            onPrev={() => {
              console.log('Navigation Prev clicked');
              gotoPrevStep?.();
            }}
            showPrev={true}
            nextText="Weiter"
          />
        </View>
      </View>
    );
  }

  // Show input form if internalStep === 0
  if (internalStep === 0) {
    // Step 1: Question and Answer Input
    console.log('✅ RENDERING INPUT FORM');
    const selectorVisible = feelingSelectorVisible || needSelectorVisible;
    return (
      <View className="flex flex-1 flex-col justify-between" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Question - scrollable so content stays visible when selector is expanded */}
        <ScrollView
          className="flex-1"
          style={{ minHeight: 0, flexBasis: 0 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Markdown
            markdownit={markdownItInstance}
            style={{
              body: {
                fontSize: 18,
                color: '#1f2937',
                lineHeight: 24,
                fontWeight: '500',
              },
              paragraph: {
                marginBottom: 12,
              },
            }}
          >
            {content.question || ''}
          </Markdown>
        </ScrollView>

        {/* Input Section - in document flow */}
        <LearnMessageInput
          value={userAnswer}
          onChangeText={setUserAnswer}
          onSubmit={submitAnswer}
          placeholder={content.placeholder || 'Schreibe deine Antwort hier...'}
          disabled={isLoading}
          isLoading={isLoading}
          sendDisabled={!userAnswer.trim()}
          errorMessage={errorMessage}
          textInputRef={textInputRef}
          selectorContent={
            <>
              {content.showFeelingsButton && feelingSelectorVisible && (
                <View className="max-h-40 border-b border-black/5">
                  <GroupedFeelingsSelector
                    feelings={feelings}
                    onFeelingPress={addText}
                    isLoading={isLoadingData}
                    selectType="single"
                    highlightSelection={false}
                  />
                </View>
              )}
              {content.showNeedsButton && needSelectorVisible && (
                <View className="max-h-40 border-b border-black/5">
                  <GroupedNeedsSelector
                    needs={needs}
                    onNeedPress={addText}
                    isLoading={isLoadingData}
                  />
                </View>
              )}
            </>
          }
          leftActions={
            <>
              {gotoPrevStep && <LearnInputPrevButton onPress={gotoPrevStep} />}
              {existingResponse && (
                <LearnInputExistingResponseButton
                  onPress={() => gotoNextStep?.()}
                  compact={content.showFeelingsButton || content.showNeedsButton}
                />
              )}
              {content.showFeelingsButton && !isPreview && (
                <LearnInputFeelingsButton
                  visible={feelingSelectorVisible}
                  onPress={toggleFeelingSelector}
                  disabled={isLoadingData}
                />
              )}
              {content.showNeedsButton && !isPreview && (
                <LearnInputNeedsButton
                  visible={needSelectorVisible}
                  onPress={toggleNeedSelector}
                  disabled={isLoadingData}
                />
              )}
            </>
          }
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Enter' && !(e.nativeEvent as { shiftKey?: boolean }).shiftKey) {
              e.preventDefault();
            }
          }}
          onBeforeSubmit={() => {
            setFeelingSelectorVisible(false);
            setNeedSelectorVisible(false);
          }}
        />
      </View>
    );
  }

  // Fallback: Should not reach here, but if we do, show input form
  console.log('⚠️ FALLBACK: Rendering null (should not happen)');
  return null;
}

