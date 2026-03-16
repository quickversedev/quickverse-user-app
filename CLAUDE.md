# QuickVerse Customer App (Frontend)

React Native food delivery customer app (v4.0.3, Android versionCode 43, versionName 4.0.3).

## Tech Stack

- **Framework:** React Native 0.84.1 (bare workflow, NOT Expo)
- **Language:** TypeScript 5.9.3 (strict mode)
- **State:** Zustand 5.0.11 with MMKV persistence
- **Navigation:** React Navigation 7.x (stack 7.8.4, bottom-tabs 7.15.5)
- **HTTP:** Axios 1.13.6
- **Notifications:** Firebase Messaging 23.8.6 + Notifee 9.1.8
- **Maps:** React Native Maps + Ola Maps (geocoding)
- **Fonts:** BricolageGrotesque (custom)

## Quick Commands

```bash
# Start Metro bundler
npm start

# Run on Android/iOS
npm run android
npm run ios

# Validate (lint + format check + typecheck)
npm run validate

# Individual checks
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit

# Fix formatting
npm run format:all    # prettier + eslint --fix

# Clear cache (after .env changes)
npm start -- --reset-cache

# iOS CocoaPods
cd ios && pod install
```

## Project Structure

```
src/
├── screens/        # UI screens organized by feature
├── components/     # Reusable components (common/, modules/, search/, vendor/)
├── store/          # Zustand stores (cart/, address/, products/, pages/)
├── services/       # API services + localStorage
├── hooks/          # Custom hooks (+ Permissions/ subdirectory)
├── contexts/       # Auth, Tab contexts
├── navigation/     # Navigation config (HomeStack, TabNavigation, LoginNavigation, profileNavigation)
├── routes/         # Stack/tab route definitions
├── types/          # TypeScript interfaces
├── config/         # Axios config
├── theme/          # ThemeContext & theme logic
├── assets/         # Images, SVGs, fonts, mock data, themes
├── utils/          # Utility functions
└── data/           # Static data (collections)
```

## API Configuration

- **Base URL:** `http://prd.quickverse.in/quickVerse`
- **Config file:** `src/config/api/axios.config.ts`
- **Auth header:** `SessionKey: <jwt_token>` (added per-request, not in default headers)
- **Request header:** `Request-Origin: CUSTOMER`
- **Timeout:** 15 seconds
- **Error codes:** Session expiry on 1047/1042 triggers auto-logout

## State Management (Zustand Stores)

| Store                 | Path                                      | Purpose                           |
| --------------------- | ----------------------------------------- | --------------------------------- |
| cartStore             | `store/cart/cartStore.ts`                 | Multi-vendor shopping carts       |
| couponStore           | `store/cart/couponStore.ts`               | Coupon management                 |
| orderStore            | `store/cart/orderStore.ts`                | Order history & details           |
| addressStore          | `store/address/addressStore.ts`           | User delivery addresses           |
| smartBizAddressStore  | `store/address/smartBizAddressStore.ts`   | Smart business addresses          |
| productsStore         | `store/products/productsStore.ts`         | Product catalog by vendor         |
| featuredProductsStore | `store/products/featuredProductsStore.ts` | Featured/recommended products     |
| configStore           | `store/configStore.ts`                    | App configuration, regionId       |
| themeStore            | `store/themeStore.ts`                     | Dark/light theme                  |
| vendorStore           | `store/vendorStore.ts`                    | Vendor listings, filters, sorting |
| pagesStore            | `store/pages/pagesStore.ts`               | CMS pages content                 |

All stores persist to MMKV encrypted storage via Zustand persist middleware.

## Services (`src/services/`)

| Service                           | Purpose                                         |
| --------------------------------- | ----------------------------------------------- |
| `api/authService.ts`              | OTP request, verification, registration, logout |
| `api/configService.ts`            | Initial config fetch based on location          |
| `api/searchService.ts`            | Product/vendor search with suggestions          |
| `api/olaLocationService.ts`       | Location autocomplete & geocoding (Ola Maps)    |
| `cartApiService.ts`               | Cart CRUD operations                            |
| `productsService.ts`              | Product fetching with pagination                |
| `productDetailsService.ts`        | Individual product details & variants           |
| `couponService.ts`                | Coupon validation & application                 |
| `createOrderService.ts`           | Order creation                                  |
| `createPaymentService.ts`         | Payment initiation                              |
| `paymentService.ts`               | Available payment methods                       |
| `deleteUserService.ts`            | Account deletion                                |
| `deviceInfoService.ts`            | Device info registration with backend           |
| `faqService.ts`                   | FAQ content fetching                            |
| `supportService.ts`               | Customer support / help desk                    |
| `smartBizAddressService.ts`       | SmartBiz vendor address operations              |
| `localStorage/storage.service.ts` | MMKV storage wrapper for auth, addresses, etc.  |

## Authentication Flow

1. Enter phone -> POST /v1/requestOtp
2. Enter OTP -> POST /v1/login -> Get JWT
3. New user -> POST /v1/register/customer
4. JWT stored in MMKV, used in `SessionKey` header per-request
5. Session expiry (codes 1047/1042) -> Auto logout
6. Auth state managed in `src/contexts/login/AuthProvider.tsx`

## Key Screens

