# Dependency Update Report

**Project:** QuickVerse Customer App
**Version:** 3.0.1
**Date:** 2026-03-08
**Base Commit:** `6a009df` → **Current HEAD**
**Commits:**
1. `3cfb1bf` — update dependencies
2. `ea85e1a` — chore(deps): update dependencies and migrate to React Navigation 7, ESLint 9, Jest 30, Prettier 3
3. `c7be6d5` — chore(deps): update dependencies and align React version with renderer

---

## Summary

Major upgrade of React Native from **0.79.2 to 0.84.1**, along with updates to all core dependencies, navigation stack, state management tooling, dev tooling, and Android build configuration.

**Total files changed:** 97
**Lines added:** ~16,333
**Lines removed:** ~12,352

---

## Core Framework

| Package | Previous | Current | Change Type |
|---------|----------|---------|-------------|
| `react` | `19.0.0` | `19.2.3` (pinned) | Minor |
| `react-native` | `0.79.2` | `^0.84.1` | Minor |

> **Note:** `react` is pinned to `19.2.3` (not `^19.2.4`) to match `react-native-renderer@19.2.3` bundled with RN 0.84.1, avoiding a runtime `TypeError: Cannot read property 'default' of undefined` at `getPaperRenderer`.

---

## Dependencies (Production)

### Updated

| Package | Previous | Current | Change Type |
|---------|----------|---------|-------------|
| `@react-native-community/datetimepicker` | `^8.3.0` | `^8.6.0` | Patch |
| `@react-native-firebase/app` | `^22.4.0` | `^23.8.6` | Major |
| `@react-native-firebase/messaging` | `^22.4.0` | `^23.8.6` | Major |
| `@react-navigation/bottom-tabs` | `^6.5.12` | `^7.15.5` | Major |
| `@react-navigation/native` | `^6.1.8` | `^7.1.33` | Major |
| `@react-navigation/stack` | `^6.3.18` | `^7.8.4` | Major |
| `axios` | `^1.9.0` | `^1.13.6` | Minor |
| `react-native-confirmation-code-field` | `^7.4.0` | `^8.0.1` | Major |
| `react-native-device-info` | `^14.0.4` | `^15.0.2` | Major |
| `react-native-gesture-handler` | `^2.25.0` | `^2.30.0` | Minor |
| `react-native-get-random-values` | `^1.11.0` | `^2.0.0` | Major |
| `react-native-maps` | `^1.24.3` | `^1.27.1` | Minor |
| `react-native-mmkv` | `^3.2.0` | `^4.2.0` | Major |
| `react-native-modal-datetime-picker` | `^17.1.0` | `^18.0.0` | Major |
| `react-native-permissions` | `^5.4.1` | `^5.5.1` | Minor |
| `react-native-reanimated` | `^3.17.5` | `^4.2.2` | Major |
| `react-native-safe-area-context` | `^5.4.0` | `^5.7.0` | Minor |
| `react-native-screens` | `^4.10.0` | `^4.24.0` | Minor |
| `react-native-svg` | `^15.15.1` | `^15.15.3` | Patch |
| `react-native-vector-icons` | `^10.2.0` | `^10.3.0` | Minor |
| `uuid` | `^11.1.0` | `^13.0.0` | Major |
| `zustand` | `^5.0.6` | `^5.0.11` | Patch |

