import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

const markdownItInstance = MarkdownIt({ html: true });

interface LearnTaskProps {
  content: {
    type?: 'task';
    content?: string;
    duration?: number;
  };
  color: string;
  onComplete?: () => void;
}

export default function LearnTask({ content, color, onComplete }: LearnTaskProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const duration = content.duration;
  const durationString =
    duration && duration > 60 ? `${duration / 60} min` : duration ? `${duration} s` : '';

  const markCompleted = () => {
    setIsCompleted(true);
    setTimeout(() => onComplete?.(), 1500);
  };

  return (
    <View className="mb-4 rounded-xl bg-white/20 px-3 py-4">
      <View className="mb-4 flex-row items-center rounded-full text-xs">
        <View className="flex-1 py-0.5">Zeit zu üben</View>
        {duration !== undefined ? (
          <View className="rounded-full bg-white px-2 py-0.5">
            <Text className="text-xs">Dauer: {durationString}</Text>
          </View>
        ) : null}
      </View>
      <Markdown
        markdownit={markdownItInstance}
        style={{
          body: { fontSize: 16, color: '#1f2937', lineHeight: 22 },
          paragraph: { marginBottom: 8 },
        }}
      >
        {content.content || ''}
      </Markdown>
      {!isCompleted ? (
        <TouchableOpacity
          testID="learn-step-next"
          onPress={markCompleted}
          className="mt-4 w-full rounded-lg bg-white/20 py-2 px-4"
          activeOpacity={0.8}
        >
          <Text className="text-center font-medium text-white">Als erledigt markieren</Text>
        </TouchableOpacity>
      ) : (
        <View className="mt-4 flex-row items-center justify-center gap-2">
          <View className="h-5 w-5 items-center justify-center">
            <Text className="text-lg text-green-300">✓</Text>
          </View>
          <Text className="font-medium text-green-300">Erledigt!</Text>
        </View>
      )}
    </View>
  );
}
