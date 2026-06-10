# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

QuickVerse — React Native food delivery customer app. Bare workflow (NOT Expo), TypeScript strict mode.

## Quick Commands

```bash
npm start                    # Start Metro bundler
npm run android              # Run on Android
npm run ios                  # Run on iOS
npm run validate             # lint + format check + typecheck (run before committing)
npm run lint                 # ESLint only
npm run format:check         # Prettier check only
npm run typecheck            # tsc --noEmit only
npm run format:all           # Auto-fix formatting (prettier + eslint --fix)
npm test                     # Run Jest tests
npm test -- --testPathPattern=<pattern>  # Run single test file
npm start -- --reset-cache   # Clear cache (required after .env changes)
cd ios && pod install        # iOS CocoaPods
```

## Android Builds

```bash
chmod +x android/gradlew              # Ensure execute permissions (once)
cd android && ./gradlew assembleRelease   # Release APK
cd android && ./gradlew bundleRelease     # Release AAB (Play Store)
```

- **APK output:** `android/app/build/outputs/apk/release/app-release.apk`
- **AAB output:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Bump `versionCode`** in `android/app/build.gradle` before each Play Store AAB build
- **DO NOT regenerate** the release keystore (`quickverseRelease.keystore` in project root) — it's registered with Play Store. See `ANDROID_BUILD.md` for signing details.

## Architecture

### Core Tech

- **Framework:** React Native 0.84 (bare workflow), TypeScript strict
- **State:** Zustand with MMKV persistence (custom adapter in `src/services/localStorage/storage.service.ts`)
- **Navigation:** React Navigation 7.x (native stack + bottom tabs)
- **HTTP:** Axios with centralized config in `src/config/api/axios.config.ts`
- **Notifications:** Firebase Messaging + Notifee
- **Maps:** React Native Maps + Ola Maps (geocoding via `src/services/api/olaLocationService.ts`)
- **SVGs:** Imported as React components via `react-native-svg-transformer` (configured in metro.config.js)

### Project Structure

```
src/
├── screens/        # UI screens organized by feature
├── components/     # common/ (shared UI), modules/ (Cart, Header, Product, Vendor)
├── store/          # Zustand stores (cart/, address/, products/, pages/, config, theme, vendor)
├── services/       # API services (api/) + localStorage/MMKV wrapper
├── hooks/          # Custom hooks (+ Permissions/ subdirectory)
├── contexts/       # AuthProvider (login/JWT), TabContext (tab state)
├── navigation/     # Navigation config (HomeStack, TabNavigation, LoginNavigation)
├── routes/         # Route.tsx (root), AuthStack, AppStack
├── types/          # TypeScript interfaces
├── config/         # Axios config + types
├── theme/          # ThemeContext & theme logic
├── assets/         # Images, SVGs, fonts, theme definitions
└── utils/          # Utility functions
```

### App Startup Flow

```
App.tsx providers (GestureHandler → Tab → SafeArea → Theme → Navigation → Auth)
└── Route.tsx (auth check)
    ├── AuthStack (LoginScreen → OTP → Registration) — if not authenticated
    └── ForceUpdateChecker
        └── AppBootstrap
            ├── PermissionsScreen (location grant — shown first)
            ├── Registration (new users — after permissions)
            └── AppInitializer (fetches config/theme/pricing) + AppStack
```

### Navigation Structure

```
AppStack
├── TabNavigation
│   ├── HomeStack (HomeMain, Category)
│   ├── ExploreScreen
│   └── CartScreen (with badge)
├── VendorProduct, VendorDetails, VendorProfile
├── Cart, Coupons
├── Orders, OrderDetails, OrderSuccess, OrderFailure
├── Search
├── Profile, Address, AddAddress (slide-up), HelpDesk, AboutUs
├── CollectionDetail
└── Category
```

### API Configuration

- **Base URL:** Hardcoded in `axios.config.ts` (`API_CONFIG.baseURL`). Switch by commenting/uncommenting production vs local URLs there.
- **Default headers:** `Content-Type: application/json`, `Request-Origin: CUSTOMER`
- **Auth:** `Authorization: Basic <AUTHORIZATION_KEY>` added via `getAuthHeader()`. Per-request auth uses `SessionKey: <jwt>` header.
- **Timeout:** 15 seconds
- **Session expiry:** Error codes 1047/1042 trigger auto-logout via `setSessionExpiredCallback` in axios config
- **Error normalization:** All axios errors are converted to `ApiError` format (`status`, `message`, `code`, `isCancelled`, `apiEndpoint`)
- **Per-request headers:** Use `withHeaders()` or `createRequestWithHeaders()` helpers — don't set defaults globally

