# Expo Push Notifications – Setup Guide

Documentation for implementing push notifications on Android and iOS with Expo.

## Prerequisites

- **Real device** – Push notifications don't work in Android Emulator or iOS Simulator
- **Development build** – Push notifications are not supported in Expo Go (SDK 53+)
- **EAS Build** – Simplest path for credentials and building

---

## 1. Install Dependencies

```sh
npx expo install expo-notifications expo-device expo-constants
```

---

## 2. Add the Config Plugin

In `app.json` or `app.config.js`:

```json
"plugins": ["expo-notifications"]
```

---

## 3. Implement Client-Side Logic

- Request permission and get the push token with `Notifications.getExpoPushTokenAsync({ projectId })`
- Use `expo-constants` to get `projectId` from `Constants?.expoConfig?.extra?.eas?.projectId`
- Set up `setNotificationHandler` for foreground behavior
- Add listeners:
  - `addNotificationReceivedListener` – when a notification arrives
  - `addNotificationResponseReceivedListener` – when the user taps a notification
- On Android: create a notification channel with `setNotificationChannelAsync`

---

## 4. Get Credentials

**Android**

- Configure Firebase Cloud Messaging (FCM) v1
- Add FCM server credentials to your EAS project

**iOS**

- Push credentials are handled by EAS Build
- Ensure a push notification key exists (regenerate via `eas credentials` if needed)

---

## 5. Build the App

```sh
eas build
```

---

## 6. Send Notifications from Your Server

- Store the user's `ExpoPushToken` in your backend
- Call the Expo Push API: `POST https://exp.host/--/api/v2/push/send` with the token, `title`, `body`, and optional `data`
- Or use a server SDK (e.g. `expo-server-sdk-node`)

---

## 7. Best Practices

- **Retry** – Use exponential backoff on 429/5xx when sending
- **Check push receipts** – Verify delivery via `https://exp.host/--/api/v2/push/getReceipts`
- **Handle `DeviceNotRegistered`** – Stop sending to that token
- **Rate limit** – Max 600 notifications per second per project
- **Batch** – Send up to 100 notifications per request when possible

---

## TL;DR

Install `expo-notifications`, add the plugin, request permission and get the push token in your app, configure FCM for Android and push keys for iOS via EAS, build with `eas build`, and send push payloads via the Expo Push API from your backend.

---

## Backend API (Required)

The app expects these endpoints to be implemented:

### `POST /api/notifications/register`

Register a push token for the authenticated user.

**Request body:**
```json
{ "token": "ExponentPushToken[xxx]" }
```

**Auth:** Required (Better Auth session)

### `POST /api/notifications/unregister`

Remove a push token when the user disables notifications.

**Request body:**
```json
{ "token": "ExponentPushToken[xxx]" }
```

**Auth:** Required (Better Auth session)

### Sending notifications

Use the [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) or `expo-server-sdk-node` to send notifications. Include `data: { path: "/analysis/123" }` to deep-link when the user taps the notification.
