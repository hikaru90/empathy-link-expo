/**
 * Environment configuration
 *
 * Automatically detects the backend URL based on the environment.
 * You can override by setting EXPO_PUBLIC_API_URL in your .env file
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Backend port - can be overridden via EXPO_PUBLIC_BACKEND_PORT in .env
const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT 
  ? parseInt(process.env.EXPO_PUBLIC_BACKEND_PORT, 10) 
  : 4000;

// Manual IP override for when auto-detection fails (e.g., tunnel mode)
// Set this to your computer's IP address if you're using Expo tunnel mode
// To find your IP: ipconfig getifaddr en0 (macOS) or ipconfig (Windows)
// const MANUAL_IP_OVERRIDE = '192.168.2.52'; // Your current work IP
const MANUAL_IP_OVERRIDE = '192.168.2.30'; // Your current home IP

/**
 * Dynamically detect the host machine's IP address from Expo's debugger connection
 * This works when running in Expo Go or development builds
 */
function getHostIPAddress(): string | null {
  try {
    // In Expo, the debugger URL contains the host machine's IP
    // Try multiple sources in order of preference
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;

    if (debuggerHost) {
      // Check if it's a tunnel URL (contains .exp.direct or similar)
      if (debuggerHost.includes('.exp.direct') || debuggerHost.includes('expo.dev')) {
        console.warn('⚠️ Detected Expo tunnel mode:', debuggerHost);
        console.warn('⚠️ Tunnel mode detected - will use manual IP override for backend connection.');
        console.warn('⚠️ Make sure your device is on the same WiFi network as your computer.');
        console.warn('⚠️ If requests fail, try: npx expo start --lan (instead of --tunnel)');
        return null; // Don't use tunnel URLs, will fall back to manual IP
      }

      // Check if it's a valid IP address (192.168.x.x format)
      const ip = debuggerHost.split(':')[0];
      const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);

      if (isValidIP) {
        console.log('✅ Detected host IP from Expo:', ip);
        return ip;
      } else {
        console.warn('Invalid IP format detected:', ip);
      }
    }

    // Alternative: try to get from manifest
    if (Constants.manifest?.bundleUrl) {
      const bundleUrl = Constants.manifest.bundleUrl;
      const match = bundleUrl.match(/\/\/([\d.]+):/);
      if (match && match[1]) {
        console.log('✅ Detected host IP from bundle URL:', match[1]);
        return match[1];
      }
    }
  } catch (error) {
    console.warn('Could not detect host IP:', error);
  }

  return null;
}

/**
 * Get the appropriate backend URL based on the platform
 */
export function getBackendURL(): string {
  // Check for manual override via environment variable (highest priority)
  const manualUrl = process.env.EXPO_PUBLIC_API_URL;
  if (manualUrl) {
    const cleanUrl = manualUrl.trim().replace(/\/$/, '');
    console.log('Using manual API URL from env:', cleanUrl);
    return cleanUrl;
  }

  // For web platform, use EXPO_PUBLIC_BETTER_AUTH_URL if available, otherwise EXPO_PUBLIC_API_URL
  if (Platform.OS === 'web') {
    const betterAuthUrl = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;
    if (betterAuthUrl) {
      const cleanUrl = betterAuthUrl.trim().replace(/\/$/, '');
      console.log('Web platform: Using Better Auth URL as API URL:', cleanUrl);
      return cleanUrl;
    }
    // Web fallback: localhost when no env vars (Chrome devtools, local dev)
    const localUrl = `http://localhost:${BACKEND_PORT}`;
    console.warn('⚠️ Web platform: No EXPO_PUBLIC_API_URL or EXPO_PUBLIC_BETTER_AUTH_URL set, using', localUrl);
    return localUrl;
  }

  // For native devices (iOS/Android), try to auto-detect the host IP
  // This is useful for development when connecting to a local dev server
  const detectedIP = getHostIPAddress();
  if (detectedIP) {
    console.log('✅ Detected device, using host IP:', detectedIP);
    return `http://${detectedIP}:${BACKEND_PORT}`;
  }

  // Fallback: use manual IP override if available
  if (MANUAL_IP_OVERRIDE) {
    const backendUrl = `http://${MANUAL_IP_OVERRIDE}:${BACKEND_PORT}`;
    console.warn('⚠️ Could not auto-detect IP, using manual override:', backendUrl);
    console.warn('💡 If requests fail, verify:');
    console.warn('   1. Your device is on the same WiFi network as your computer');
    console.warn('   2. Your backend server is running on port', BACKEND_PORT);
    console.warn('   3. Your computer\'s IP is', MANUAL_IP_OVERRIDE);
    console.warn('   4. Try: ipconfig getifaddr en0 (macOS) to get your current IP');
    return backendUrl;
  }

  // No fallback - require env vars to be set
  console.error('❌ Could not determine backend URL. Please set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_BETTER_AUTH_URL in your .env file');
  throw new Error('EXPO_PUBLIC_API_URL or EXPO_PUBLIC_BETTER_AUTH_URL must be set');
}

export const API_BASE_URL = getBackendURL();

/**
 * Get the Better Auth URL
 * Uses EXPO_PUBLIC_BETTER_AUTH_URL from .env if set, otherwise falls back to EXPO_PUBLIC_API_URL
 */
export function getBetterAuthURL(): string {
  // Check for Better Auth URL from .env
  const betterAuthUrl = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;
  if (betterAuthUrl) {
    const cleanUrl = betterAuthUrl.trim().replace(/\/$/, '');
    console.log('Using Better Auth URL from env:', cleanUrl);
    return cleanUrl;
  }

  // Fallback to EXPO_PUBLIC_API_URL if set
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    const cleanUrl = apiUrl.trim().replace(/\/$/, '');
    console.log('Using API URL as Better Auth URL:', cleanUrl);
    return cleanUrl;
  }

  // Final fallback to API_BASE_URL (for native devices with IP detection)
  return API_BASE_URL;
}

export const BETTER_AUTH_URL = getBetterAuthURL();

/**
 * Get the Expo app URL for callback URLs (e.g., email verification links)
 * For web: uses localhost:8081 or window.location.origin
 * For native: uses deep link scheme (empathy-link://)
 */
export function getExpoAppURL(): string {
  // For web platform
  if (Platform.OS === 'web') {
    // Try to use window.location.origin if available (browser)
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    // Fallback to localhost:8081 for web development
    return 'http://localhost:8081';
  }
  
  // For native platforms, use deep link scheme
  // This matches the scheme defined in app.json
  return 'empathy-link://';
}

export const EXPO_APP_URL = getExpoAppURL();

// Log the configuration for debugging
console.log('========================================');
console.log('Backend Configuration:');
console.log('  API URL:', API_BASE_URL);
console.log('  Better Auth URL:', BETTER_AUTH_URL);
console.log('  Expo App URL:', EXPO_APP_URL);
console.log('  Backend Port:', BACKEND_PORT);
console.log('  Platform:', Platform.OS);
console.log('  Is Device:', Constants.isDevice);
console.log('  Expo Go:', Constants.appOwnership === 'expo');
console.log('  hostUri:', Constants.expoConfig?.hostUri);
console.log('  debuggerHost:', Constants.manifest?.debuggerHost);
console.log('========================================');
