import baseColorsConfig from '@/baseColors.config';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface GradientImageProps {
  style?: object;
  fast?: boolean;
  children?: React.ReactNode;
}

interface ColorConfig {
  colorName: string;
  color: string;
  size: number;
  x: number;
  y: number;
  z: number;
  delay: number;
  opacity: number;
}

export default function GradientImage({ style, fast = false, children }: GradientImageProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const duration = fast ? 2000 : 6000;

  const colors: ColorConfig[] = [
    { colorName: 'rose', color: '#F0BADA', size: 3, x: 0, y: 50, z: 1, delay: 0, opacity: 0.6 },
    { colorName: 'forest', color: '#17545A', size: 2, x: 0, y: 80, z: 0, delay: duration / 3, opacity: 0.2 },
    { colorName: 'orange', color: '#FF9C34', size: 2, x: 50, y: 20, z: 2, delay: (duration * 2) / 3, opacity: 0.8 },
  ];

  return (
    <View 
      style={[styles.container, style]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      {containerWidth > 0 && colors.map((color, index) => (
        <AnimatedOrb
          key={`${color.colorName}-${index}`}
          color={color}
          containerWidth={containerWidth}
          duration={duration}
        />
      ))}
      {children}
    </View>
  );
}

interface AnimatedOrbProps {
  color: ColorConfig;
  containerWidth: number;
  duration: number;
}

function AnimatedOrb({ color, containerWidth, duration }: AnimatedOrbProps) {
  const [translateX] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (containerWidth <= 0) return;
    
    const animate = () => {
      translateX.setValue(containerWidth * -1.5);
      opacity.setValue(0);

      Animated.sequence([
        // Fade in at start position
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration * 0.05,
          delay: color.delay,
          useNativeDriver: true,
        }),
        // Move and fade out
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: containerWidth * 1.5,
            duration: duration * 0.9,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.85),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.05,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        // Loop the animation
        animate();
      });
    };

    animate();
  }, [containerWidth, duration, color.delay]);

  const orbSize = containerWidth * color.size;

  return (
    <Animated.View
      style={[
        styles.orbContainer,
        {
          left: `${color.x}%`,
          top: `${color.y}%`,
          transform: [{ translateX }],
          opacity,
          zIndex: color.z,
        },
      ]}
    >
      <View style={styles.orbInner}>
        <Svg
          width={orbSize}
          height={orbSize}
          style={[styles.orb, { opacity: color.opacity }]}
          viewBox={`0 0 ${orbSize} ${orbSize}`}
        >
          <Defs>
            <RadialGradient id={`grad-${color.colorName}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color.color} stopOpacity={1} />
              <Stop offset="40%" stopColor={color.color} stopOpacity={0.5} />
              <Stop offset="75%" stopColor={color.color} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={color.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={orbSize / 2} cy={orbSize / 2} r={orbSize / 2} fill={`url(#grad-${color.colorName})`} />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: baseColorsConfig.lilac, // lilac background
  },
  orbContainer: {
    position: 'absolute',
  },
  orbInner: {
    position: 'relative',
    width: 1,
    height: 1,
  },
  orb: {
    position: 'absolute',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    borderRadius: 9999,
  },
});
