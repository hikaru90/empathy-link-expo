import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LearnNavigationProps {
  onNext: () => void;
  onPrev?: () => void;
  nextText?: string;
  showPrev?: boolean;
  variant?: 'default' | 'light';
  className?: string;
  style?: any;
  disabled?: boolean;
}

export default function LearnNavigation({
  onNext,
  onPrev,
  nextText,
  showPrev,
  variant = 'default',
  className = '',
  style,
  disabled = false,
}: LearnNavigationProps) {
  const shouldShowPrev = showPrev !== undefined ? showPrev : !!onPrev;
  const nextButtonBg = variant === 'light' ? 'bg-white' : 'bg-black';
  const nextButtonTextColor = variant === 'light' ? 'text-black' : 'text-white';
  const nextIconBg = variant === 'light' ? 'bg-black/20' : 'bg-white/20';

  return (
    <View className={`flex-row gap-2 w-full ${className}`} style={style}>
      {shouldShowPrev && onPrev && (
        <TouchableOpacity
          onPress={onPrev}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-white py-3 px-2"
        >
          <View className="flex h-6 w-6 items-center justify-center rounded-full">
            <ArrowLeft size={16} color="#000" />
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={disabled ? undefined : onNext}
        disabled={disabled}
        className={`flex h-10 flex-grow flex-row items-center justify-between gap-2 rounded-full ${nextButtonBg} py-3 pl-6 pr-2 ${disabled ? 'opacity-50' : ''}`}
      >
        <Text className={`font-medium ${nextButtonTextColor}`}>
          {nextText || 'Weiter'}
        </Text>
        <View className={`flex h-6 w-6 items-center justify-center rounded-full ${nextIconBg}`}>
          <ArrowRight size={16} color={variant === 'light' ? '#000' : '#fff'} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

