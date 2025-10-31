/**
 * Typing indicator component showing three animated dots
 * Similar to the loading animation in the SvelteKit app
 */

import { View, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export default function TypingIndicator() {
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(1);
  const opacity3 = useSharedValue(1);

  useEffect(() => {
    // First dot animation
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1, // infinite repeat
      false
    );

    // Second dot animation (delayed by 250ms)
    setTimeout(() => {
      opacity2.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    }, 250);

    // Third dot animation (delayed by 500ms)
    setTimeout(() => {
      opacity3.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    }, 500);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, animatedStyle1]} />
          <Animated.View style={[styles.dot, animatedStyle2]} />
          <Animated.View style={[styles.dot, animatedStyle3]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
});
