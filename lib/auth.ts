import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getBetterAuthURL } from "./config";

// Debug: Log SecureStore availability. Skip on Android dev - async .then() callback was suspected of triggering rebundle.
if (__DEV__ && Platform.OS !== 'android') {
  SecureStore.isAvailableAsync()
    .then((isAvailable) => {
      console.log(`[Auth] SecureStore available on ${Platform.OS}:`, isAvailable);
    })
    .catch((err: unknown) => {
      console.error('[Auth] Error checking SecureStore availability:', err instanceof Error ? err.message : err);
    });
}

export const authClient = createAuthClient({
    baseURL: getBetterAuthURL(), // Resolved at load time (after setResolvedBackendURL in root layout).
    plugins: [
        expoClient({
            scheme: "empathy-link",
            storagePrefix: "empathy-link",
            storage: SecureStore,
        })
    ]
});