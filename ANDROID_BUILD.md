# Android Build Instructions

## Prerequisites
Ensure execute permissions are set for the gradle wrapper:
```bash
chmod +x android/gradlew
```

## 1. Generate Release Keystore
If you haven't generated the signing key (`quickverseRelease.keystore`) yet, run this command from the project root:

```bash
keytool -genkey -v -keystore android/app/quickverseRelease.keystore -alias qvalias -keyalg RSA -keysize 2048 -validity 10000
```

**Prompts:**
-   **Password:** `quickverse` (Enter this for both keystore and key passwords to match `gradle.properties`)
-   **Details:** You can enter your name/organization or just press Enter to skip.
-   **Confirmation:** Type `yes` when asked if the details are correct.

## 2. Build Release APK
Once the keystore is in place (`android/app/quickverseRelease.keystore`), run:

```bash
cd android
./gradlew assembleRelease
```

## 3. Locate the APK
The built APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`
