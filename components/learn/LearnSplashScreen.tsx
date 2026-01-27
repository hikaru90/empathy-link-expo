import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface LearnSplashScreenProps {
  color?: string;
  text?: string;
  delay?: number;
  duration?: number;
  onSplashDone?: () => void;
}

export default function LearnSplashScreen({
  color = '#6b7280',
  text = 'Zeit zu Atmen',
  delay = 50,
  duration = 2000,
  onSplashDone,
}: LearnSplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
    }, delay);
    const t2 = setTimeout(() => {
      setDone(true);
      onSplashDone?.();
    }, duration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [delay, duration, onSplashDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: done ? 0 : opacity.value,
    transform: [{ scale: done ? 0 : scale.value }],
  }));

  if (done) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <View className="h-52 w-52 items-center justify-center">
        <View
          className="flex-1 w-full items-center justify-center rounded-xl"
          style={{ backgroundColor: color }}
        >
          <Text className="text-xl font-bold text-white">{text}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
