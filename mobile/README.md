# Fitness Tracker - Mobile (Expo / React Native)

Personal AI nutrition-tracking app for lean muscle gain and marathon training. Scan a food photo, get a full nutritional breakdown in under 10 seconds, and log it. Exercise data flows in automatically from Apple Watch via HealthKit.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator, or the Expo Go app on a physical device

## Install

```bash
cd mobile
npm install
```

## Run

```bash
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the Expo Go app.

## Native features require a bare/native build

The following features are **not available in Expo Go** and require a full bare/native build (`npx expo run:ios` or `npx expo run:android`) with CocoaPods and Gradle configured:

- LiDAR depth capture (iOS Pro devices) - `src/native/DepthCapture.ts`
- HealthKit sync (workouts, active calories, cycle data) - `src/health/healthkit.ts`, `src/health/cycle.ts`
- watchOS companion app (separate Xcode target, not in this subtree)
- react-native-health, react-native-google-fit, react-native-vision-camera

## Screens - PRD section map

| Screen | PRD Section |
|---|---|
| OnboardingScreen | Section 6 (8-step setup) |
| DashboardScreen | Section 5 (calorie ring, macro bars, meals, water, exercise) |
| ScanScreen | Sections 7.1, 7.8 (photo scan pipeline, correction interface) |
| SupplementsScreen | Section 12 (supplement log and timing conflicts) |
| ProgressScreen | Sections 13, 14, 10.7 (measurements, bloodwork, weekly water) |
| SettingsScreen | Sections 9.4, 15.2, 10, 11.5 (net-cal mode, training mode, water goal, cycle override) |

## Environment

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to your backend URL (defaults to `http://localhost:8000`).
