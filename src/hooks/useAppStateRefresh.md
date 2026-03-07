# useAppStateRefresh Hook

A React Native hook that automatically refreshes data when the app comes back from background after a specified threshold time.

## Features

- **Smart Refresh**: Only refreshes if app was in background for longer than threshold
- **Configurable Threshold**: Set minimum time in background before triggering refresh
- **Error Handling**: Graceful error handling with console warnings
- **Manual Refresh**: Provides manual refresh function
- **Background State**: Tracks if app is currently in background
- **Memory Safe**: Prevents memory leaks with proper cleanup

## Usage

### Basic Usage

```tsx
import { useAppStateRefresh } from '../hooks/useAppStateRefresh';

const MyComponent = () => {
  const refreshData = async () => {
    // Your refresh logic here
    await fetchNewData();
  };

  useAppStateRefresh({
    onForeground: refreshData,
    refreshThreshold: 30000, // 30 seconds
  });

  return <YourComponent />;
};
```

### With Background Cleanup

```tsx
const MyComponent = () => {
  const refreshData = async () => {
    await fetchNewData();
  };

  const cleanupData = () => {
    // Cleanup logic when going to background
    clearCache();
  };

  useAppStateRefresh({
    onForeground: refreshData,
    onBackground: cleanupData,
    refreshThreshold: 60000, // 1 minute
  });
};
```

### Conditional Refresh

```tsx
const MyComponent = () => {
  const { isLoggedIn } = useAuth();

  useAppStateRefresh({
    onForeground: async () => {
      if (isLoggedIn) {
        await refreshUserData();
      }
    },
    enabled: isLoggedIn, // Only enable when logged in
    refreshThreshold: 30000,
  });
};
```

### Manual Refresh

```tsx
const MyComponent = () => {
  const { manualRefresh } = useAppStateRefresh({
    onForeground: refreshData,
  });

  const handleManualRefresh = () => {
    manualRefresh();
  };

  return (
    <TouchableOpacity onPress={handleManualRefresh}>
      <Text>Refresh Now</Text>
    </TouchableOpacity>
  );
};
```

## API

### Options

| Option             | Type                          | Default | Description                                               |
| ------------------ | ----------------------------- | ------- | --------------------------------------------------------- |
| `onForeground`     | `() => void \| Promise<void>` | -       | Function to call when app comes to foreground             |
| `onBackground`     | `() => void`                  | -       | Function to call when app goes to background              |
| `refreshThreshold` | `number`                      | `30000` | Minimum time in background before triggering refresh (ms) |
| `enabled`          | `boolean`                     | `true`  | Whether the hook should be active                         |

### Returns

| Property         | Type                  | Description                            |
| ---------------- | --------------------- | -------------------------------------- |
| `manualRefresh`  | `() => Promise<void>` | Function to manually trigger refresh   |
| `isInBackground` | `boolean`             | Whether app is currently in background |

## Integration Examples

### App Initializer

```tsx
// Refresh critical app data when coming back from background
useAppStateRefresh({
  onForeground: async () => {
    await Promise.allSettled([fetchVendors(), fetchAddresses(), fetchConfig(), fetchTheme()]);
  },
  refreshThreshold: 60000, // 1 minute
  enabled: isLoggedIn && isInitialized,
});
```

### Orders List

```tsx
// Refresh orders when coming back from background
useAppStateRefresh({
  onForeground: async () => {
    await refreshOrders(10);
  },
  refreshThreshold: 30000, // 30 seconds
});
```

### Explore Screen

```tsx
// Refresh vendors when coming back from background
useAppStateRefresh({
  onForeground: async () => {
    handleRefreshVendors();
  },
  refreshThreshold: 30000, // 30 seconds
});
```

## Best Practices

1. **Set Appropriate Thresholds**:

   - Short threshold (30s) for frequently changing data (orders, notifications)
   - Longer threshold (1-2 min) for stable data (config, theme)

2. **Error Handling**: Always wrap refresh logic in try-catch blocks

3. **Conditional Enabling**: Only enable when necessary (e.g., when user is logged in)

4. **Performance**: Avoid heavy operations in refresh callbacks

5. **Memory Management**: The hook automatically handles cleanup, but ensure your refresh functions don't create memory leaks

## Notes

- The hook uses React Native's `AppState` API
- Refresh only triggers if app was in background for longer than threshold
- Multiple instances of the hook can be used in the same component
- The hook is safe to use in nested components
