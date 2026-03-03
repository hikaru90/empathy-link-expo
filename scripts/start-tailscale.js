/**
 * Start Expo with Metro bound to your Tailscale hostname so devices/emulators
 * can load the bundle when not on your LAN. Loads .env and uses
 * EXPO_PUBLIC_BACKEND (or TAILSCALE_DEV_HOST) for REACT_NATIVE_PACKAGER_HOSTNAME.
 */
const path = require('path');
const { spawn } = require('child_process');

// Try to load dotenv, ignore if not found
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch (e) {
  // ignore
}

const backendUrl = process.env.EXPO_PUBLIC_BACKEND?.trim();
let host = process.env.TAILSCALE_DEV_HOST?.trim();

console.log('tailscale host', host);

if (!host && backendUrl) {
  try {
    host = new URL(backendUrl).hostname;
  } catch {
    // ignore
  }
}

if (!host) {
  console.error(
    'Set EXPO_PUBLIC_BACKEND (e.g. http://mymachine.your-tailnet.ts.net:4000) or TAILSCALE_DEV_HOST in .env'
  );
  process.exit(1);
}

console.log('[Tailscale] Packager hostname:', host);
spawn('npx', ['expo', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: host },
});
