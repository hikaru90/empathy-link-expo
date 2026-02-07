import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';

const jungleImage = require('@/assets/images/Jungle.jpg');
const whiteImage = require('@/assets/images/background-white-highres.png');

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
  const nextIconBg = variant === 'light' ? 'bg-black/10' : 'bg-white/20';

  return (
    <View className={`flex-row gap-2 w-full ${className}`} style={style}>
      {shouldShowPrev && onPrev && (
        <TouchableOpacity
          onPress={onPrev}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-white py-3 px-2 relative"
        >
          <View className="flex h-6 w-6 items-center justify-center rounded-full">
            <ArrowLeft size={16} color="#000" />
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={disabled ? undefined : onNext}
        disabled={disabled}
        className="flex-grow"
        style={disabled ? { opacity: 0.5 } : undefined}
      >
        {variant === 'light' ? (
          <View
            className={`flex h-10 flex-row items-center justify-between gap-2 rounded-full ${nextButtonBg} py-3 pl-6 pr-2`}
          >
            <ImageBackground
            source={whiteImage}
            resizeMode="cover"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              flexGrow: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 24,
              paddingRight: 8,
              paddingVertical: 8,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          ></ImageBackground>
            <Text className={`font-medium ${nextButtonTextColor}`}>
              {nextText || 'Weiter'}
            </Text>
            <View className={`flex h-6 w-6 items-center justify-center rounded-full ${nextIconBg}`}>
              <ArrowRight size={16} color="#000" />
            </View>
          </View>
        ) : (
          <ImageBackground
            source={jungleImage}
            resizeMode="cover"
            style={{
              width: '100%',
              height: '100%',
              flexGrow: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 24,
              paddingRight: 8,
              paddingVertical: 8,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text className="font-medium text-white">
              {nextText || 'Weiter'}
            </Text>
            <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <ArrowRight size={16} color="#fff" />
            </View>
          </ImageBackground>
        )}
      </TouchableOpacity>
    </View>
  );
}