### Authentication Flow

1. Phone number → `POST /v1/requestOtp`
2. OTP → `POST /v1/login` → JWT
3. New user → `POST /v1/register/customer`
4. JWT stored in MMKV (`AuthSession` type), sent as `SessionKey` header per-request
5. Session expiry (1047/1042) → auto-logout via global `setSessionExpiredCallback` in axios config
6. Auth state managed in `src/contexts/login/AuthProvider.tsx`
7. **Logout resets all stores atomically** — `resetAuthState()` in AuthProvider clears MMKV + resets every Zustand store via `setState()`

### Key Patterns

- **Cart:** Multi-vendor carts keyed by `vendor_<shopId>`. Uses `latestRequestIdPerCart` for request deduplication to avoid stale responses. Optimistic UI updates with rollback on API error. Cart auto-removes when all products reach quantity 0. Guest users get local-only carts (no API calls) — pass `authData?.jwt || ''` and `authData?.phone || ''`; never gate cart actions on `!authData?.jwt`.
- **Store persistence:** Stores use Zustand `persist` middleware with the `mmkvStorage` adapter. Use `partialize` to persist only essential state (exclude `loading`, `error`, etc.).
- **Cache expiry:** Some stores (e.g., `featuredProductsStore`) implement time-based cache expiry (5-minute TTL).
- **Tax formula:** 18% GST on (commission + delivery + platform fees). Food: 10% commission, Grocery: 2%. Identical logic in `PaymentSummary.tsx` and `OrderDetailsScreen.tsx` — keep them in sync.
- **API services:** Thin wrappers around the `apiCall()` helper in axios config. Some services (e.g., `cartApiService`) include response-to-local format transformation logic.
- **Loading states:** Skeleton shimmer components in `src/components/common/skeleton/`
- **Location:** Geolocation API + Ola Maps reverse geocoding, races GPS & network in parallel. Default fallback is Beed, Maharashtra (`DEFAULT_FALLBACK_COORDINATES` in `src/constants/location.ts`). `checkLocationPermission()` returns a PermissionStatus string (e.g. `'granted'`), not boolean — compare with `!== 'granted'`, not `!status`.
- **SmartBiz addresses:** Singleton `SmartBizAddressService` (`src/store/address/smartBizAddressStore.ts`) with per-vendor 5-minute in-memory cache. Call `clearCache(vendorId)` before fetching when fresh data is needed (e.g., after adding an address).
- **Ola Maps limitation:** Reverse geocode `formatted_address` omits sublocality/locality — build display addresses from individual `address_components` fields. Pincode accuracy can differ from expected values; this is an upstream data issue.
- **Search:** Local suggestions + API search (`v3/search`), recent searches persisted to MMKV (max 10)
- **Error handling:** Centralized in axios.config with `ApiError` interface. Toast on Android, Alert on iOS.
- **Theme:** Server-driven theme (fetched by `AppInitializer`) with `DefaultTheme` fallback. Always use `useTheme().getColor()` for colors — avoid hardcoded values. Primary: #D97706 (amber).

### Environment Variables

Configured via `react-native-dotenv` (`@env` module). Type declarations in `src/types/env.d.ts`.
Available vars: `API_URL`, `API_KEY`, `AUTHORIZATION_KEY`, `ENVIRONMENT`.
Restart Metro after `.env` changes: `npm start -- --reset-cache`

## Code Style Rules

- **`no-console`:** Only `console.warn` and `console.error` are allowed — `console.log` is an ESLint error.
- **Unused vars:** Prefix with `_` to suppress the `no-unused-vars` error (e.g., `_unusedParam`).
- **Prettier:** 100-char print width, single quotes, 2-space indent, trailing commas (es5), avoid parens on single-arg arrows.
- **Lint-staged** (`.lintstagedrc.js`): Pre-commit hook runs `eslint --fix` + `prettier --write` on staged TS/JS files.
- **Inline styles:** `react-native/no-inline-styles` is set to warn.

## Important Rules

- **Backend is read-only.** The `/backend` directory may be added as a working directory for reference, but NEVER modify, edit, or write files there. Only read backend files for context.

## Branch & Commit Conventions

- Branch: `feature/name`, `bugfix/name`, `hotfix/name`
- Commit: `type(scope): description` (feat, fix, docs, style, refactor, test, chore)
- Husky pre-commit hooks enforce lint-staged checks
- Run `npm run validate` before committing
