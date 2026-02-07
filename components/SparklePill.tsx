import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

interface SparklePillProps {
  width?: number;
  height?: number;
}

export default function SparklePill(props: SparklePillProps = {}) {
  const { width = 32, height = 16 } = props;
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(width);
  const [containerHeight, setContainerHeight] = useState(height);

  useEffect(() => {
    if (containerWidth <= 0) return;
    
    const animate = () => {
      // Reset to start position (one image width to the left)
      translateX.setValue(-containerWidth * 2);

      // Animate to end position (one full image width)
      Animated.timing(translateX, {
        toValue: 0,
        duration: 4000, // Adjust speed as needed
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        // Loop the animation
        animate();
      });
    };

    animate();
  }, [containerWidth]);

  return (
    <View
      style={{
        width: width,
        height: height,
        overflow: 'hidden',
        backgroundColor: '#106869',
        position: 'relative',
        borderRadius: 999,
        boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.2)',
      }}
      onLayout={(event) => {
        const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
        setContainerWidth(layoutWidth);
        setContainerHeight(layoutHeight);
      }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: containerWidth * 4, 
            height: containerHeight,
          },
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/SparklePill.png')}
          style={[styles.image, { width: containerWidth * 2, height: containerHeight }]}
          contentFit="fill"
        />
        <Image
          source={require('@/assets/images/SparklePill.png')}
          style={[styles.image, { width: containerWidth * 2, height: containerHeight }]}
          contentFit="fill"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    marginRight: -1,
  },
});