import baseColors from '@/baseColors.config';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import {
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface BackgroundImageButtonProps {
  onPress: () => void;
  label: string;
  source: ImageSourcePropType;
  style?: ViewStyle;
}

export default function BackgroundImageButton({
  onPress,
  label,
  source,
  style,
}: BackgroundImageButtonProps) {
  return (
    <TouchableOpacity
      style={[
        { flex: 1, height: 44, overflow: 'hidden', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.1)', position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 16, paddingLeft: 16, paddingRight: 8 },
        style,
      ]}
      onPress={onPress}
    >
      <Image
        source={source}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: -1 }}
        contentFit="cover"
      />
      <Text style={{ fontSize: 14, fontWeight: '600', color: baseColors.offwhite }}>{label}</Text>
      <View style={{ backgroundColor: baseColors.white + '44', padding: 2, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>

      <ArrowRight size={18} color="#fff" style={{ }} />
      </View>
    </TouchableOpacity>
  );
}
