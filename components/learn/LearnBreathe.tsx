import { useAudioPlayer } from 'expo-audio';
import { Play } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import baseColors from '@/baseColors.config';

interface LearnBreatheProps {
  content: {
    type: 'breathe';
    duration?: number;
  };
  onNext?: () => void;
  onPrev?: () => void;
}

type BreathingPhase = 'inhale' | 'exhale' | 'hold' | 'pause';
type BreathingPattern = '5-7' | '5-5' | 'box';

const breathingPatterns = {
  '5-7': {
    name: '5-7 Atmung',
    description: '5s ein-, 7s ausatmen',
    inhale: 5000,
    exhale: 7000,
    hold: 0,
    pause: 1000,
  },
  '5-5': {
    name: '5-5 Atmung',
    description: '5s ein-, 5s ausatmen',
    inhale: 5000,
    exhale: 5000,
    hold: 0,
    pause: 1000,
  },
  box: {
    name: 'Box Atmung',
    description: '4s ein-, 4s halten, 4s ausatmen, 4s halten',
    inhale: 4000,
    exhale: 4000,
    hold: 4000,
    pause: 0,
  },
};

const durationOptions = [15, 30, 60, 120];

export default function LearnBreathe({ content, onNext, onPrev }: LearnBreatheProps) {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('pause');
  const [breathingText, setBreathingText] = useState('Bereit zum Atmen?');
  const [isComplete, setIsComplete] = useState(false);
  const [remainingTime, setRemainingTime] = useState(content.duration || 60);
  const [selectedDuration, setSelectedDuration] = useState(content.duration || 60);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>('5-7');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [shouldCompleteAfterExhale, setShouldCompleteAfterExhale] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBreathingRef = useRef(false);
  const shouldCompleteAfterExhaleRef = useRef(false);

  // Native: expo-audio players (only used when not web)
  const inhalePlayer = useAudioPlayer(
    Platform.OS === 'web' ? null : require('@/assets/audio/breathe-in.mp3')
  );
  const exhalePlayer = useAudioPlayer(
    Platform.OS === 'web' ? null : require('@/assets/audio/breathe-out.mp3')
  );

  // Web: HTML5 audio refs
  const inhaleAudioWebRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioWebRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load audio files
    loadAudio();
    return () => {
      stopBreathing();
      unloadAudio();
    };
  }, []);
  const loadAudio = async () => {
    if (Platform.OS === 'web') {
      try {
        const BrowserAudio = (window as any).Audio || (globalThis as any).Audio;
        const inhaleAudio = new BrowserAudio('/audio/breathe-in.mp3');
        inhaleAudio.volume = 1;
        inhaleAudio.preload = 'auto';
        inhaleAudio.setAttribute?.('data-testid', 'breathe-audio-in');
        inhaleAudioWebRef.current = inhaleAudio;

        const exhaleAudio = new BrowserAudio('/audio/breathe-out.mp3');
        exhaleAudio.volume = 1;
        exhaleAudio.preload = 'auto';
        exhaleAudio.setAttribute?.('data-testid', 'breathe-audio-out');
        exhaleAudioWebRef.current = exhaleAudio;

        // Append to DOM so Playwright can verify playback
        const container =
          document.getElementById('breathe-audio-container') ||
          (() => {
            const div = document.createElement('div');
            div.id = 'breathe-audio-container';
            div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
            document.body.appendChild(div);
            return div;
          })();
        container.appendChild(inhaleAudio);
        container.appendChild(exhaleAudio);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    }
    // Native: useAudioPlayer hooks load on mount and release on unmount
  };
  const unloadAudio = async () => {
    if (Platform.OS === 'web') {
      const inhale = inhaleAudioWebRef.current;
      if (inhale) {
        inhale.pause();
        inhale.remove();
        inhaleAudioWebRef.current = null;
      }
      const exhale = exhaleAudioWebRef.current;
      if (exhale) {
        exhale.pause();
        exhale.remove();
        exhaleAudioWebRef.current = null;
      }
    }
  };
  const playInhaleSound = () => {
    if (Platform.OS === 'web') {
      if (inhaleAudioWebRef.current) {
        inhaleAudioWebRef.current.currentTime = 0;
        inhaleAudioWebRef.current.play().catch(() => { });
      }
    } else {
      if (inhalePlayer) {
        inhalePlayer.seekTo(0);
        inhalePlayer.play();
      }
    }
  };
  const playExhaleSound = () => {
    if (Platform.OS === 'web') {
      if (exhaleAudioWebRef.current) {
        exhaleAudioWebRef.current.currentTime = 0;
        exhaleAudioWebRef.current.play().catch(() => { });
      }
    } else {
      if (exhalePlayer) {
        exhalePlayer.seekTo(0);
        exhalePlayer.play();
      }
    }
  };
  const getPhaseText = (phase: BreathingPhase): string => {
    switch (phase) {
      case 'inhale':
        return 'Einatmen';
      case 'exhale':
        return 'Ausatmen';
      case 'hold':
        return 'Halten';
      case 'pause':
        return 'Pause';
      default:
        return 'Bereit zum Atmen?';
    }
  };
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const startBreathing = () => {
    if (isBreathingRef.current) return;

    isBreathingRef.current = true;
    shouldCompleteAfterExhaleRef.current = false;
    setIsBreathing(true);
    setIsComplete(false);
    setRemainingTime(selectedDuration);
    setBreathingPhase('inhale');
    setBreathingText('Einatmen');

    const pattern = breathingPatterns[selectedPattern];

    // Start inhale animation
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1.8, duration: pattern.inhale, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: pattern.inhale, useNativeDriver: true }),
      Animated.timing(rotationAnim, { toValue: 180, duration: pattern.inhale, useNativeDriver: true }),
    ]).start();

    // Play inhale sound
    playInhaleSound();

    // Start timer
    startTimer();

    // After inhale, go to exhale
    phaseTimeoutRef.current = setTimeout(() => {
      if (!isBreathingRef.current) return;
      if (pattern.hold > 0) {
        // Box breathing: hold after inhale
        setBreathingPhase('hold');
        setBreathingText('Halten');
        phaseTimeoutRef.current = setTimeout(() => {
          if (!isBreathingRef.current) return;
          startExhale();
        }, pattern.hold);
      } else {
        startExhale();
      }
    }, pattern.inhale);
  };
  const startExhale = () => {
    if (!isBreathingRef.current) return;

    const pattern = breathingPatterns[selectedPattern];
    setBreathingPhase('exhale');
    setBreathingText('Ausatmen');

    // Start exhale animation
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: pattern.exhale, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.6, duration: pattern.exhale, useNativeDriver: true }),
      Animated.timing(rotationAnim, { toValue: 0, duration: pattern.exhale, useNativeDriver: true }),
    ]).start();

    // Play exhale sound
    playExhaleSound();

    // After exhale, check if done or continue
    phaseTimeoutRef.current = setTimeout(() => {
      if (!isBreathingRef.current) return;

      if (shouldCompleteAfterExhaleRef.current) {
        completeBreathing();
        return;
      }

      if (selectedPattern === 'box' && pattern.hold > 0) {
        // Box breathing: hold after exhale
        setBreathingPhase('hold');
        setBreathingText('Halten');
        phaseTimeoutRef.current = setTimeout(() => {
          if (!isBreathingRef.current) return;
          if (shouldCompleteAfterExhaleRef.current) {
            completeBreathing();
            return;
          }
          startInhale();
        }, pattern.hold);
      } else {
        // Go directly to next inhale (no pause)
        if (shouldCompleteAfterExhaleRef.current) {
          completeBreathing();
          return;
        }
        startInhale();
      }
    }, pattern.exhale);
  };
  const startInhale = () => {
    if (!isBreathingRef.current) return;

    const pattern = breathingPatterns[selectedPattern];
    setBreathingPhase('inhale');
    setBreathingText('Einatmen');

    // Start inhale animation
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1.8, duration: pattern.inhale, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: pattern.inhale, useNativeDriver: true }),
      Animated.timing(rotationAnim, { toValue: 0, duration: pattern.inhale, useNativeDriver: true }),
    ]).start();

    // Play inhale sound
    playInhaleSound();

    // After inhale, go to exhale
    phaseTimeoutRef.current = setTimeout(() => {
      if (!isBreathingRef.current) return;
      if (pattern.hold > 0) {
        setBreathingPhase('hold');
        setBreathingText('Halten');
        phaseTimeoutRef.current = setTimeout(() => {
          if (!isBreathingRef.current) return;
          startExhale();
        }, pattern.hold);
      } else {
        startExhale();
      }
    }, pattern.inhale);
  };
  const stopBreathing = () => {
    isBreathingRef.current = false;
    setIsBreathing(false);
    shouldCompleteAfterExhaleRef.current = false;
    setShouldCompleteAfterExhale(false);

    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    scaleAnim.setValue(1);
    opacityAnim.setValue(0.8);
    rotationAnim.setValue(0);
    setBreathingPhase('pause');
    setBreathingText('Bereit zum Atmen?');

    if (Platform.OS === 'web') {
      if (inhaleAudioWebRef.current) inhaleAudioWebRef.current.pause();
      if (exhaleAudioWebRef.current) exhaleAudioWebRef.current.pause();
    } else {
      if (inhalePlayer) inhalePlayer.pause();
      if (exhalePlayer) exhalePlayer.pause();
    }
  };
  const startTimer = () => {
    countdownIntervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          shouldCompleteAfterExhaleRef.current = true;
          setShouldCompleteAfterExhale(true);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const completeBreathing = () => {
    isBreathingRef.current = false;
    setIsBreathing(false);
    setIsComplete(true);
    setBreathingPhase('pause');
    setBreathingText('Atemübung abgeschlossen!');
    setRemainingTime(0);
    shouldCompleteAfterExhaleRef.current = false;
    setShouldCompleteAfterExhale(false);

    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    scaleAnim.setValue(1);
    opacityAnim.setValue(0.8);
    rotationAnim.setValue(0);

    if (Platform.OS === 'web') {
      if (inhaleAudioWebRef.current) inhaleAudioWebRef.current.pause();
      if (exhaleAudioWebRef.current) exhaleAudioWebRef.current.pause();
    } else {
      if (inhalePlayer) inhalePlayer.pause();
      if (exhalePlayer) exhalePlayer.pause();
    }

    setTimeout(() => {
      if (onNext) onNext();
    }, 1000);
  };

  const pattern = breathingPatterns[selectedPattern];

  return (
    <View className="flex-grow flex-col">
      {/* Top Section */}
      <View className="items-center mt-4">
        <Text className="mb-2 text-xl font-bold text-black">{breathingText}</Text>
        {isBreathing && !isComplete ? (
          <Text className="text-sm text-black/50">{formatTime(remainingTime)}</Text>
        ) : !isBreathing && !isComplete ? (
          <Text className="text-sm text-black/50">{pattern.description}</Text>
        ) : null}
      </View>

      {/* Middle Section - Breathing Circle */}
      <View className="flex-1 items-center justify-center">
        <View className="relative items-center justify-center w-52 h-52">
          {/* Breathing Ring - Behind */}
          <Animated.View
            style={[
              styles.breathingRing,
              {
                position: 'absolute',
                transform: [
                  { scale: scaleAnim },
                  {
                    rotate: rotationAnim.interpolate({
                      inputRange: [0, 180],
                      outputRange: ['0deg', '180deg'],
                    })
                  },
                ],
                opacity: opacityAnim,
              },
            ]}
          />
          {/* Play Button - In Front */}
          <View testID="breathe-container" style={{ zIndex: 10, width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: baseColors.forest }}>
            {isBreathing ? (
              <TouchableOpacity
                testID="breathe-stop"
                onPress={stopBreathing}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#fff' }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="breathe-play"
                onPress={startBreathing}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
              >
                <Play size={20} color="#fff" fill="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Duration and Technique Controls - Below Play Button */}
        {!isBreathing && !isComplete && (
          <View className="items-center mt-8 relative">
            {/* Backdrop for closing dropdowns */}
            {(showDurationPicker || showPatternPicker) && (
              <TouchableWithoutFeedback
                onPress={() => {
                  setShowDurationPicker(false);
                  setShowPatternPicker(false);
                }}
              >
                <View style={{ position: 'absolute', top: -10000, bottom: '100%', left: -10000, right: -10000, zIndex: 998 }} />
              </TouchableWithoutFeedback>
            )}

            {/* Toggle Buttons */}
            <View className="flex-row items-center justify-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setShowDurationPicker(!showDurationPicker);
                  setShowPatternPicker(false);
                }}
                className="flex-row items-center gap-2 rounded-lg border border-white bg-white/80 px-3 py-1.5 shadow-sm"
              >
                <Text className="text-sm font-medium text-black/50">Dauer</Text>
                <Text className="text-sm font-medium text-black">{formatTime(selectedDuration)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowPatternPicker(!showPatternPicker);
                  setShowDurationPicker(false);
                }}
                className="flex-row items-center gap-2 rounded-lg border border-white bg-white/80 px-3 py-1.5 shadow-sm"
              >
                <Text className="text-sm font-medium text-black/50">Technik</Text>
                <Text className="text-sm font-medium text-black">{pattern.name}</Text>
              </TouchableOpacity>
            </View>

            {/* Duration Picker - Absolutely Positioned Above */}
            {showDurationPicker && (
              <View style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, alignItems: 'center', zIndex: 1000 }}>
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#fff', backgroundColor: '#fafafa', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {durationOptions.map((duration) => (
                      <TouchableOpacity
                        key={duration}
                        onPress={() => {
                          setSelectedDuration(duration);
                          setRemainingTime(duration);
                          setShowDurationPicker(false);
                        }}
                        style={{
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: selectedDuration === duration ? '#000' : '#fff',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: selectedDuration === duration ? '#fff' : '#000',
                          }}
                        >
                          {formatTime(duration)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Pattern Picker - Absolutely Positioned Above */}
            {showPatternPicker && (
              <View style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, alignItems: 'center', zIndex: 1000 }}>
                <View style={{ maxWidth: 320, borderRadius: 12, borderWidth: 1, borderColor: '#fff', backgroundColor: '#fafafa', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                  <View style={{ flexDirection: 'column', gap: 4 }}>
                    {Object.entries(breathingPatterns).map(([key, p]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => {
                          setSelectedPattern(key as BreathingPattern);
                          setShowPatternPicker(false);
                        }}
                        style={{
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: selectedPattern === key ? '#000' : '#fff',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: selectedPattern === key ? '#fff' : '#000',
                          }}
                        >
                          {p.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            opacity: 0.75,
                            color: selectedPattern === key ? '#fff' : '#000',
                          }}
                        >
                          {p.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  breathingRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
