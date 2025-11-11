/**
 * WCAG-compliant color contrast utilities
 * Ensures text meets accessibility standards (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
 */

/**
 * Calculate relative luminance according to WCAG 2.1
 * Formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse hex color to RGB tuple
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex (e.g., #fff)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;
  
  if (fullHex.length !== 6) return null;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  
  return [r, g, b];
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1; // Invalid colors = no contrast
  
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get appropriate text color (white or black) for a given background color
 * Ensures WCAG AA compliance (4.5:1 contrast ratio for normal text)
 * 
 * @param backgroundColor - Hex color string (e.g., '#17545A')
 * @param fontSize - Font size in pixels (default: 14)
 * @param fontWeight - Font weight (default: 400)
 * @returns '#ffffff' or '#000000'
 */
export function getTextColorForBackground(
  backgroundColor: string,
  fontSize: number = 14,
  fontWeight: number = 400
): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000'; // Default to black for invalid colors
  
  // Determine if text is "large" according to WCAG
  // Large text is: 18pt+ regular OR 14pt+ bold (700+)
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
  const minContrast = isLargeText ? 3.0 : 4.5; // WCAG AA standards
  
  // Test both white and black text
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  // Choose the color that meets the contrast requirement
  // If both meet it, prefer the one with higher contrast
  // If neither meets it, choose the one with better contrast anyway
  if (whiteContrast >= minContrast && blackContrast >= minContrast) {
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  } else if (whiteContrast >= minContrast) {
    return '#ffffff';
  } else if (blackContrast >= minContrast) {
    return '#000000';
  } else {
    // Neither meets the standard, choose the better one
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }
}

/**
 * Check if a text/background color combination meets WCAG AA standards
 * 
 * @param textColor - Hex color string for text
 * @param backgroundColor - Hex color string for background
 * @param fontSize - Font size in pixels (default: 14)
 * @param fontWeight - Font weight (default: 400)
 * @returns Object with contrast ratio and compliance info
 */
export function checkContrastCompliance(
  textColor: string,
  backgroundColor: string,
  fontSize: number = 14,
  fontWeight: number = 400
): {
  contrastRatio: number;
  passesAA: boolean;
  passesAAA: boolean;
  isLargeText: boolean;
  minContrastAA: number;
  minContrastAAA: number;
} {
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
  const minContrastAA = isLargeText ? 3.0 : 4.5;
  const minContrastAAA = isLargeText ? 4.5 : 7.0;
  
  const contrastRatio = getContrastRatio(textColor, backgroundColor);
  
  return {
    contrastRatio,
    passesAA: contrastRatio >= minContrastAA,
    passesAAA: contrastRatio >= minContrastAAA,
    isLargeText,
    minContrastAA,
    minContrastAAA,
  };
}

