# SortIQ Mobile

SortIQ Mobile is a React Native CLI app. The Android project is in `android/`; app screens and auth are shared in the project root.

## Configure

1. Install Node.js 20+, JDK 17, and Android Studio with the Android SDK, platform tools, and an SDK platform installed.
2. Run `npm install` from this folder.
3. Set `API_BASE_URL` and the `FIREBASE_*` values in `.env`. On a physical phone, `API_BASE_URL` must use a host reachable from the phone; `localhost` refers to the phone itself.

## Run on Android

Connect a USB device with USB debugging enabled, or pair and connect it with Wireless debugging. Confirm it appears in `adb devices`, then run:

```sh
npx react-native run-android
```

To create a debug APK without installing it:

```sh
cd android && ./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
