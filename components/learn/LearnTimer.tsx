import type { LearningSession } from '@/lib/api/learn';
import { Check, Pause, Play } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LearnTimerProps {
  duration: number;
  color: string;
  session: LearningSession | null;
  onResponse: (response: { completed: boolean; actualDuration?: number }) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function LearnTimer({
  duration,
  color,
  session,
  onResponse,
}: LearnTimerProps) {
  const [time, setTime] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load existing response if available
  useEffect(() => {
    if (!session?.responses) return;
    const existing = session.responses.find((r) => r.blockType === 'timer');
    if (existing?.response?.completed) {
      setIsCompleted(true);
    }
  }, [session?.responses]);

  const startTimer = () => {
    if (isCompleted) return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          setIsCompleted(true);
          const actualDuration = startTimeRef.current
            ? Math.floor((Date.now() - startTimeRef.current) / 1000)
            : duration;
          onResponse({ completed: true, actualDuration });
          return duration;
        }
        return t - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleTimer = () => {
    if (isRunning) pauseTimer();
    else startTimer();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View className="flex flex-grow flex-col justify-between">
      <View
        className="mb-6 inline-flex flex-row items-center justify-between gap-2 rounded-full p-2"
        style={{ backgroundColor: color }}
      >
        <TouchableOpacity
          onPress={toggleTimer}
          style={{
            borderWidth: 2,
            borderColor: color,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          className="h-8 w-8 items-center justify-center rounded-full bg-white"
        >
          {isRunning ? (
            <Pause size={12} color="#000" />
          ) : (
            <Play size={12} color="#000" />
          )}
        </TouchableOpacity>
        <View
          className={`min-w-[5rem] items-center justify-center rounded-full bg-white/10 p-2 ${isRunning ? 'opacity-90' : ''}`}
        >
          <Text className="text-base font-medium text-white">{time}</Text>
        </View>
        {isCompleted ? (
          <View className="flex-row items-center gap-1">
            <Check size={16} color="#86efac" />
            <Text className="text-xs text-white">Abgeschlossen</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
