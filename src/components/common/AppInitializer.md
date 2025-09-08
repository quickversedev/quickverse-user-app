# AppInitializer Component

The `AppInitializer` component is responsible for handling all necessary API calls during app initialization and managing the app's startup flow.

## Features

- **Parallel API Calls**: Executes multiple initialization APIs simultaneously for better performance
- **Error Handling**: Gracefully handles API failures and shows user-friendly error states
- **Retry Mechanism**: Allows users to retry failed initialization attempts
- **Loading States**: Shows appropriate loading indicators during initialization
- **Fallback Support**: Uses default themes/configs when APIs fail

## Usage

### Basic Usage

```tsx
import { AppInitializer } from '../components/common';

function App() {
  return (
    <ThemeProvider>
      <AppInitializer>
        <TabNavigation />
      </AppInitializer>
    </ThemeProvider>
  );
}
```

### With Custom Content

```tsx
import { AppInitializer } from '../components/common';

function App() {
  return (
    <ThemeProvider>
      <AppInitializer>
        <YourMainAppComponent />
      </AppInitializer>
    </ThemeProvider>
  );
}
```

## API Calls

The component makes the following API calls during initialization:

1. **Theme Configuration** (`/theme-config`)

   - Fetches app theme and styling configuration
   - Falls back to default theme if API fails

2. **Initial Configuration** (`/v1/initialConfig`)
   - Fetches app version information
   - Gets store URLs for updates
   - Required for app functionality

## States

### Loading State

- Shows a centered loading spinner
- Uses theme colors for consistency

### Error State

- Displays the `ErrorState` component
- Shows retry button for failed initialization
- Custom error messages for different failure scenarios

### Success State

- Renders the main app content
- Falls back to `TabNavigation` if no children provided

## Error Handling

- **Network Errors**: Handles connection issues gracefully
- **API Failures**: Shows specific error messages
- **Timeout Handling**: Uses configured timeout values
- **Retry Logic**: Allows multiple retry attempts

## Integration with Existing App

The component is designed to work with the existing app structure:

- Uses `ThemeContext` for consistent styling
- Integrates with existing `ErrorState` component
- Compatible with `TabNavigation` and other app components
- Follows React Native best practices for both Android and iOS

## Customization

You can extend the component by:

1. **Adding More APIs**: Include additional initialization calls in the `Promise.all` array
2. **Custom Error Messages**: Modify error handling logic
3. **Additional States**: Add more complex initialization flows
4. **Caching Logic**: Implement data caching for offline scenarios

## Example Integration

```tsx
// In your main App.tsx
import { AppInitializer } from './src/components/common';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TabProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <NavigationContainer>
              <AuthProvider>
                <AppInitializer>
                  <Route />
                </AppInitializer>
              </AuthProvider>
            </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
      </TabProvider>
    </GestureHandlerRootView>
  );
}
```

This ensures that all necessary APIs are called before the main app content is displayed, providing a smooth and reliable user experience.
