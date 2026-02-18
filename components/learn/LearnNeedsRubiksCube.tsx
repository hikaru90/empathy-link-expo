import type { LearningSession } from '@/lib/api/learn';
import { needsRubiksCubeAI } from '@/lib/api/learn';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import RubiksCubeIcon from '@/assets/images/rubiksCube.svg';
import RubiksCubeSolvedIcon from '@/assets/images/rubiksCubeSolved.svg';
import LearnMessageInput, {
  LearnInputExistingResponseButton,
  LearnInputPrevButton,
} from '@/components/learn/LearnMessageInput';
import LearnNavigation from '@/components/learn/LearnNavigation';

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
  const textInputRef = useRef<TextInput>(null);

  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

  // Derive display data from existingResponse when available (avoids useEffect timing issues)
  const existingResponse = session?.responses?.find(
    (r) =>
      r.blockType === 'needsRubiksCube' &&
      JSON.stringify(r.blockContent) === JSON.stringify(contentBlock)
  )?.response;

  // Use existingResponse for display when available (avoids blank screen on back-navigation)
  const displayNeeds = existingResponse?.transformedNeeds ?? transformedNeeds;
  const displayResponseTime = existingResponse?.responseTime ?? responseTime;
  const canShowStep2 = (existingResponse || isPreview || hasSubmitted) && displayNeeds.length > 0;

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
    <View className="flex flex-1 flex-col justify-between gap-4 rounded-lg mb-6">
      {internalStep === 0 && (
        <View className="flex flex-1 flex-col justify-between" style={{ minHeight: 0, overflow: 'hidden' }}>
          <ScrollView
            className="flex-1"
            style={{ minHeight: 0, flexBasis: 0 }}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 8, paddingVertical: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center justify-center gap-4">
              <View className="h-20 w-20 items-center justify-center">
                <RubiksCubeIcon width={80} height={80} />
              </View>
              <Markdown
                markdownit={markdownItInstance}
                style={{ body: { fontSize: 16, fontWeight: '500', color: '#111827', textAlign: 'center' } }}
              >
                {content.title || 'Gib einen schwierigen Satz ein, den du gehört hast'}
              </Markdown>
            </View>
          </ScrollView>

          <LearnMessageInput
            value={userSentence}
            onChangeText={setUserSentence}
            onSubmit={() => (isPreview ? handlePreviewNext() : submitSentence())}
            placeholder={
              content.placeholder || 'Schreibe hier den schwierigen Satz, den du gehört hast...'
            }
            disabled={isLoading}
            isLoading={isLoading}
            sendDisabled={!userSentence.trim()}
            errorMessage={errorMessage}
            textInputRef={textInputRef}
            leftActions={
              <>
                {gotoPrevStep && <LearnInputPrevButton onPress={gotoPrevStep} />}
                {existingResponse && (
                  <LearnInputExistingResponseButton
                    onPress={() => gotoNextStep?.()}
                    compact={false}
                    label="Zu den Bedürfnissen"
                  />
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
      )}

      {internalStep === 1 && (
        <>
          {canShowStep2 ? (
            <View className="flex-grow flex-col items-center justify-center gap-4 rounded-lg p-6">
              <View className="h-20 w-20 items-center justify-center">
                <RubiksCubeSolvedIcon width={80} height={80} />
              </View>
              <Text className="mb-4 text-center font-medium text-gray-900">
                {content.resultsTitle || 'Diese Bedürfnisse stecken dahinter:'}
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {displayNeeds.map((need: string, i: number) => (
                  <View
                    key={i}
                    className="rounded-full border border-white bg-white/80 px-3 py-1.5"
                  >
                    <Text className="text-sm text-gray-900">{need}</Text>
                  </View>
                ))}
              </View>
              {displayResponseTime != null ? (
                <Text className="text-xs text-gray-500">Analysiert in {displayResponseTime} Sekunden</Text>
              ) : null}
            </View>
          ) : (
            <View className="flex-grow items-center justify-center p-6">
              <Text className="text-center text-gray-500">
                Bedürfnisse werden geladen…
              </Text>
            </View>
          )}
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
