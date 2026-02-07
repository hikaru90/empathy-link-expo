import baseColors from '@/baseColors.config';
import GroupedNeedsSelector from '@/components/chat/GroupedNeedsSelector';
import LearnMessageInput, {
  LearnInputExistingResponseButton,
  LearnInputNeedsButton,
  LearnInputPrevButton,
} from '@/components/learn/LearnMessageInput';
import { getNeeds, type Need } from '@/lib/api/chat';
import type { LearningSession } from '@/lib/api/learn';
import { needsDetectiveAI } from '@/lib/api/learn';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import LearnNavigation from './LearnNavigation';

const markdownItInstance = MarkdownIt({ html: true });

interface LearnNeedsDetectiveProps {
  content: any;
  color: string;
  session: LearningSession | null;
  contentBlock: any;
  currentStep: number;
  totalSteps: Array<{ component: string; internalStep: number }>;
  topicVersionId: string;
  onResponse: (response: any) => void;
  gotoNextStep?: () => void;
  gotoPrevStep?: () => void;
}

export default function LearnNeedsDetective({
  content,
  color,
  session,
  contentBlock,
  currentStep,
  totalSteps,
  onResponse,
  gotoNextStep,
  gotoPrevStep,
}: LearnNeedsDetectiveProps) {
  const [situationInput, setSituationInput] = useState('');
  const [thoughtsInput, setThoughtsInput] = useState('');
  const [needsInput, setNeedsInput] = useState('');
  const [aiReflection, setAiReflection] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [needs, setNeeds] = useState<Need[]>([]);
  const [needSelectorVisible, setNeedSelectorVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const needsInputRef = useRef<TextInput>(null);

  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

  const addNeed = useCallback((text: string) => {
    if (!needsInputRef.current) {
      const currentText = needsInput;
      const textToAdd =
        currentText && currentText[currentText.length - 1] !== ' ' ? ' ' + text : text;
      setNeedsInput(currentText + textToAdd);
      return;
    }
    const currentText = needsInput;
    const selectionStart = (needsInputRef.current as any).selectionStart ?? currentText.length;
    const selectionEnd = (needsInputRef.current as any).selectionEnd ?? currentText.length;
    let textToInsert = text;
    if (selectionStart > 0 && currentText[selectionStart - 1] !== ' ') {
      textToInsert = ' ' + text;
    }
    const newText =
      currentText.substring(0, selectionStart) +
      textToInsert +
      currentText.substring(selectionEnd);
    setNeedsInput(newText);
    const newCursorPosition = selectionStart + textToInsert.length;
    setTimeout(() => {
      const input = needsInputRef.current;
      if (input && typeof (input as any).setNativeProps === 'function') {
        (input as any).setNativeProps({
          selection: { start: newCursorPosition, end: newCursorPosition },
        });
      }
    }, 0);
  }, [needsInput]);

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

  const existingResponse = session?.responses?.find(
    (r) =>
      r.blockType === 'needsDetective' &&
      (JSON.stringify(r.blockContent) === JSON.stringify(contentBlock) ||
        (r.response?.needsInput != null && (r.response?.situationInput || r.response?.thoughtsInput)))
  )?.response;

  useEffect(() => {
    if (!session || initialized) return;
    if (existingResponse) {
      setSituationInput(existingResponse.situationInput || existingResponse.thoughtsInput || '');
      setThoughtsInput(existingResponse.thoughtsInput || existingResponse.situationInput || '');
      setNeedsInput(existingResponse.needsInput ?? '');
      setAiReflection(existingResponse.aiReflection ?? '');
      setAiSummary(existingResponse.aiSummary ?? '');
    }
    setInitialized(true);
  }, [session, existingResponse, initialized]);

  useEffect(() => {
    getNeeds()
      .then(setNeeds)
      .catch((e) => console.error('Error loading needs:', e));
  }, []);

  const submitCombinedInput = useCallback(async () => {
    if (!situationInput.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await needsDetectiveAI('reflection', situationInput.trim(), situationInput.trim());
      setAiReflection(response);
      onResponse({
        situationInput: situationInput.trim(),
        thoughtsInput: situationInput.trim(),
        aiReflection: response,
        needsInput,
        aiSummary,
        timestamp: new Date().toISOString(),
      });
      gotoNextStep?.();
    } catch (e) {
      console.error(e);
      setErrorMessage('Die Reflexion konnte gerade nicht geladen werden. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  }, [situationInput, needsInput, aiSummary, isLoading, onResponse, gotoNextStep]);

  const submitNeeds = useCallback(() => {
    onResponse({
      situationInput,
      thoughtsInput,
      aiReflection,
      needsInput,
      aiSummary,
      timestamp: new Date().toISOString(),
    });
    gotoNextStep?.();
  }, [situationInput, thoughtsInput, aiReflection, needsInput, aiSummary, onResponse, gotoNextStep]);

  const generateSummary = useCallback(async () => {
    if (isLoading || !situationInput.trim() || !thoughtsInput.trim() || !needsInput.trim()) {
      setErrorMessage('Bitte fülle zuerst Situation, Strategie und Bedürfnisse aus.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await needsDetectiveAI('summary', situationInput, thoughtsInput, needsInput.trim());
      setAiSummary(response);
      onResponse({
        situationInput,
        thoughtsInput,
        aiReflection,
        needsInput,
        aiSummary: response,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      setErrorMessage('Die Zusammenfassung konnte gerade nicht erstellt werden.');
    } finally {
      setIsLoading(false);
    }
  }, [situationInput, thoughtsInput, needsInput, aiReflection, isLoading, onResponse]);

  return (
    <View className="flex flex-1 flex-col rounded-lg">
      <View className="flex flex-1 flex-col justify-between rounded-lg">
        {internalStep === 0 && (
          <>
            <View className="flex-grow items-center justify-center px-0">
              <Text className="max-w-xs text-base font-medium text-gray-900">
                {content.question ||
                  'Beschreibe eine Situation, die du erlebt hast und welche Strategie du verwendet hast:'}
              </Text>
            </View>
            <View
              className="px-0"
              style={{
                paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 24 : 24,
              }}
            >
              <LearnMessageInput
                value={situationInput}
                onChangeText={setSituationInput}
                onSubmit={submitCombinedInput}
                placeholder="Ich war bei dem letzten Familienbesuch etwas geladen und habe dann einfach das Thema gewechselt..."
                disabled={isLoading}
                isLoading={isLoading}
                sendDisabled={!situationInput.trim()}
                errorMessage={errorMessage}
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
          </>
        )}

        {internalStep === 1 && aiReflection && (
          <>
            <View className="flex-grow flex-col justify-between">
              <ScrollView className="flex-grow" contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-grow items-center justify-center px-0 py-6">
                  <View className="max-w-xs">
                    <Markdown
                      markdownit={markdownItInstance}
                      style={{
                        body: { paddingHorizontal:8,paddingVertical:16, fontSize: 16, color: '#374151', lineHeight: 22 },
                        paragraph: { marginBottom: 12 },
                      }}
                    >
                      {`${aiReflection || ''} Stimmt diese Aussage?`}
                    </Markdown>
                  </View>
                </View>
              </ScrollView>
              <View
                className="border-t border-black/10"
                style={{
                  backgroundColor: baseColors.background,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 23 : 23,
                  marginLeft: -16,
                  marginRight: -16,
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              >
                <LearnNavigation
                  onNext={gotoNextStep ?? (() => {})}
                  onPrev={gotoPrevStep}
                  nextText="Genau"
                  showPrev={!!gotoPrevStep}
                />
              </View>
            </View>
          </>
        )}

        {internalStep === 2 && (
          <>
            <View className="flex-grow flex-col justify-between">
              <View className="flex-grow items-center justify-center px-0">
                <Text className="max-w-xs text-center text-base font-medium text-gray-900">
                  Welche Bedürfnisse hast Du Dir dadurch erfüllt?
                </Text>
              </View>
              <View
                className="px-0"
                style={{
                  paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 24 : 24,
                }}
              >
                <LearnMessageInput
                  value={needsInput}
                  onChangeText={setNeedsInput}
                  onSubmit={submitNeeds}
                  placeholder="Sicherheit, Verständnis, Autonomie..."
                  disabled={isLoading}
                  isLoading={isLoading}
                  sendDisabled={false}
                  errorMessage={errorMessage}
                  textInputRef={needsInputRef}
                  selectorContent={
                    needSelectorVisible ? (
                      <View className="max-h-40 border-b border-black/5">
                        <GroupedNeedsSelector
                          needs={needs}
                          onNeedPress={addNeed}
                          isLoading={false}
                        />
                      </View>
                    ) : undefined
                  }
                  leftActions={
                    <>
                      {gotoPrevStep && <LearnInputPrevButton onPress={gotoPrevStep} />}
                      <LearnInputNeedsButton
                        visible={needSelectorVisible}
                        onPress={() => setNeedSelectorVisible((v) => !v)}
                      />
                    </>
                  }
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Enter' && !(e.nativeEvent as { shiftKey?: boolean }).shiftKey) {
                      e.preventDefault();
                    }
                  }}
                  onBeforeSubmit={() => setNeedSelectorVisible(false)}
                />
              </View>
            </View>
          </>
        )}

        {internalStep === 3 && !aiSummary && (
          <>
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
                <View className="flex-grow items-center justify-center px-0">
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
                    className="border-t border-black/10"
                    style={{
                      backgroundColor: baseColors.background,
                      paddingTop: 16,
                      paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 23 : 23,
                      marginLeft: -16,
                      marginRight: -16,
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                  >
                    <LearnNavigation
                      onNext={generateSummary}
                      onPrev={gotoPrevStep}
                      nextText="Zusammenfassung erstellen"
                      showPrev={!!gotoPrevStep}
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          </>
        )}

        {internalStep === 3 && aiSummary && (
          <>
            <View className="flex-grow flex-col justify-between">
              <ScrollView className="flex-grow" contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-grow items-center justify-center px-0 py-6">
                  <View className="max-w-sm max-h-80">
                    <Markdown
                      markdownit={markdownItInstance}
                      style={{
                        body: { paddingHorizontal:8, paddingVertical:16, fontSize: 16, color: '#374151', lineHeight: 22 },
                        paragraph: { marginBottom: 12 },
                      }}
                    >
                      {aiSummary || ''}
                    </Markdown>
                  </View>
                </View>
              </ScrollView>
              <View
                className="border-t border-black/10"
                style={{
                  backgroundColor: baseColors.background,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight + 23 : 23,
                  marginLeft: -16,
                  marginRight: -16,
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              >
                <LearnNavigation
                  onNext={gotoNextStep ?? (() => {})}
                  onPrev={gotoPrevStep}
                  nextText="Weiter"
                  showPrev={!!gotoPrevStep}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
