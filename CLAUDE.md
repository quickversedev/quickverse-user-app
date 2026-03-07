# QuickVerse Customer App (Frontend)

React Native food delivery customer app (v3.0.1).

## Tech Stack

- **Framework:** React Native 0.79.2 (bare workflow, NOT Expo)
- **Language:** TypeScript 5.0.4 (strict mode)
- **State:** Zustand 5.0.6 with MMKV persistence
- **Navigation:** React Navigation 6.x
- **HTTP:** Axios 1.9.0
- **Notifications:** Firebase Messaging + Notifee
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
├── navigation/     # Navigation config
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
- **Auth header:** `SessionKey: <jwt_token>`
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
| `localStorage/storage.service.ts` | MMKV storage wrapper for auth, addresses, etc.  |

## Authentication Flow

1. Enter phone -> POST /v1/requestOtp
2. Enter OTP -> POST /v1/login -> Get JWT
3. New user -> POST /v1/register/customer
4. JWT stored in MMKV, used in SessionKey header
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
| CategoryScreen         | `screens/Category/`       | Category browsing                            |
| PermissionsScreen      | `screens/permission/`     | Location permission request                  |

## Navigation Structure

```
Route.tsx (auth check)
├── LoginStack (loginScreen -> OTP -> Registration)
└── AppStack
    ├── TabNavigation
    │   ├── HomeStack (HomeScreen)
    │   ├── ExploreScreen
    │   └── CartScreen (with badge)
    ├── VendorProduct, VendorDetails, VendorProfile
    ├── Cart, Coupons
    ├── Orders, OrderDetails, OrderSuccess, OrderFailure
    ├── Search
    ├── Profile, Address, HelpDesk, AboutUs
    ├── CollectionDetail
    └── Category
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
| useFAQs              | FAQ content                                                        |
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
├── common/           # Shared: ErrorState, LoginPromptModal, LocationRequiredModal, skeletons
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
- **Location:** Geolocation API + Ola Maps reverse geocoding, fallback to Beed
- **Search:** Local suggestions + API search, recent searches persisted to MMKV
- **Error Handling:** Centralized in axios.config with ApiError interface, per-platform alerts

## Theme System

- **DefaultTheme** - Primary: #D97706 (amber), Background: #F9FAFB
- **LightTheme** - Light mode variant
- Theme files in `src/assets/theme/` and `src/theme/`
- Remote theme fetching via `themeApi.ts`
- Always use theme context for colors; avoid hardcoded values

## Environment Variables (.env)

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
