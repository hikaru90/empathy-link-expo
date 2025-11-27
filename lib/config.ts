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
const MANUAL_IP_OVERRIDE = '192.168.2.52'; // Your current work IP
// const MANUAL_IP_OVERRIDE = '192.168.178.24'; // Your current home IP

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
        console.warn('⚠️ Tunnel mode does not work with local backend servers.');
        console.warn('⚠️ Make sure your device is on the same WiFi network as your computer.');
        console.warn('⚠️ Then restart Expo with: npx expo start --lan');
        return null; // Don't use tunnel URLs
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
  // Check for manual override via environment variable
  const manualUrl = process.env.EXPO_PUBLIC_API_URL;
  if (manualUrl) {
    console.log('Using manual API URL from env:', manualUrl);
    return manualUrl;
  }

  // If running on web, use localhost
  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // Check if running in iOS Simulator (not a physical device)
  const isIOSSimulator = Platform.OS === 'ios' && !Constants.isDevice;
  if (isIOSSimulator) {
    console.log('Detected iOS Simulator, using localhost');
    return `http://localhost:${BACKEND_PORT}`;
  }

  // For physical devices, try to auto-detect the host IP
  const detectedIP = getHostIPAddress();
  if (detectedIP) {
    console.log('✅ Detected physical device, using host IP:', detectedIP);
    return `http://${detectedIP}:${BACKEND_PORT}`;
  }

  // Fallback: use manual IP override if available
  if (MANUAL_IP_OVERRIDE) {
    console.warn('⚠️ Could not auto-detect IP, using manual override:', MANUAL_IP_OVERRIDE);
    console.warn('💡 If this doesn\'t work, make sure your device is on the same WiFi network');
    return `http://${MANUAL_IP_OVERRIDE}:${BACKEND_PORT}`;
  }

  // Final fallback: use localhost
  console.warn('❌ Could not detect host IP, falling back to localhost');
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = getBackendURL();

/**
 * Get the Better Auth URL
 * Uses EXPO_PUBLIC_BETTER_AUTH_URL from .env if set, otherwise falls back to API_BASE_URL
 */
export function getBetterAuthURL(): string {
  // Check for Better Auth URL from .env
  const betterAuthUrl = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;
  if (betterAuthUrl) {
    console.log('Using Better Auth URL from env:', betterAuthUrl);
    return betterAuthUrl;
  }

  // Fallback to API_BASE_URL (for development and production if not overridden)
  return API_BASE_URL;
}

export const BETTER_AUTH_URL = getBetterAuthURL();

// Log the configuration for debugging
console.log('========================================');
console.log('Backend Configuration:');
console.log('  API URL:', API_BASE_URL);
console.log('  Better Auth URL:', BETTER_AUTH_URL);
console.log('  Backend Port:', BACKEND_PORT);
console.log('  Platform:', Platform.OS);
console.log('  Is Device:', Constants.isDevice);
console.log('  Expo Go:', Constants.appOwnership === 'expo');
console.log('  hostUri:', Constants.expoConfig?.hostUri);
console.log('  debuggerHost:', Constants.manifest?.debuggerHost);
console.log('========================================');