### Added (New Dependencies)

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-navigation/elements` | `^2.9.10` | Required by React Navigation 7 |
| `react-native-nitro-modules` | `^0.35.0` | Required by Reanimated 4 |
| `react-native-worklets` | `^0.7.4` | Required by Reanimated 4 |

### Unchanged

| Package | Version |
|---------|---------|
| `@notifee/react-native` | `^9.1.8` |
| `@react-native-clipboard/clipboard` | `^1.16.3` |
| `@react-native-community/geolocation` | `^3.4.0` |
| `lodash.debounce` | `^4.0.8` |
| `react-native-country-picker-modal` | `^2.0.0` |
| `react-native-linear-gradient` | `^2.8.3` |
| `react-native-otp-verify` | `^1.1.8` |
| `react-native-svg-transformer` | `^1.5.3` |

---

## DevDependencies

### Updated

| Package | Previous | Current | Change Type |
|---------|----------|---------|-------------|
| `@babel/core` | `^7.25.2` | `^7.29.0` | Minor |
| `@babel/preset-env` | `^7.25.3` | `^7.29.0` | Minor |
| `@babel/runtime` | `^7.25.0` | `^7.28.6` | Minor |
| `@react-native-community/cli` | `^18.0.0` | `^20.1.2` | Major |
| `@react-native-community/cli-platform-android` | `18.0.0` | `^20.1.2` | Major |
| `@react-native-community/cli-platform-ios` | `18.0.0` | `^20.1.2` | Major |
| `@react-native/babel-preset` | `0.79.2` | `^0.84.1` | Minor |
| `@react-native/eslint-config` | `^0.79.2` | `^0.84.1` | Minor |
| `@react-native/metro-config` | `0.79.2` | `^0.84.1` | Minor |
| `@react-native/typescript-config` | `0.79.2` | `^0.84.1` | Minor |
| `@types/jest` | `^29.5.14` | `^30.0.0` | Major |
| `@types/react` | `^19.1.3` | `^19.2.14` | Minor |
| `@typescript-eslint/eslint-plugin` | `^6.21.0` | `^8.56.1` | Major |
| `@typescript-eslint/parser` | `^6.21.0` | `^8.56.1` | Major |
| `eslint` | `^7.32.0` | `^9.39.4` | Major |
| `eslint-config-prettier` | `^9.1.0` | `^10.1.8` | Major |
| `eslint-plugin-import` | `^2.29.1` | `^2.32.0` | Minor |
| `eslint-plugin-prettier` | `^5.5.1` | `^5.5.5` | Patch |
| `eslint-plugin-react` | `^7.33.2` | `^7.37.5` | Minor |
| `eslint-plugin-react-hooks` | `^4.6.0` | `^5.2.0` | Major |
| `eslint-plugin-react-native` | `^4.1.0` | `^5.0.0` | Major |
| `jest` | `^29.6.3` | `^30.2.0` | Major |
| `lint-staged` | `^16.1.2` | `^16.3.2` | Minor |
| `prettier` | `^2.8.8` | `^3.8.1` | Major |
| `react-test-renderer` | `19.0.0` | `19.2.3` (pinned) | Minor |
| `typescript` | `^5.0.4` | `^5.9.3` | Minor |

### Removed

| Package | Previous Version | Reason |
|---------|-----------------|--------|
| `@types/react-native` | `^0.72.8` | No longer needed; types bundled with `react-native` 0.84.1 |

### Unchanged

| Package | Version |
|---------|---------|
| `@types/lodash.debounce` | `^4.0.9` |
| `@types/react-native-vector-icons` | `^6.4.18` |
| `@types/react-test-renderer` | `^19.0.0` |
| `@types/uuid` | `^10.0.0` |
| `husky` | `^9.1.7` |
| `react-native-dotenv` | `^3.4.11` |

---

## Android Build Configuration

| Setting | Previous | Current |
|---------|----------|---------|
| `buildToolsVersion` | `35.0.0` | `36.0.0` |
| `compileSdkVersion` | `35` | `36` |
| `targetSdkVersion` | `35` | `36` |
| `kotlinVersion` | `2.0.21` | `2.1.20` |
| `edgeToEdgeEnabled` | _(not set)_ | `false` |

---

## TypeScript Configuration

| Setting | Previous | Current |
|---------|----------|---------|
| `moduleResolution` | `node16` | `bundler` |
| `module` | `Node16` | `esnext` |
| `skipLibCheck` | _(not set)_ | `true` |

---

## ESLint Configuration

- **Migrated** from `.eslintrc.js` (legacy config) to `eslint.config.js` (flat config format required by ESLint 9)

---

## Breaking Changes & Code Migrations

### 1. react-native-mmkv 3.x → 4.x
- `new MMKV()` → `createMMKV()`
- `.delete(key)` → `.remove(key)`
- **Files affected:** `src/services/localStorage/storage.service.ts`

### 2. React Navigation 6.x → 7.x
- Added `NavigatorScreenParams` for nested navigator typing
- Added `TabParamList` type definition
- Updated screen options and tab navigation APIs
- Added `@react-navigation/elements` as a required dependency
- **Files affected:** `src/routes/AppStack.tsx`, `src/navigation/TabNavigation.tsx`, `src/navigation/HomeStack.tsx`, `src/navigation/profileNavigation.tsx`

### 3. react-native-reanimated 3.x → 4.x
- Now requires `react-native-worklets` and `react-native-nitro-modules` as peer dependencies
- **Files affected:** Various animation-related components

### 4. ESLint 7.x → 9.x
- Migrated from `.eslintrc.js` to `eslint.config.js` (flat config)
- **Files affected:** `.eslintrc.js` (deleted), `eslint.config.js` (created)

### 5. Prettier 2.x → 3.x
- Minor formatting changes across codebase

---

## Known Issues

- **59 pre-existing TypeScript errors** across 17 files (mostly in demo/mock files, not caused by dependency updates)
- `react-native-country-picker-modal` pulls in `react-native-web@0.9.13` causing peer dependency conflicts (resolved with `--legacy-peer-deps`)
- Firebase namespaced API deprecation warnings (cosmetic, no runtime impact)
