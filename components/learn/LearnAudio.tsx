/**
 * LearnAudio component for React Native Expo
 * Plays audio content with custom controls and completion tracking
 */

import baseColors from '@/baseColors.config';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';


// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

interface LearnAudioProps {
  content: {
    type: 'audio';
    src: string;
    content?: string;
    title?: string;
    transcript?: string;
    autoplay?: boolean;
    loop?: boolean;
    controls?: boolean;
  };
  color?: string;
  session?: any;
  onResponse?: (response: any) => void;
}

export default function LearnAudio({
  content,
  color,
  session,
  onResponse,
}: LearnAudioProps) {
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Audio source for native: only load when not web and src is valid
  const nativeAudioSource = Platform.OS === 'web' || !content?.src?.trim() ? null : content.src;
  const player = useAudioPlayer(nativeAudioSource, {
    updateInterval: 100,
    downloadFirst: true,
  });
  const playerStatus = useAudioPlayerStatus(player);

  // Audio refs (web only for native we use player)
  const audioWebRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expandAnim1 = useRef(new Animated.Value(1)).current;
  const expandAnim2 = useRef(new Animated.Value(1)).current;

  // Check for existing completion status
  useEffect(() => {
    if (session?.responses) {
      const existingResponse = session.responses.find(
        (r: any) => r.blockType === 'audio' && JSON.stringify(r.blockContent) === JSON.stringify(content)
      );
      if (existingResponse) {
        setIsCompleted(existingResponse.response.completed || false);
      }
    }
  }, [session, content]);


  // Animate expanding circles - bidirectional pulsing
  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(expandAnim1, {
              toValue: 1.5,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(expandAnim1, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(expandAnim2, {
              toValue: 1.5,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(expandAnim2, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    if (isPlaying) {
      animate();
    } else {
      expandAnim1.setValue(1);
      expandAnim2.setValue(1);
    }
  }, [isPlaying]);

  // Native: set audio mode and sync player status to state
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && player) {
      player.loop = content.loop ?? false;
    }
  }, [Platform.OS, player, content.loop]);

  useEffect(() => {
    if (Platform.OS !== 'web' && playerStatus) {
      setCurrentTime(playerStatus.currentTime ?? 0);
      setDuration(playerStatus.duration ?? 0);
      setIsPlaying(playerStatus.playing ?? false);
      if (playerStatus.isLoaded) {
        setIsLoading(false);
      }
      if (playerStatus.didJustFinish && !content.loop) {
        setIsPlaying(false);
        markCompleted('played');
      }
    }
  }, [Platform.OS, playerStatus?.currentTime, playerStatus?.duration, playerStatus?.playing, playerStatus?.isLoaded, playerStatus?.didJustFinish, content.loop]);

  // Native: autoplay once when loaded
  const nativeAutoplayDoneRef = useRef(false);
  useEffect(() => {
    if (
      Platform.OS !== 'web' &&
      player &&
      playerStatus?.isLoaded &&
      content.autoplay &&
      !nativeAutoplayDoneRef.current
    ) {
      nativeAutoplayDoneRef.current = true;
      player.play();
      setIsPlaying(true);
      setIsLoading(false);
    }
  }, [Platform.OS, player, playerStatus?.isLoaded, content.autoplay]);

  // Load audio on mount (web only; native uses useAudioPlayer)
  useEffect(() => {
    if (Platform.OS === 'web') {
      loadAudio();
    } else if (nativeAudioSource === null) {
      setIsLoading(false);
      setHasError(true);
    }
    return () => {
      unloadAudio();
    };
  }, []);

  const loadAudio = async () => {
    if (!content.src || content.src.trim() === '') {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // Web: Use HTML5 Audio
        const BrowserAudio = (window as any).Audio || (globalThis as any).Audio;
        const audio = new BrowserAudio(content.src);
        audio.preload = 'metadata';
        audio.volume = 1;

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration || 0);
          setIsLoading(false);
        });

        audio.addEventListener('canplay', () => {
          setIsLoading(false);
        });

        audio.addEventListener('loadstart', () => {
          setIsLoading(true);
        });

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime || 0);
        });

        audio.addEventListener('play', () => {
          setIsPlaying(true);
          setIsLoading(false);
          startProgressTracking();
        });

        audio.addEventListener('pause', () => {
          setIsPlaying(false);
          stopProgressTracking();
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          stopProgressTracking();
          if (content.loop) {
            audio.currentTime = 0;
            audio.play();
          } else {
            markCompleted('played');
          }
        });

        audio.addEventListener('error', () => {
          console.error('Audio loading error');
          setIsLoading(false);
          setIsPlaying(false);
          setHasError(true);
        });

        audio.setAttribute?.('data-testid', 'audio-player');
        const container =
          document.getElementById('learn-audio-container') ||
          (() => {
            const div = document.createElement('div');
            div.id = 'learn-audio-container';
            div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
            document.body.appendChild(div);
            return div;
          })();
        container.appendChild(audio);
        audioWebRef.current = audio;

        // Set loading timeout
        const loadingTimeout = setTimeout(() => {
          if (isLoading) {
            console.warn('Audio loading timeout');
            setIsLoading(false);
          }
        }, 10000);

        // Clear timeout when audio loads
        const clearTimeoutOnLoad = () => clearTimeout(loadingTimeout);
        audio.addEventListener('loadeddata', clearTimeoutOnLoad);
        audio.addEventListener('canplay', clearTimeoutOnLoad);
        audio.addEventListener('error', clearTimeoutOnLoad);

        if (content.autoplay) {
          await audio.play();
        }
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const unloadAudio = async () => {
    stopProgressTracking();
    if (Platform.OS === 'web') {
      const el = audioWebRef.current;
      if (el) {
        el.pause();
        el.remove();
        audioWebRef.current = null;
      }
    }
    // Native: useAudioPlayer hook releases the player on unmount
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) return;
    progressIntervalRef.current = setInterval(() => {
      if (Platform.OS === 'web' && audioWebRef.current) {
        setCurrentTime(audioWebRef.current.currentTime || 0);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const markCompleted = (method: 'played' | 'skipped') => {
    if (isCompleted) return;

    setIsCompleted(true);

    if (onResponse) {
      onResponse({
        completed: true,
        method: method,
        timeListened: currentTime,
        totalDuration: duration,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const togglePlay = async () => {
    if (isLoading || hasError) return;

    try {
      if (Platform.OS === 'web') {
        if (audioWebRef.current) {
          if (isPlaying) {
            audioWebRef.current.pause();
          } else {
            setIsLoading(true);
            await audioWebRef.current.play();
          }
        }
      } else {
        if (player) {
          if (isPlaying) {
            player.pause();
            setIsPlaying(false);
          } else {
            setIsLoading(true);
            player.play();
            setIsPlaying(true);
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Audio play error:', error);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const restart = async () => {
    try {
      if (Platform.OS === 'web') {
        if (audioWebRef.current) {
          audioWebRef.current.currentTime = 0;
        }
      } else {
        if (player) {
          player.seekTo(0);
        }
      }
    } catch (error) {
      console.error('Restart error:', error);
    }
  };

  return (
    <View className="flex-grow flex-col justify-between">
      {/* Title */}
      <View className="items-center pb-2">
        <Text className="text-xl font-bold text-black">Zeit zu Meditieren</Text>
        {content.content && (
        <View className="pb-4 text-center flex flex-rwo items-center justify-center">
          <Markdown
            markdownit={markdownItInstance}
            style={{
              body: {
                fontSize: 14,
                color: 'rgba(0, 0, 0, 0.4)',
                textAlign: 'center',
              },
            }}
          >
            {content.content}
          </Markdown>
        </View>
      )}
      </View>
      

      {/* Custom Audio Player */}
      {content.controls !== false && (
        <View className="flex flex-col items-center justify-between gap-4">
          {/* Play/Pause Button */}
          <View className="relative z-10">
            {isPlaying && !hasError && !isLoading && (
              <TouchableOpacity
                onPress={restart}
                className="absolute -top-16 left-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black z-10"
                style={{
                  transform: [{ translateX: -16 }],
                  top: -64,
                }}
              >
                <RotateCcw size={12} color="#fff" />
              </TouchableOpacity>
            )}
            {isPlaying && (
              <>
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 120,
                    height: 120,
                    borderRadius: 80,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    left: '50%',
                    top: '50%',
                    zIndex: -1,
                    transform: [
                      { translateX: '-50%' },
                      { translateY: '-50%' },
                      { scale: expandAnim1 },
                    ],
                  }}
                />
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: 56,
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    left: '50%',
                    top: '50%',
                    zIndex: -1,
                    transform: [
                      { translateX: '-50%' },
                      { translateY: '-50%' },
                      { scale: expandAnim2 },
                    ],
                  }}
                />
              </>
            )}
            <TouchableOpacity
              testID="audio-play"
              onPress={togglePlay}
              disabled={isLoading || hasError}
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
              style={[styles.shadowButton, (isLoading || hasError) && { opacity: 0.5 }, { backgroundColor: baseColors.forest }]}
            >
              {hasError ? (
                <Text className="text-red-400 text-lg">⚠️</Text>
              ) : isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isPlaying ? (
                <Pause size={24} color="#fff" />
              ) : (
                <Play size={24} color="#fff" fill="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Time remaining */}
          <View className="relative z-10 rounded-full bg-white/90 px-3 py-1">
            <Text className="text-sm">{formatTime(Math.max(0, duration - currentTime))}</Text>
          </View>
        </View>
      )}

      <View className=""></View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

