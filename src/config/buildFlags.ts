import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Where this install came from, and therefore whether it is the Play Store
 * build.
 *
 * This is deliberately a *runtime* check rather than a build-time flag.
 * `assembleRelease` (APK) and `bundleRelease` (AAB) both depend on the same
 * Gradle task, `createBundleReleaseJsAndAssets`, so they ship the *same* JS
 * bundle. Any flag baked in at bundle time (an `@env` var, a Babel-inlined
 * `process.env`, a generated constants file) would be reused from Gradle's
 * up-to-date cache by whichever of the two runs second — silently shipping the
 * APK's flag inside the Play Store AAB. Reading the install source at runtime
 * cannot go stale that way.
 *
 * Android reports the installing package: the Play Store installs as
 * `com.android.vending`, while a sideloaded APK reports the package installer,
 * an ADB install, or nothing at all.
 */
const PLAY_STORE_INSTALLERS = new Set(['com.android.vending', 'com.google.android.feedback']);

let cachedIsPlayStoreInstall: boolean | null = null;

const isPlayStoreInstall = (): boolean => {
  if (cachedIsPlayStoreInstall !== null) {
    return cachedIsPlayStoreInstall;
  }

  if (__DEV__) {
    cachedIsPlayStoreInstall = false;
    return cachedIsPlayStoreInstall;
  }

  if (Platform.OS !== 'android') {
    // Only Android implements the install-source lookup. Treat every other
    // release build as a store build so real customers never see test shops.
    cachedIsPlayStoreInstall = true;
    return cachedIsPlayStoreInstall;
  }

  try {
    cachedIsPlayStoreInstall = PLAY_STORE_INSTALLERS.has(DeviceInfo.getInstallerPackageNameSync());
  } catch {
    // Fail closed: an unknown install source is assumed to be the store, since
    // leaking test shops to customers is worse than hiding them from testers.
    cachedIsPlayStoreInstall = true;
  }

  return cachedIsPlayStoreInstall;
};

/**
 * Whether test shops (`shop.is_test_shop`) should be included in vendor
 * listings. Sent as the `isTest` query param, which the server reads as
 * "include test shops" (`AND (:isTest = true OR s.is_test_shop = false)`).
 *
 * True for dev builds and for sideloaded release APKs (internal testing);
 * false for the Play Store build.
 */
export const shouldIncludeTestShops = (): boolean => !isPlayStoreInstall();
