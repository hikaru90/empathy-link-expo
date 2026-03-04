import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getBetterAuthURL } from "./config";

/** Expo plugin expects sync getItem/setItem. SecureStore on web does not provide setValueWithKeySync. */
const authStorage =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? {
        getItem: (key: string) => localStorage.getItem(key) ?? "",
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
      }
    : SecureStore;

const STORAGE_PREFIX = "empathy-link";

/**
 * Web only: Bearer token for cross-origin API calls (cookie cannot be set from JS).
 * Backend must: (1) add bearer() plugin to betterAuth, (2) use auth.api.getSession({ headers }) on protected routes.
 */
const BEARER_TOKEN_KEY = `${STORAGE_PREFIX}_bearer_token`;

function getBearerToken(): string {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return "";
  return localStorage.getItem(BEARER_TOKEN_KEY) ?? "";
}

function setBearerToken(token: string) {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(BEARER_TOKEN_KEY, token);
  else localStorage.removeItem(BEARER_TOKEN_KEY);
}

/** Call on sign-out so next session doesn't reuse an old token. */
export function clearBearerToken() {
  setBearerToken("");
}

const isWeb = Platform.OS === "web";

export const authClient = createAuthClient({
  baseURL: getBetterAuthURL(),
  plugins: [
    expoClient({
      scheme: "empathy-link",
      storagePrefix: STORAGE_PREFIX,
      storage: authStorage,
    }),
  ],
  // Web cross-origin: browser cannot send cookies. Use Bearer token; backend must add bearer() plugin.
  ...(isWeb
    ? {
        fetchOptions: {
          auth: { type: "Bearer" as const, token: getBearerToken },
          onSuccess: (ctx: { response: Response }) => {
            const token = ctx.response?.headers?.get("set-auth-token");
            if (token) setBearerToken(token);
          },
        },
      }
    : {}),
});