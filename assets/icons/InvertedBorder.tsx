import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface InvertedBorderProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  style?: any;
}

export default function InvertedBorder({ width = '100%', 
  height = '100%',
  color = '#f1efea',
  style 
}: InvertedBorderProps) {
  // From inverted-border-white.svg - path scaled to fit viewBox
  return (
    <View style={[{ width, height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 24.183 24.183" preserveAspectRatio="none">
        <Path
          d="M24.183,24.183L0,24.183L0,0C0,15.348 10.836,24.183 24.183,24.183Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

