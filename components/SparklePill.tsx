import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';


export default function SparklePill() {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(40);
  const [containerHeight, setContainerHeight] = useState(20);

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
        useNativeDriver: true,
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
        width: 32,
        height: 16,
        overflow: 'hidden',
        backgroundColor: '#106869',
        position: 'relative',
        borderRadius: 999,
        boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.2)',
      }}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerWidth(width);
        setContainerHeight(height);
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