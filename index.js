/**
 * Instrumented entry: traces from here to app render so we can see where rebundle is triggered.
 *
 * Expected log order (dev):
 *   [Entry] 1–3 → [EntryClassic] 1–5 → [renderRootComponent] 1–4 → [qualified-entry] App() render
 *   → [Layout] >>> NEW BUNDLE <<< → [Layout] imports done → ... → [Layout] content step: ... → [Layout] RootLayout returning...
 * If rebundle happens, the LAST log before "Android Bundled" is the likely trigger.
 */
'use strict';

function log(step, msg) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[Entry]', step, msg);
  }
}

try {
  log(1, 'about to require @expo/metro-runtime');
  require('@expo/metro-runtime');
  log(2, '@expo/metro-runtime done');

  log(3, 'about to require expo-router/entry');
  require('expo-router/entry');
  log(4, 'expo-router/entry required (renderRootComponent already called)');
} catch (e) {
  console.error('[Entry] FAILED', e?.message ?? e, e?.stack);
  throw e;
}
