# React Native Dotenv Integration Guide

## Setup Complete! ✓

The `react-native-dotenv` package has been successfully integrated into your project.

## How to Use Environment Variables

### 1. Define Variables in `.env`

Edit your `.env` file to add your environment variables:

```env
API_URL=https://api.example.com
API_KEY=your_secret_key_here
ENVIRONMENT=development
```

### 2. Add TypeScript Declarations

When you add new environment variables, update `src/types/env.d.ts`:

```typescript
declare module '@env' {
  export const API_URL: string;
  export const API_KEY: string;
  export const ENVIRONMENT: string;
  export const YOUR_NEW_VARIABLE: string; // Add new variables here
}
```

### 3. Import and Use in Your Code

```typescript
import { API_URL, API_KEY, ENVIRONMENT } from '@env';

// Use in your components or services
const fetchData = async () => {
  const response = await fetch(`${API_URL}/endpoint`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  return response.json();
};

// Check environment
if (ENVIRONMENT === 'development') {
  console.log('Running in development mode');
}
```

## Multiple Environment Files

You can create different environment files for different scenarios:

- `.env` - Default environment variables
- `.env.development` - Development-specific variables
- `.env.staging` - Staging-specific variables
- `.env.production` - Production-specific variables

Update the `path` in `babel.config.js` to switch between them:

```javascript
plugins: [
  [
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env.production', // Change this
      // ... other options
    },
  ],
],
```

## Important Notes

### 🔄 Restart Required

After changing `.env` files or `babel.config.js`, you MUST:

1. Stop the Metro bundler
2. Clear the cache: `npm start -- --reset-cache`
3. Rebuild the app:
   - iOS: `npm run ios`
   - Android: `npm run android`

### 🔒 Security

- ✅ `.env` is in `.gitignore` - your secrets are protected
- ✅ `.env.example` is tracked - team members know what variables are needed
- ⚠️ Never commit actual API keys or secrets to version control
- ⚠️ Environment variables are embedded in the app bundle at build time

### 📱 Platform Compatibility

This setup works for both iOS and Android without any platform-specific configuration.

## Configuration Options

The babel plugin is configured with these options:

- `moduleName`: `'@env'` - Import from this module name
- `path`: `'.env'` - Path to your env file
- `allowUndefined`: `true` - Allows undefined variables
- `safe`: `false` - Set to `true` to require all variables to be defined

## Example: Updating Your API Config

If you're using API configuration in `src/config/api/`, you can now use environment variables:

```typescript
// src/config/api/config.ts
import { API_URL } from '@env';

export const apiConfig = {
  baseURL: API_URL || 'https://default-api.example.com',
  timeout: 30000,
};
```

## Troubleshooting

### Variables showing as undefined?

1. Check the variable name matches in both `.env` and `src/types/env.d.ts`
2. Restart Metro bundler with cache clear
3. Rebuild the app completely

### TypeScript errors?

Make sure `src/types/env.d.ts` includes all variables you're importing.

### Still not working?

Try these steps:

```bash
# Clear all caches
npm start -- --reset-cache

# For Android
cd android && ./gradlew clean && cd ..

# For iOS
cd ios && rm -rf Pods && pod install && cd ..
```

## Next Steps

1. Update `.env` with your actual API URLs and keys
2. Add environment variables to `src/types/env.d.ts` as needed
3. Replace hardcoded values in your code with environment variables
4. Create environment-specific files if needed (`.env.staging`, `.env.production`)

---

**Happy Coding!** 🚀
