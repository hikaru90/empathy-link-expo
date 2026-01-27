/**
 * Bodymap character silhouette for LearnBodyMap.
 * Derived from ../empathy-link static/learn/character.svg
 * Renders at viewBox 0 0 365 638 for consistent tap coordinates.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const VIEWBOX_WIDTH = 365;
const VIEWBOX_HEIGHT = 638;

interface BodyMapCharacterProps {
  width: number;
  height?: number; // defaults to preserve aspect ratio
  style?: object;
}

export default function BodyMapCharacter({
  width,
  height = width * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH),
  style,
}: BodyMapCharacterProps) {
  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient
            id="bodyGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(30.0502,270.357,-270.357,30.0502,363.728,477.111)"
          >
            <Stop offset="0" stopColor="rgb(96,227,166)" stopOpacity="1" />
            <Stop offset="1" stopColor="rgb(5,202,110)" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <G transform="matrix(0.971835,0,0,0.968977,-236.578,-204.733)">
          {/* Left leg */}
          <G transform="matrix(1.02774,0.050758,-0.0369702,0.752986,33.3942,85.7749)">
            <Path
              d="M260.317,419.401C261.955,450.65 247.472,555.095 241.41,554.606C235.348,554.117 221.807,439.607 223.945,416.468C226.763,385.975 258.646,387.527 260.317,419.401Z"
              fill="rgb(165,160,151)"
            />
          </G>
          {/* Right leg */}
          <G transform="matrix(1.01862,-0.146107,0.0968043,0.678879,199.719,186.116)">
            <Path
              d="M260.317,419.401C261.955,450.65 247.472,555.095 241.41,554.606C235.348,554.117 221.807,439.607 223.945,416.468C226.763,385.975 258.646,387.527 260.317,419.401Z"
              fill="rgb(165,160,151)"
            />
          </G>
          {/* Torso (green/gradient) */}
          <G transform="matrix(1.02898,0,0,1.03202,-17.4719,-27.516)">
            <Path
              d="M428.773,454.845C450.451,465.378 467.735,484.531 475.326,509.063L559.78,781.997L482.178,780.784L405.325,522.523C404.771,520.662 402.883,519.537 400.982,519.936C399.082,520.334 397.805,522.123 398.046,524.05L430.039,780.178L352.438,781.391L322.582,515.372C320.751,499.059 325.427,483.442 334.603,471.199C374.49,452.791 408.449,452.939 428.773,454.845Z"
              fill="url(#bodyGradient)"
            />
          </G>
          {/* Head */}
          <G transform="matrix(1.02898,0,0,1.03202,-42.7869,-87.2359)">
            <Circle cx="413.759" cy="329.638" r="33.86" fill="rgb(165,160,151)" />
          </G>
          {/* Body / shirt (lilac) */}
          <G transform="matrix(1.02174,0.122183,-0.105357,0.886243,32.3402,-36.4478)">
            <Path
              d="M265.97,394.638C269.64,358.668 296.129,330.727 328.217,330.727L357.419,330.727C378.259,338.45 403.051,347.71 422.517,330.727L441.258,330.727C469.712,330.727 493.764,352.699 501.405,382.757L519.295,447.286L489.301,449.736C477.799,465.593 460.539,475.682 441.258,475.682L328.217,475.682C310.257,475.682 294.051,466.929 282.619,452.914L257.205,451.46L265.97,394.638Z"
              fill="rgb(175,163,255)"
            />
          </G>
        </G>
      </Svg>
    </View>
  );
}

export { VIEWBOX_HEIGHT, VIEWBOX_WIDTH };
