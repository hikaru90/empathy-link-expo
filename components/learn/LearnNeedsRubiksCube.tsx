import type { LearningSession } from '@/lib/api/learn';
import { needsRubiksCubeAI } from '@/lib/api/learn';
import { ChevronRight, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import LearnNavigation from './LearnNavigation';

const markdownItInstance = MarkdownIt({ html: true });

const MOCK_NEEDS = ['Verständnis', 'Respekt', 'Wertschätzung', 'Sicherheit', 'Verbindung'];

interface LearnNeedsRubiksCubeProps {
  content: {
    title?: string;
    placeholder?: string;
    resultsTitle?: string;
    instruction?: string;
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

export default function LearnNeedsRubiksCube({
  content,
  color,
  session,
  contentBlock,
  currentStep,
  totalSteps,
  onResponse,
  gotoNextStep,
  gotoPrevStep,
  isPreview = false,
}: LearnNeedsRubiksCubeProps) {
  const [userSentence, setUserSentence] = useState('');
  const [transformedNeeds, setTransformedNeeds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

  const existingResponse = session?.responses?.find(
    (r) =>
      r.blockType === 'needsRubiksCube' &&
      JSON.stringify(r.blockContent) === JSON.stringify(contentBlock)
  )?.response;

  useEffect(() => {
    if (!existingResponse || initialized) return;
    setUserSentence(existingResponse.userSentence ?? '');
    setTransformedNeeds(existingResponse.transformedNeeds ?? []);
    setHasSubmitted(!!(existingResponse.transformedNeeds?.length));
    setResponseTime(existingResponse.responseTime ?? null);
    setInitialized(true);
  }, [existingResponse, initialized]);

  const submitSentence = useCallback(async () => {
    if (!userSentence.trim() || isLoading || isPreview) return;
    setIsLoading(true);
    setErrorMessage('');
    const start = Date.now();
    try {
      const { needs } = await needsRubiksCubeAI(
        userSentence.trim(),
        content.instruction || 'Transform this sentence into underlying needs'
      );
      setTransformedNeeds(needs);
      setHasSubmitted(true);
      setResponseTime(Math.floor((Date.now() - start) / 1000));
      onResponse({
        userSentence: userSentence.trim(),
        transformedNeeds: needs,
        timestamp: new Date().toISOString(),
        responseTime: Math.floor((Date.now() - start) / 1000),
      });
      gotoNextStep?.();
    } catch (e) {
      console.error(e);
      setErrorMessage('Die Umwandlung konnte gerade nicht durchgeführt werden.');
    } finally {
      setIsLoading(false);
    }
  }, [userSentence, content.instruction, isLoading, isPreview, onResponse, gotoNextStep]);

  const handlePreviewNext = useCallback(() => {
    if (!isPreview || !userSentence.trim()) return;
    setTransformedNeeds(MOCK_NEEDS);
    setHasSubmitted(true);
    onResponse({
      userSentence: userSentence.trim(),
      transformedNeeds: MOCK_NEEDS,
      timestamp: new Date().toISOString(),
    });
    gotoNextStep?.();
  }, [isPreview, userSentence, onResponse, gotoNextStep]);

  return (
    <View className="flex flex-1 flex-col justify-between gap-4 rounded-lg">
      {internalStep === 0 && (
        <>
          <View className="flex-grow flex-col items-center justify-center gap-4">
            <View className="h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
              <Text className="text-4xl">🎲</Text>
            </View>
            <Markdown
              markdownit={markdownItInstance}
              style={{ body: { fontSize: 16, fontWeight: '500', color: '#111827', textAlign: 'center' } }}
            >
              {content.title || 'Gib einen schwierigen Satz ein, den du gehört hast'}
            </Markdown>
          </View>
          <View className="gap-2">
            <View className="rounded-2xl border border-white bg-white/90 p-2 shadow-lg">
              <TextInput
                value={userSentence}
                onChangeText={setUserSentence}
                placeholder={
                  content.placeholder || 'Schreibe hier den schwierigen Satz, den du gehört hast...'
                }
                placeholderTextColor="#9ca3af"
                multiline
                className="min-h-[80px] flex-grow rounded-md bg-transparent px-2 py-1 text-base text-gray-900"
                style={{ textAlignVertical: 'top' }}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                    e.preventDefault();
                    if (!userSentence.trim() || isLoading) return;
                    if (isPreview) handlePreviewNext();
                    else submitSentence();
                  }
                }}
              />
              <View className="flex-row items-end justify-between">
                <View>
                  {existingResponse ? (
                    <TouchableOpacity onPress={gotoNextStep} className="rounded-full bg-white py-1 pl-3 pr-1">
                      <Text className="text-xs text-gray-700">Zu den Bedürfnissen</Text>
                      <ChevronRight size={14} color="#374151" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={isPreview ? handlePreviewNext : submitSentence}
                  disabled={!userSentence.trim() || isLoading}
                  className="h-10 w-10 items-center justify-center rounded-full bg-black"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {errorMessage ? (
              <View className="rounded-lg border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-800">{errorMessage}</Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      {internalStep === 1 && (existingResponse || isPreview) && hasSubmitted && transformedNeeds.length > 0 && (
        <>
          <View className="flex-grow flex-col items-center justify-center gap-4 rounded-lg p-6">
            <View className="h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
              <Text className="text-4xl">✅</Text>
            </View>
            <Text className="mb-4 text-center font-medium text-gray-900">
              {content.resultsTitle || 'Diese Bedürfnisse stecken dahinter:'}
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {transformedNeeds.map((need, i) => (
                <View
                  key={i}
                  className="rounded-full border border-white bg-white/80 px-3 py-1.5"
                >
                  <Text className="text-sm text-gray-900">{need}</Text>
                </View>
              ))}
            </View>
            {responseTime != null ? (
              <Text className="text-xs text-gray-500">Analysiert in {responseTime} Sekunden</Text>
            ) : null}
          </View>
          <LearnNavigation
            onNext={gotoNextStep ?? (() => {})}
            onPrev={gotoPrevStep}
            nextText="Weiter"
            showPrev={!!gotoPrevStep}
          />
        </>
      )}
    </View>
  );
}
