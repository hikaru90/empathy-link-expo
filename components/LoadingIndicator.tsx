import SparklePill from '@/components/SparklePill';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  style?: object;
  inline?: boolean; // For inline use in buttons (no message, no container gap)
}

export default function LoadingIndicator({ 
  message, 
  style,
  inline = false
}: LoadingIndicatorProps) {
  // Use consistent size matching the header (32x16)
  const width = 32;
  const height = 16;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in: scale from 0 to 1
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Cleanup: animate out when component unmounts
    return () => {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  }, [scaleAnim]);

  if (inline) {
    // For inline use in buttons - just the pill, no container
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <SparklePill width={width} height={height} />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <SparklePill width={width} height={height} />
      </Animated.View>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
