/**
 * LearnAIQuestion component for React Native Expo
 * Allows users to answer a question and receive AI feedback
 */

import Swirl from '@/assets/icons/Swirl';
import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import GroupedFeelingsSelector from '@/components/chat/GroupedFeelingsSelector';
import GroupedNeedsSelector from '@/components/chat/GroupedNeedsSelector';
import LearnNavigation from '@/components/learn/LearnNavigation';
import { getFeelings, getNeeds, type Feeling, type Need } from '@/lib/api/chat';
import { askAIQuestion, type LearningSession } from '@/lib/api/learn';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
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
  onParentNavigationVisibilityChange?: (visible: boolean) => void;
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
  onParentNavigationVisibilityChange,
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

  // Notify parent about navigation visibility immediately and when internalStep changes
  // Always hide parent navigation - component handles its own navigation
  // Use useLayoutEffect to run synchronously before paint to avoid flicker
  useLayoutEffect(() => {
    onParentNavigationVisibilityChange?.(false);
  }, [internalStep, onParentNavigationVisibilityChange]);

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
          const promises = [];
          if (content.showFeelingsButton) {
            promises.push(getFeelings());
          }
          if (content.showNeedsButton) {
            promises.push(getNeeds());
          }
          const [feelingsData, needsData] = await Promise.all(promises);
          if (content.showFeelingsButton && feelingsData) {
            setFeelings(feelingsData);
          }
          if (content.showNeedsButton && needsData) {
            setNeeds(needsData);
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

    // Set cursor position after inserted text
    const newCursorPosition = selectionStart + textToInsert.length;
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.setNativeProps({
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
              <View className="max-w-sm max-h-80 rounded-lg p-4">
                <Markdown
                  markdownit={markdownItInstance}
                  style={{
                    body: {
                      fontSize: 16,
                      color: '#1f2937',
                      lineHeight: 22,
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
          className="px-4 py-4 border-t border-black/10"
          style={{ backgroundColor: baseColors.background }}
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
    return (
      <View className="flex-grow flex-col justify-between">
        {/* Question */}
        <View className="flex-grow items-center justify-center px-4">
          <View className="max-w-[20em]">
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
          </View>
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
              {/* Text Input */}
            <TextInput
              ref={textInputRef}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder={content.placeholder || 'Schreibe deine Antwort hier...'}
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              className="flex-1 rounded-md bg-transparent px-2 py-1 text-base"
              style={styles.textInput}
              multiline
              scrollEnabled={true}
              maxLength={2000}
              editable={!isLoading}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => {
                setFeelingSelectorVisible(false);
                setNeedSelectorVisible(false);
                submitAnswer();
              }}
            />

            {/* Feelings selector */}
            {content.showFeelingsButton && feelingSelectorVisible && (
              <View className="max-h-40 border-b border-gray-200">
                <GroupedFeelingsSelector
                  feelings={feelings}
                  onFeelingPress={addText}
                  isLoading={isLoadingData}
                />
              </View>
            )}

            {/* Needs selector */}
            {content.showNeedsButton && needSelectorVisible && (
              <View className="max-h-40 border-b border-gray-200">
                <GroupedNeedsSelector
                  needs={needs}
                  onNeedPress={addText}
                  isLoading={isLoadingData}
                />
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row items-end justify-between">
              <View className="flex-row items-center gap-2">
                {/* Previous Button */}
                {gotoPrevStep && (
                  <TouchableOpacity
                    onPress={gotoPrevStep}
                    className="flex items-center gap-2 rounded-full bg-white px-1 py-1"
                    style={styles.shadowButton}
                  >
                    <View className="flex h-4 w-4 items-center justify-center rounded-full">
                      <ChevronLeft size={12} color="#000" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Show existing response button */}
                {existingResponse && (
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
                )}

                {/* Feelings button */}
                {content.showFeelingsButton && !isPreview && (
                  <TouchableOpacity
                    onPress={toggleFeelingSelector}
                    className={`flex-row items-center gap-1 rounded-full pl-1 pr-2 py-1 ${
                      feelingSelectorVisible
                        ? 'bg-black/10 shadow-inner'
                        : 'bg-white'
                    }`}
                    style={!feelingSelectorVisible ? styles.shadowButton : undefined}
                    disabled={isLoadingData}
                  >
                    <View
                      className={`w-[1.2em] rounded-full p-[0.1em] ${
                        feelingSelectorVisible
                          ? 'bg-black'
                          : 'bg-black/10'
                      }`}
                    >
                      <Heart
                        size={12}
                        color={feelingSelectorVisible ? '#fff' : baseColors.pink}
                        fill={feelingSelectorVisible ? '#fff' : baseColors.pink}
                      />
                    </View>
                    <Text className={`text-xs ${feelingSelectorVisible ? 'text-black' : 'text-black/60'}`}>Gefühle</Text>
                  </TouchableOpacity>
                )}

                {/* Needs button */}
                {content.showNeedsButton && !isPreview && (
                  <TouchableOpacity
                    onPress={toggleNeedSelector}
                    className={`flex-row items-center gap-1 rounded-full pl-1 pr-2 py-1 ${
                      needSelectorVisible
                        ? 'bg-black/10 shadow-inner'
                        : 'bg-white'
                    }`}
                    style={!needSelectorVisible ? styles.shadowButton : undefined}
                    disabled={isLoadingData}
                  >
                    <View
                      className={`w-[1.2em] rounded-full p-[0.1em] ${
                        needSelectorVisible
                          ? 'bg-black'
                          : 'bg-black/10'
                      }`}
                    >
                      <Swirl
                        size={12}
                        color={needSelectorVisible ? '#fff' : baseColors.forest}
                      />
                    </View>
                    <Text className={`text-xs ${needSelectorVisible ? 'text-black' : 'text-black/60'}`}>Bedürfnisse</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={() => {
                  setFeelingSelectorVisible(false);
                  setNeedSelectorVisible(false);
                  submitAnswer();
                }}
                disabled={!userAnswer.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black"
                style={styles.shadowButton}
              >
                {isLoading ? (
                  <LoadingIndicator inline />
                ) : (
                  <Send size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            </View>
          </View>

          {/* Error message display */}
          {errorMessage && (
            <View className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-800">{errorMessage}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Fallback: Should not reach here, but if we do, show input form
  console.log('⚠️ FALLBACK: Rendering null (should not happen)');
  return null;
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

