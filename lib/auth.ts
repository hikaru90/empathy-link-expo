import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./config";

export const authClient = createAuthClient({
    baseURL: API_BASE_URL, // Base URL of your Better Auth backend.
    plugins: [
        expoClient({
            scheme: "empathy-link",
            storagePrefix: "empathy-link",
            storage: SecureStore,
        })
    ]
});