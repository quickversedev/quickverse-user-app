# Android Build Instructions

## Prerequisites

Ensure execute permissions are set for the gradle wrapper:

```bash
chmod +x android/gradlew
```

## Signing Keystore

The release keystore (`quickverseRelease.keystore`) is located in the **project root directory**. This is the same key registered with the Google Play Store.

**DO NOT regenerate this keystore.** The Play Store expects the app to be signed with this exact key (SHA1: `65:B4:C8:19:DC:39:12:3D:81:C1:31:5D:E9:65:32:98:3B:53:D7:E3`). Generating a new keystore will produce a different fingerprint and Play Store uploads will be rejected.

- **Keystore path:** `<project-root>/quickverseRelease.keystore`
- **Alias:** `qvalias`
- **Password (store & key):** `quickverse`

Gradle is configured to reference this file via `android/gradle.properties`:
```
MYAPP_RELEASE_STORE_FILE=../../quickverseRelease.keystore
```

## Build Release APK

APK builds are for internal testing, and show test shops automatically — no source edit needed.
`src/config/buildFlags.ts` decides at runtime from the install source: a sideloaded APK includes
test shops, while a Play Store install (`com.android.vending`) hides them.

```bash
cd android
./gradlew assembleRelease
```

## Build Release AAB (for Play Store)

**Important:** Before each release build:
1. Bump `versionCode` and `versionName` in `android/app/build.gradle` → `defaultConfig` block. The Play Store rejects uploads with a previously used version code.
2. Nothing to do for test shops. Installs from the Play Store are detected at runtime and never receive
   them, so no flag has to be flipped before uploading — see `src/config/buildFlags.ts`.

```bash
cd android
./gradlew bundleRelease
```

## Locate Build Output

- **APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **AAB:** `android/app/build/outputs/bundle/release/app-release.aab`
