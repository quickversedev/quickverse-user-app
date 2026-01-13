# QuickVerse Customer App (Frontend)

React Native food delivery customer app.

## Tech Stack
- **Framework:** React Native 0.79.2 (bare workflow, NOT Expo)
- **Language:** TypeScript 5.0.4
- **State:** Zustand 5.0.6 with MMKV persistence
- **Navigation:** React Navigation 6.x
- **HTTP:** Axios 1.9.0

## Quick Commands
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Validate (lint + typecheck)
npm run validate

# Clear cache (after .env changes)
npm start -- --reset-cache

# iOS CocoaPods
cd ios && pod install
```

## Project Structure
```
src/
├── screens/        # UI screens (Home, Login, Cart, etc.)
├── components/     # Reusable components
├── store/          # Zustand stores
├── services/       # API services
├── hooks/          # Custom hooks
├── contexts/       # Auth, Theme, Tab contexts
├── navigation/     # Navigation config
├── types/          # TypeScript interfaces
├── config/         # Axios config
└── utils/          # Utility functions
```

## API Configuration
- **Base URL:** `http://prd.quickverse.in/quickVerse`
- **Config file:** `src/config/api/axios.config.ts`
- **Auth header:** `SessionKey: <jwt_token>`

## State Management (Zustand Stores)
| Store | Purpose |
|-------|---------|
| cartStore | Multi-vendor shopping carts |
| vendorStore | Vendor listings, filters |
| addressStore | User addresses |
| configStore | App configuration |
| themeStore | Dark/light theme |
| orderStore | Order history |
| productsStore | Products and categories |

All stores persist to MMKV encrypted storage.

## Authentication Flow
1. Enter phone → POST /v1/requestOtp
2. Enter OTP → POST /v1/login → Get JWT
3. New user → POST /v1/register/customer
4. JWT stored in MMKV, used in SessionKey header
5. Session expiry (codes 1047/1042) → Auto logout

## Environment Variables (.env)
```
API_URL=http://prd.quickverse.in/quickVerse
AUTHORIZATION_KEY=Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
```
**Important:** Restart Metro after .env changes: `npm start -- --reset-cache`

## Key Screens
- `HomeScreen` - Main tabs (Food, Grocery, Pharmacy, For You)
- `VendorProduct` - Vendor's product list
- `CartScreen` - Shopping cart
- `OrderDetailsScreen` - Order tracking

## Navigation Structure
```
AppStack
├── TabNavigation (Home, Explore)
├── VendorProduct
├── VendorDetails (Modal)
├── Cart
├── OrderDetails
├── Search
└── Profile Stack (Orders, Address, HelpDesk)
```

## Context API
- **AuthProvider** - Authentication (OTP login, JWT, session)
- **TabContext** - Bottom tab visibility state
- **ThemeContext** - Dark/light theme toggle

## Key Patterns
- **Cart:** Multi-vendor support, optimistic updates, request deduplication
- **Storage:** MMKV encrypted storage via Zustand persist middleware
- **Loading:** Skeleton components in `src/components/skeleton/`

## Theme System
- **DefaultTheme** (dark) - Primary: #FAE588
- **LightTheme** - Toggle via profile menu
- Themes in `src/assets/theme/`

## Branch & Commit Conventions
- Branch: `feature/name`, `bugfix/name`, `hotfix/name`
- Commit: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Run `npm run validate` before committing
