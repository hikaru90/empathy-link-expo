import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { BETTER_AUTH_URL } from "./config";

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