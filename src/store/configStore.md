# Initial Configuration Store

This directory contains the Zustand store and custom hook for managing initial configuration data in the application.

## Files

- `configStore.ts` - Zustand store for initial configuration state management
- `../hooks/useConfig.ts` - Custom hook that provides a clean interface to the config store
- `../types/config.ts` - TypeScript types for configuration-related data
- `../services/api/configService.ts` - API service for initial configuration

## Usage

### Using the Hook (Recommended)

```typescript
import { useConfig } from '../hooks/useConfig';

const MyComponent = () => {
  const { config, loading, error, fetchInitialConfig, retryFetch, getThemeId, getRegionId } =
    useConfig();

  useEffect(() => {
    // Fetch config when component mounts
    fetchInitialConfig({
      longitude: '78.567',
      latitude: '22.9113',
    });
  }, [fetchInitialConfig]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <ErrorComponent onRetry={() => retryFetch({ longitude: '78.567', latitude: '22.9113' })} />
    );

  return (
    <div>
      <p>Theme ID: {getThemeId()}</p>
      <p>Region ID: {getRegionId()}</p>
    </div>
  );
};
```

### Using the Store Directly

```typescript
import useConfigStore from '../store/configStore';

const MyComponent = () => {
  const { config, loading, error, fetchInitialConfig } = useConfigStore();

  useEffect(() => {
    fetchInitialConfig({
      longitude: '78.567',
      latitude: '22.9113',
    });
  }, [fetchInitialConfig]);
};
```

## Features

- **API Integration**: Fetches initial configuration from the server based on location coordinates
- **Error Handling**: Built-in error handling with retry functionality
- **Loading States**: Loading states for better UX
- **Type Safety**: Full TypeScript support with proper type definitions
- **Authentication**: Includes Basic Auth header for API requests
- **Location-based**: Configures app based on user's geographical location

## API Methods

### useConfig Hook

- `config` - Current configuration object or null
- `loading` - Boolean indicating if a request is in progress
- `error` - Error message if any request failed
- `fetchInitialConfig(params)` - Fetch configuration for given coordinates
- `retryFetch(params)` - Retry the last failed request
- `getThemeId()` - Get the theme ID from configuration
- `getRegionId()` - Get the region ID from configuration
- `hasConfig()` - Boolean indicating if configuration exists

### Store Actions

- `fetchInitialConfig(params)` - Fetch configuration from API
- `setLoading(loading)` - Manually set loading state
- `setError(error)` - Manually set error state
- `clearError()` - Clear the current error
- `reset()` - Reset store to initial state

## Types

```typescript
interface InitialConfigResponse {
  themeId: string;
  regionId: string;
}

interface InitialConfigParams {
  longitude: string;
  latitude: string;
}
```

## API Format

The store makes requests to the API in the following format:

```bash
GET /quickVerse/v1/initialConfig?longitude=78.567&latitude=22.9113
Headers:
  Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
  Request-Origin: CUSTOMER
```

Response:

```json
{
  "themeId": "theme_value",
  "regionId": "region_value"
}
```

## Integration with App Initialization

This store is typically used during app initialization to configure the app based on the user's location:

```typescript
// In AppInitializer.tsx or similar
const { fetchInitialConfig } = useConfig();

useEffect(() => {
  if (userLocation) {
    fetchInitialConfig({
      longitude: userLocation.longitude.toString(),
      latitude: userLocation.latitude.toString(),
    });
  }
}, [userLocation, fetchInitialConfig]);
```









