/**
 * LearningSummary component for React Native Expo
 * Displays completion summary with stats, insights, and feedback
 */

import DonutChart from '@/components/stats/DonutChart';
import { type LearningSession, type Topic } from '@/lib/api/learn';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

interface LearningSummaryProps {
  session: LearningSession | null;
  topic: Topic;
  color: string;
  onFeedbackSubmit?: (feedback: any) => void;
}

interface SessionStats {
  totalTime: number;
  tasksCompleted: number;
  totalTasks: number;
  multipleChoiceScore: number;
  multipleChoiceTotal: number;
  sortableScore: number;
  sortableTotal: number;
  timersCompleted: number;
  totalTimers: number;
  bodymapInteractions: number;
  completionNotes: string[];
  responsesByType: Record<string, number>;
}

export default function LearningSummary({
  session,
  topic,
  color,
  onFeedbackSubmit,
}: LearningSummaryProps) {
  const router = useRouter();

  // Calculate learning statistics
  const sessionStats = useMemo((): SessionStats | null => {
    if (!session) return null;

    const responses = session.responses || [];
    const stats: SessionStats = {
      totalTime: 0,
      tasksCompleted: 0,
      totalTasks: 0,
      multipleChoiceScore: 0,
      multipleChoiceTotal: 0,
      sortableScore: 0,
      sortableTotal: 0,
      timersCompleted: 0,
      totalTimers: 0,
      bodymapInteractions: 0,
      completionNotes: [],
      responsesByType: {},
    };

    responses.forEach((response) => {
      stats.responsesByType[response.blockType] =
        (stats.responsesByType[response.blockType] || 0) + 1;

      switch (response.blockType) {
        case 'timer':
          stats.totalTimers++;
          if (response.response?.completed) {
            stats.timersCompleted++;
            stats.totalTime += response.response.actualDuration || 0;
          }
          break;

        case 'taskCompletion':
          stats.totalTasks++;
          if (response.response?.completed) {
            stats.tasksCompleted++;
            stats.totalTime += response.response.timeSpent || 0;
            if (response.response.notes) {
              stats.completionNotes.push(response.response.notes);
            }
          }
          break;

        case 'multipleChoice':
          if (response.response?.completed) {
            const correctAnswers =
              response.response.questionResponses?.filter((q: any) => q.isCorrect).length || 0;
            stats.multipleChoiceScore += correctAnswers;
            stats.multipleChoiceTotal += response.response.questionResponses?.length || 0;
            stats.totalTime += response.response.totalTimeSpent || 0;
          }
          break;

        case 'sortable':
          if (response.response?.userSorting) {
            const sortableData = response.blockContent as any;
            if (sortableData?.items) {
              let correctSorts = 0;
              sortableData.items.forEach((item: any) => {
                if (response.response.userSorting[item.text] === item.correctBucket) {
                  correctSorts++;
                }
              });
              stats.sortableScore += correctSorts;
              stats.sortableTotal += sortableData.items.length;
            }
          }
          break;

        case 'bodymap':
          if (response.response?.points && response.response.points.length > 0) {
            stats.bodymapInteractions += response.response.points.length;
          }
          break;

        case 'aiQuestion':
          if (response.response?.aiResponse) {
            stats.totalTasks++;
            stats.tasksCompleted++;
          }
          break;

        case 'audio':
          if (response.response?.completed) {
            stats.totalTasks++;
            stats.tasksCompleted++;
          }
          break;
      }
    });

    return stats;
  }, [session]);

  // Calculate completion stats for donut chart
  const completionStats = useMemo(() => {
    if (!sessionStats) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed =
      sessionStats.tasksCompleted +
      sessionStats.timersCompleted +
      (sessionStats.multipleChoiceTotal > 0
        ? sessionStats.multipleChoiceScore === sessionStats.multipleChoiceTotal
          ? 1
          : 0
        : 0) +
      (sessionStats.sortableTotal > 0
        ? sessionStats.sortableScore === sessionStats.sortableTotal
          ? 1
          : 0
        : 0);

    const total =
      sessionStats.totalTasks +
      sessionStats.totalTimers +
      (sessionStats.multipleChoiceTotal > 0 ? 1 : 0) +
      (sessionStats.sortableTotal > 0 ? 1 : 0);

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [sessionStats]);

  // Donut chart data
  const donutData = useMemo(() => {
    if (!sessionStats) {
      return [
        { value: 'completed', count: 0 },
        { value: 'remaining', count: 1 },
      ];
    }

    const completed =
      sessionStats.tasksCompleted +
      sessionStats.timersCompleted +
      (sessionStats.multipleChoiceTotal > 0
        ? sessionStats.multipleChoiceScore === sessionStats.multipleChoiceTotal
          ? 1
          : 0
        : 0) +
      (sessionStats.sortableTotal > 0
        ? sessionStats.sortableScore === sessionStats.sortableTotal
          ? 1
          : 0
        : 0);

    const total =
      sessionStats.totalTasks +
      sessionStats.totalTimers +
      (sessionStats.multipleChoiceTotal > 0 ? 1 : 0) +
      (sessionStats.sortableTotal > 0 ? 1 : 0);

    return [
      { value: 'completed', count: completed },
      { value: 'remaining', count: Math.max(0, total - completed) },
    ].filter((item) => item.count > 0);
  }, [sessionStats]);

  const donutColors = ['#10b981', '#e5e7eb']; // green for completed, gray for remaining

  // Get score message
  const getScoreMessage = (percentage: number) => {
    if (percentage >= 95) return 'Du hast den Inhalt gemeistert';
    if (percentage >= 85) return 'Du hast sehr gut gelernt';
    if (percentage >= 70) return 'Gutes Verständnis erreicht';
    if (percentage >= 60) return 'Wiederhole die wichtigsten Konzepte';
    return 'Lernen ist ein Prozess';
  };

  const topicVersion = topic.expand?.currentVersion;
  const summaryText = (topicVersion as any)?.summary || '';

  return (
    <View className="h-auto">
        {/* Completion Header */}
        <View className="mb-6 rounded-xl bg-white px-4 py-5 shadow-lg">
          <View className="flex-row items-center gap-3">
            {donutData.length > 0 ? (
              <View style={{ width: 64, height: 64 }}>
                <DonutChart
                  data={donutData}
                  colors={donutColors}
                  size={64}
                  showPercentage={true}
                  completedCount={completionStats.completed}
                  totalCount={completionStats.total}
                />
              </View>
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                <Text className="text-xs text-gray-600">0%</Text>
              </View>
            )}
            <View className="flex-col flex-1">
              <Text className="text-lg font-bold leading-tight">Modul abgeschlossen</Text>
              <Text className="text-xs text-black/50">
                {getScoreMessage(completionStats.percentage)}
              </Text>
            </View>
          </View>
        </View>

        {/* Topic Summary */}
        {summaryText && (
          <View className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            <Text className="text-md mb-4 font-bold">Deine Lernzusammenfassung</Text>
            <Markdown
              markdownit={markdownItInstance}
              style={{
                body: {
                  fontSize: 14,
                  color: '#374151',
                  lineHeight: 20,
                },
                paragraph: {
                  marginBottom: 12,
                },
              }}
            >
              {summaryText}
            </Markdown>
          </View>
        )}

        {/* Completion Notes */}
        {sessionStats?.completionNotes && sessionStats.completionNotes.length > 0 && (
          <View className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            <Text className="mb-4 font-bold text-gray-900">Deine Reflexionsnotizen</Text>
            <View style={{ gap: 12 }}>
              {sessionStats.completionNotes.map((note, index) => (
                <View key={index} className="rounded-lg bg-gray-50 p-3">
                  <Text className="text-sm text-gray-700">{note}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

    </View>
  );
}

