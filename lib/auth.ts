import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { BETTER_AUTH_URL } from "./config";

// Debug: Log SecureStore availability
if (__DEV__) {
  SecureStore.isAvailableAsync().then((isAvailable) => {
    console.log(`[Auth] SecureStore available on ${Platform.OS}:`, isAvailable);
  }).catch((err) => {
    console.error('[Auth] Error checking SecureStore availability:', err);
  });
}

export const authClient = createAuthClient({
    baseURL: BETTER_AUTH_URL, // Base URL of your Better Auth backend.
    plugins: [
        expoClient({
            scheme: "empathy-link",
            storagePrefix: "empathy-link",
            storage: SecureStore,
        })
    ]
});