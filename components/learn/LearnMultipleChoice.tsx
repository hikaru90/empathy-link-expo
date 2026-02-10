import type { LearningSession } from '@/lib/api/learn';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

const markdownItInstance = MarkdownIt({ html: true });

interface LearnMultipleChoiceProps {
  content: {
    questions?: Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
      explanation?: string;
    }>;
    allowMultiple?: boolean;
  };
  color: string;
  session: LearningSession | null;
  contentBlock: any;
  topicVersionId: string;
  onResponse: (response: any) => void;
  gotoNextStep?: () => void;
  gotoPrevStep?: () => void;
}

export default function LearnMultipleChoice({
  content,
  color,
  session,
  contentBlock,
  onResponse,
  gotoNextStep,
  gotoPrevStep,
}: LearnMultipleChoiceProps) {
  const questions = content?.questions ?? [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [questionResponses, setQuestionResponses] = useState<
    Array<{ questionIndex: number; selectedOptions: number[]; isCorrect: boolean; timeSpent: number }>
  >([]);
  const [startTime] = useState<number>(Date.now());
  const [totalStartTime] = useState<number>(Date.now());
  const [showResult, setShowResult] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!session?.responses) return;
    const existing = session.responses.find(
      (r) => r.blockType === 'multipleChoice' && JSON.stringify(r.blockContent) === JSON.stringify(contentBlock)
    );
    if (existing?.response) {
      setQuestionResponses(existing.response.questionResponses || []);
      setShowSummary(!!existing.response.completed);
      if (!existing.response.completed && existing.response.questionResponses?.length) {
        const next = questions.findIndex(
          (_, i) => !existing.response.questionResponses.some((r: any) => r.questionIndex === i)
        );
        setCurrentQuestionIndex(next >= 0 ? next : 0);
      }
    }
  }, [session?.responses, contentBlock, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const completedQuestions = questionResponses.length;
  const progressPercentage = totalQuestions ? (completedQuestions / totalQuestions) * 100 : 0;

  const handleOptionSelect = (optionIndex: number) => {
    if (showResult) return;
    if (content.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionIndex) ? prev.filter((i) => i !== optionIndex) : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const saveProgress = (completed: boolean) => {
    const totalTimeSpent = Math.floor((Date.now() - totalStartTime) / 1000);
    onResponse({
      questionResponses,
      completed,
      totalTimeSpent,
    });
  };

  const submitAnswer = () => {
    if (selectedOptions.length === 0 || showResult || !currentQuestion) return;

    const correctOptions = currentQuestion.options
      .map((o, i) => (o.isCorrect ? i : -1))
      .filter((i) => i !== -1);
    const isCorrect = content.allowMultiple
      ? [...selectedOptions].sort().join(',') === [...correctOptions].sort().join(',')
      : selectedOptions.length === 1 && correctOptions.includes(selectedOptions[0]);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const newResponses = [
      ...questionResponses,
      {
        questionIndex: currentQuestionIndex,
        selectedOptions: [...selectedOptions],
        isCorrect,
        timeSpent,
      },
    ];
    setQuestionResponses(newResponses);
    setShowResult(true);
    saveProgress(false);
  };

  const advanceOrFinish = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedOptions([]);
      setShowResult(false);
    } else {
      setShowSummary(true);
      const totalTimeSpent = Math.floor((Date.now() - totalStartTime) / 1000);
      // questionResponses already includes the last answer from submitAnswer
      onResponse({
        questionResponses,
        completed: true,
        totalTimeSpent,
      });
    }
  };

  const getCurrentQuestionResult = (): boolean => {
    const r = questionResponses.find((x) => x.questionIndex === currentQuestionIndex);
    return r?.isCorrect ?? false;
  };

  const getOverallScore = (): number => {
    if (!questionResponses.length) return 0;
    const correct = questionResponses.filter((r) => r.isCorrect).length;
    return Math.round((correct / questionResponses.length) * 100);
  };

  if (!currentQuestion && !showSummary) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-600">Keine Fragen geladen.</Text>
      </View>
    );
  }

  if (showSummary) {
    const score = getOverallScore();
    return (
      <View className="mb-6 rounded-xl bg-white/80 p-6 shadow-lg">
        <View className="mb-6 items-center">
          <Text
            className="mb-2 text-3xl font-bold"
            style={{
              color: score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626',
            }}
          >
            {score}%
          </Text>
          <Text className="mb-2 text-lg font-medium text-gray-700">
            {score === 100 ? 'Perfekt! 🎉' : score >= 80 ? 'Sehr gut! 👏' : score >= 60 ? 'Gut gemacht! 👍' : 'Weiter üben! 💪'}
          </Text>
          <Text className="text-sm text-gray-600">
            {questionResponses.filter((r) => r.isCorrect).length} von {totalQuestions} Fragen richtig
          </Text>
        </View>
        <View className="gap-4">
          <Text className="font-medium text-gray-700">Ergebnisse:</Text>
          {questions.map((q, index) => {
            const resp = questionResponses.find((r) => r.questionIndex === index);
            return (
              <View
                key={index}
                className="rounded-lg border p-3"
                style={{
                  backgroundColor: resp?.isCorrect ? '#f0fdf4' : '#fef2f2',
                  borderColor: resp?.isCorrect ? '#86efac' : '#fca5a5',
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium">Frage {index + 1}</Text>
                  <Text className="text-lg">{resp?.isCorrect ? '✅' : '❌'}</Text>
                </View>
                <Markdown markdownit={markdownItInstance} style={{ body: { fontSize: 14, color: '#374151' } }}>
                  {q.question}
                </Markdown>
              </View>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={gotoNextStep}
          className="mt-4 w-full rounded-lg py-3"
          style={{ backgroundColor: color }}
          activeOpacity={0.8}
        >
          <Text className="text-center font-medium text-white">Weiter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mb-6 rounded-xl bg-white/80 p-6 shadow-lg">
      <View className="mb-6">
        <View className="mb-2 flex-row justify-between text-sm text-gray-600">
          <Text>Frage {currentQuestionIndex + 1} von {totalQuestions}</Text>
          <Text>{completedQuestions} beantwortet</Text>
        </View>
        <View className="h-2 w-full rounded-full bg-gray-200">
          <View
            className="h-2 rounded-full"
            style={{ width: `${progressPercentage}%`, backgroundColor: color }}
          />
        </View>
      </View>

      <View className="mb-6">
        <Markdown
          markdownit={markdownItInstance}
          style={{ body: { fontSize: 18, fontWeight: 'bold', color: '#111827' }, paragraph: { marginBottom: 8 } }}
        >
          {currentQuestion.question}
        </Markdown>
        {content.allowMultiple && !showResult ? (
          <Text className="text-sm text-gray-600">Mehrere Antworten können richtig sein.</Text>
        ) : null}
      </View>

      <View className="mb-6 gap-3">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = option.isCorrect;
          const selected = selectedOptions.includes(index);
          let borderColor = '#e5e7eb';
          let bgColor = 'transparent';
          if (showResult) {
            if (selected) {
              borderColor = isCorrect ? '#22c55e' : '#ef4444';
              bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';
            } else if (isCorrect) {
              borderColor = '#22c55e';
              bgColor = '#f0fdf4';
            }
          } else if (selected) {
            borderColor = color;
            bgColor = `${color}20`;
          }
          return (
            <TouchableOpacity
              key={index}
              testID={`multiple-choice-option-${index}`}
              onPress={() => handleOptionSelect(index)}
              disabled={showResult}
              className="w-full rounded-lg border-2 p-4"
              style={{ borderColor, backgroundColor: bgColor }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <Markdown markdownit={markdownItInstance} style={{ body: { fontSize: 16, flex: 1 } as any }}>
                  {option.text}
                </Markdown>
                <View className="ml-2">
                  {showResult ? (
                    <Text className="text-lg font-bold">{selected ? (isCorrect ? '✓' : '✗') : isCorrect ? '✓' : ''}</Text>
                  ) : selected ? (
                    <View className="h-4 w-4 rounded-full bg-current opacity-60" />
                  ) : (
                    <View className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!showResult && selectedOptions.length > 0 ? (
        <TouchableOpacity
          testID="multiple-choice-submit"
          onPress={submitAnswer}
          className="w-full rounded-lg py-3"
          style={{ backgroundColor: color }}
          activeOpacity={0.8}
        >
          <Text className="text-center font-medium text-white">Antwort abschicken</Text>
        </TouchableOpacity>
      ) : null}

      {showResult ? (
        <View
          className="mt-6 rounded-lg border p-4"
          style={{
            backgroundColor: getCurrentQuestionResult() ? '#f0fdf4' : '#fef2f2',
            borderColor: getCurrentQuestionResult() ? '#86efac' : '#fca5a5',
          }}
        >
          <Text className="mb-2 font-medium">
            {getCurrentQuestionResult() ? '🎉 Richtig!' : '❌ Falsch'}
          </Text>
          {currentQuestion.explanation ? (
            <Markdown markdownit={markdownItInstance} style={{ body: { fontSize: 14, color: '#374151' } }}>
              {currentQuestion.explanation}
            </Markdown>
          ) : null}
          <TouchableOpacity
            onPress={advanceOrFinish}
            className="mt-4 w-full rounded-lg py-2"
            style={{ backgroundColor: color }}
            activeOpacity={0.8}
          >
            <Text className="text-center font-medium text-white">
              {currentQuestionIndex < totalQuestions - 1 ? 'Nächste Frage' : 'Ergebnisse anzeigen'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