| Screen                 | Path                      | Purpose                                      |
| ---------------------- | ------------------------- | -------------------------------------------- |
| HomeScreen             | `screens/Home/`           | Main tabs (Food, Grocery, Pharmacy, For You) |
| ExploreScreen          | `screens/Explore/`        | Browse vendors and categories                |
| VendorProduct          | `screens/vendor/`         | Vendor's product list                        |
| CartScreen             | `screens/cart/`           | Shopping cart, coupons, payment              |
| SearchScreen           | `screens/search/`         | Search with suggestions                      |
| OrderDetailsScreen     | `screens/profile/orders/` | Order tracking                               |
| LoginScreen            | `screens/Login/`          | Phone + OTP login flow                       |
| ProfileScreen          | `screens/profile/`        | User profile, help, about                    |
| CollectionDetailScreen | `screens/collections/`    | Featured collections                         |
| CategoryScreen         | `screens/Category/`       | Category browsing (nested in HomeStack)       |
| AddAddressScreen       | `screens/profile/Address/`| Map-based address creation (standalone screen)|
| PermissionsScreen      | `screens/permission/`     | Location permission request                  |

## Navigation Structure

```
Route.tsx (auth check)
├── LoginStack (loginScreen -> OTP -> Registration)
└── AppStack
    ├── TabNavigation
    │   ├── HomeStack
    │   │   ├── HomeMain (HomeScreen)
    │   │   └── Category
    │   ├── ExploreScreen
    │   └── CartScreen (with badge)
    ├── VendorProduct, VendorDetails, VendorProfile
    ├── Cart, Coupons
    ├── Orders, OrderDetails, OrderSuccess, OrderFailure
    ├── Search
    ├── Profile, Address, AddAddress (slide-up), HelpDesk, AboutUs
    ├── CollectionDetail
    └── Category (also accessible from AppStack)
```

## Context API

- **AuthProvider** (`contexts/login/AuthProvider.tsx`) - OTP login, JWT, session management, auto-logout
- **TabContext** (`contexts/TabContext.tsx`) - Bottom tab selection state (ForYou, HomeMain, food, Grocery, Collections, Pharmacy)
- **ThemeProvider** (`theme/ThemeContext.tsx`) - Dark/light theme toggle, color/typography helpers

## Custom Hooks

| Hook                 | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| useAddress           | Fetch and manage user addresses                                    |
| useConfig            | App configuration from store                                       |
| useDeviceInfo        | Device ID, OS, app version                                         |
| useFAQs             | FAQ content                                                        |
| useFeaturedProducts  | Featured/recommended products                                      |
| useFetchUpdateData   | Force app update check                                             |
| useHeaderAnimation   | Animated header scroll handling                                    |
| useNotifications     | Firebase push notification setup                                   |
| useOrders            | Order history with pagination                                      |
| usePages             | CMS pages content                                                  |
| usePaymentMethods    | Available payment options                                          |
| useProductDetails    | Product variants & details                                         |
| usePromotions        | Promotional offers                                                 |
| useRecentSearches    | Recent search history (persisted)                                  |
| useSearch            | Global search (products/vendors)                                   |
| useSearchSuggestions | Search autocomplete                                                |
| useVariants          | Product variant selection logic                                    |
| useAppStateRefresh   | App lifecycle (foreground/background)                              |
| useLocation          | Geolocation permissions & reverse geocoding (`hooks/Permissions/`) |

## Components Structure

```
components/
├── common/           # Shared UI components
│   ├── skeleton/     # Loading skeleton shimmer components
│   ├── badges/       # Badge components
│   ├── Cart/         # Cart-related common components
│   ├── featuredProducts/ # Featured products components
│   ├── order/        # Order-related components
│   ├── OrderDetails/ # Order details components
│   ├── promo/        # Promotional components
│   ├── search/       # Search-related common components
│   ├── theme/        # Theme-related components
│   ├── ErrorState, LoginPromptModal, LocationRequiredModal
│   ├── ForceUpdate, AppInitializer, AppBootstrap
│   └── VegIcon, SectionDivider, TruncatedText, CategoryLogo
├── modules/
│   ├── Cart/         # CartItem, CartFooter, PaymentSummary, CouponSection, DeliveryEstimateCard
│   ├── Header/       # Header, SearchBar, LocationSelector, AddressSelectionModal
│   ├── Product/      # ProductCard, ProductDetailModal, QuantitySelector, VariantsModal
│   └── Vendor/       # VendorCard, VendorList, VendorProductList, VendorEmptyState
├── search/           # Search-specific components
└── vendor/           # Vendor page components (category tabs, headers)
```

## Key Patterns

- **Cart:** Multi-vendor support (one cart per vendor), optimistic updates, request deduplication
- **Storage:** MMKV encrypted storage via Zustand persist middleware
- **Loading:** Skeleton components in `src/components/common/skeleton/`
- **Location:** Geolocation API + Ola Maps reverse geocoding, races GPS & network in parallel
- **Search:** Local suggestions + API search (`v3/search`), SmartBiz search for collections, recent searches persisted to MMKV
- **Error Handling:** Centralized in axios.config with ApiError interface, per-platform alerts (Toast on Android, Alert on iOS)

## Theme System

- **DefaultTheme** - Primary: #D97706 (amber), Background: #F9FAFB
- **LightTheme** - Light mode variant
- Theme files in `src/assets/theme/` and `src/theme/`
- Remote theme fetching via `themeApi.ts`
- Always use theme context for colors; avoid hardcoded values

## Environment Variables

Configured via `react-native-dotenv` (`@env` module). Type declarations in `src/types/env.d.ts`.

```
API_URL=http://prd.quickverse.in/quickVerse
AUTHORIZATION_KEY=Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
```

**Important:** Restart Metro after .env changes: `npm start -- --reset-cache`

## Branch & Commit Conventions

- Branch: `feature/name`, `bugfix/name`, `hotfix/name`
- Commit: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Run `npm run validate` before committing
- Husky pre-commit hooks enforce lint-staged checks
