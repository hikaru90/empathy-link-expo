import baseColors from '@/baseColors.config';
import { Image } from 'expo-image';
import React, { ReactElement } from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export type ImageIconButtonSize = 'small' | 'medium' | 'large';

const SIZE_CONFIG: Record<
  ImageIconButtonSize,
  { vertical: number; left: number; right: number; gap: number; iconSize: number; iconWrapPadding: number }
> = {
  small: { vertical: 8, left: 12, right: 8, gap: 12, iconSize: 12, iconWrapPadding: 2 },
  medium: { vertical: 8, left: 16, right: 8, gap: 16, iconSize: 12, iconWrapPadding: 5 },
  large: { vertical: 8, left: 20, right: 8, gap: 32, iconSize: 12, iconWrapPadding: 8 },
};

interface ImageIconButtonProps {
  onPress: () => void;
  image: ImageSourcePropType;
  icon: ReactElement;
  label: string;
  size?: ImageIconButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export default function ImageIconButton({
  onPress,
  image,
  icon,
  label,
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  testID,
}: ImageIconButtonProps) {
  const config = SIZE_CONFIG[size];
  const iconWithSize = React.isValidElement(icon) ? React.cloneElement(icon, { size: config.iconSize } as Record<string, unknown>) : icon;
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.button,
        {
          paddingVertical: config.vertical,
          paddingLeft: config.left,
          paddingRight: config.right,
          gap: config.gap,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Image
        source={image}
        style={[
          styles.backgroundImage,
          {
            paddingVertical: config.vertical,
            paddingLeft: config.left,
            paddingRight: config.right,
            borderRadius: 999,
          },
        ]}
      />
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.iconWrap, { padding: config.iconWrapPadding }]}>
        {loading ? <ActivityIndicator size="small" color={baseColors.offwhite} /> : iconWithSize}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  label: {
    fontSize: 14,
    color: baseColors.offwhite,
    fontWeight: '500',
  },
  iconWrap: {
    backgroundColor: baseColors.white + '44',
    borderRadius: 999,
  },
});
