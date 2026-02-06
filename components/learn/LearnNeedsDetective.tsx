import { getNeeds, type Need } from '@/lib/api/chat';
import type { LearningSession } from '@/lib/api/learn';
import { needsDetectiveAI } from '@/lib/api/learn';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import LearnNavigation from './LearnNavigation';
import LearnSplashScreen from './LearnSplashScreen';

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
  const [splashDone, setSplashDone] = useState(false);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [needSelectorVisible, setNeedSelectorVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const internalStep = totalSteps[currentStep]?.internalStep ?? 0;

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

  const addNeed = (text: string) => {
    const sep = needsInput && !needsInput.endsWith(' ') ? ' ' : '';
    setNeedsInput((prev) => prev + sep + text);
  };

  const splashContentClass = splashDone ? 'opacity-100' : 'opacity-0';

  return (
    <View className="flex flex-1 flex-col rounded-lg">
      <LearnSplashScreen
        color={color}
        text="Zeit zu Üben"
        onSplashDone={() => setSplashDone(true)}
      />
      <View className={`flex flex-1 flex-col justify-between gap-4 rounded-lg ${splashContentClass}`}>
        {internalStep === 0 && (
          <>
            <View className="flex-grow items-center justify-center">
              <Text className="max-w-xs text-center font-medium text-gray-900">
                {content.question ||
                  'Beschreibe eine Situation, die du erlebt hast und welche Strategie du verwendet hast:'}
              </Text>
            </View>
            <View className="gap-2">
              <View className="rounded-2xl border border-white bg-white/90 p-2 shadow-lg">
                <TextInput
                  value={situationInput}
                  onChangeText={setSituationInput}
                  placeholder="Ich war bei dem letzten Familienbesuch etwas geladen und habe dann einfach das Thema gewechselt..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  className="min-h-[80px] flex-grow rounded-md bg-transparent px-2 py-1 text-base text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                      e.preventDefault();
                      submitCombinedInput();
                    }
                  }}
                />
                <View className="flex-row items-end justify-between">
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={gotoPrevStep} className="rounded-full bg-white px-2 py-1">
                      <ChevronLeft size={16} color="#374151" />
                    </TouchableOpacity>
                    {existingResponse ? (
                      <TouchableOpacity onPress={gotoNextStep} className="rounded-full bg-white py-1 pl-3 pr-1">
                        <Text className="text-xs text-gray-700">Zur vorherigen Antwort</Text>
                        <ChevronRight size={14} color="#374151" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={submitCombinedInput}
                    disabled={!situationInput.trim() || isLoading}
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

        {internalStep === 1 && aiReflection && (
          <>
            <View className="flex-grow items-center justify-center rounded-lg p-6">
              <Markdown markdownit={markdownItInstance} style={{ body: { fontSize: 16, color: '#374151' } }}>
                {aiReflection} Stimmt diese Aussage?
              </Markdown>
            </View>
            <LearnNavigation onNext={gotoNextStep ?? (() => {})} onPrev={gotoPrevStep} nextText="Genau" showPrev={!!gotoPrevStep} />
          </>
        )}

        {internalStep === 2 && (
          <>
            <View className="flex-grow items-center justify-center">
              <Text className="max-w-xs font-medium text-gray-900">
                Welche Bedürfnisse hast Du Dir dadurch erfüllt?
              </Text>
            </View>
            <View className="gap-2">
              <View className="rounded-2xl border border-white bg-white/90 p-2 shadow-lg">
                {needSelectorVisible ? (
                  <ScrollView className="max-h-40 flex-wrap" nestedScrollEnabled>
                    <View className="flex-row flex-wrap gap-1">
                      {needs.map((n) => (
                        <TouchableOpacity
                          key={n.id}
                          onPress={() => addNeed(n.nameDE)}
                          className="rounded-full border border-black/5 bg-white px-2 py-1"
                        >
                          <Text className="text-xs text-gray-900">{n.nameDE}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                ) : null}
                <TextInput
                  value={needsInput}
                  onChangeText={setNeedsInput}
                  placeholder="Sicherheit, Verständnis, Autonomie..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  className="min-h-[60px] flex-grow rounded-md bg-transparent px-2 py-1 text-base text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                      e.preventDefault();
                      submitNeeds();
                    }
                  }}
                />
                <View className="flex-row items-end justify-between">
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={gotoPrevStep} className="rounded-full bg-white px-2 py-1">
                      <ChevronLeft size={16} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setNeedSelectorVisible((v) => !v)}
                      className={`rounded-full py-1 pl-1 pr-2 ${needSelectorVisible ? 'bg-black/10' : 'bg-white'}`}
                    >
                      <Text className="text-xs text-gray-700">Bedürfnisse</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={submitNeeds}
                    disabled={isLoading}
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

        {internalStep === 3 && !aiSummary && (
          <>
            <View className="flex-grow items-center justify-center">
              <Text className="font-medium text-gray-900">
                Lass uns eine Zusammenfassung deiner Erkenntnisse erstellen.
              </Text>
            </View>
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" style={{ marginRight: 8 }} />
                <Text className="text-gray-600">Erstelle Zusammenfassung...</Text>
              </View>
            ) : (
              <LearnNavigation
                onNext={generateSummary}
                onPrev={gotoPrevStep}
                nextText="Zusammenfassung erstellen"
                showPrev={!!gotoPrevStep}
              />
            )}
          </>
        )}

        {internalStep === 3 && aiSummary && (
          <>
            <ScrollView className="flex-grow rounded-lg p-6">
              <Markdown markdownit={markdownItInstance} style={{ body: { fontSize: 16, color: '#374151' } }}>
                {aiSummary}
              </Markdown>
            </ScrollView>
            <LearnNavigation onNext={gotoNextStep ?? (() => {})} onPrev={gotoPrevStep} nextText="Weiter" showPrev={!!gotoPrevStep} />
          </>
        )}
      </View>
    </View>
  );
}
