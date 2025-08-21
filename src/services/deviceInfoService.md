# Device Info Service

This service handles updating device information to the backend API using `react-native-device-info`.

## Features

- Extracts device information using `react-native-device-info`
- Maps device data to backend API format
- Handles FCM token updates
- Provides logging utilities for debugging

## API Endpoint

```
POST /v1/updateDevice
```

## Request Body

```typescript
interface DeviceInfoRequest {
  deviceId: string; // Unique device identifier
  deviceType: string; // "phone" or "tablet"
  deviceModel: string; // "Brand Model" (e.g., "Samsung Galaxy S21")
  osVersion: string; // OS version (e.g., "14.0")
  appVersion: string; // App version with build number (e.g., "1.0.0 (1)")
  fcmToken: string; // Firebase Cloud Messaging token
  tokenType: string; // "IOS" or "ANDROID"
  lastActiveTimestamp: string; // ISO timestamp
  notificationEnabled: string; // "true" or "false"
  longitude: number; // GPS longitude
  latitude: number; // GPS latitude
  loginTimestamp: string; // ISO timestamp
}
```

## Usage

### Basic Usage

```typescript
import deviceInfoService from '../services/deviceInfoService';

// Update device info
const response = await deviceInfoService.updateDeviceInfo(
  sessionKey,
  fcmToken,
  longitude,
  latitude
);
```

### Using the Hook

```typescript
import { useDeviceInfo } from '../hooks';

const MyComponent = () => {
  const { updateDeviceInfo, getDeviceInfoForLogging } = useDeviceInfo();

  const handleUpdateDeviceInfo = async () => {
    try {
      const response = await updateDeviceInfo(longitude, latitude);
      console.log('Device info updated:', response);
    } catch (error) {
      console.error('Failed to update device info:', error);
    }
  };

  const handleLogDeviceInfo = async () => {
    const deviceInfo = await getDeviceInfoForLogging();
    console.log('Device Info:', deviceInfo);
  };

  return (
    // Your component JSX
  );
};
```

### Using Utility Functions

```typescript
import {
  updateDeviceInfoAfterLogin,
  updateDeviceInfoOnForeground,
  updateDeviceInfoOnTokenRefresh,
} from '../utils/deviceInfoUtils';

// After successful login
await updateDeviceInfoAfterLogin(sessionKey, fcmToken, longitude, latitude);

// When app comes to foreground
await updateDeviceInfoOnForeground(sessionKey, fcmToken, longitude, latitude);

// When FCM token refreshes
await updateDeviceInfoOnTokenRefresh(sessionKey, newFcmToken, longitude, latitude);
```

## Integration Points

### 1. After Login

Call `updateDeviceInfoAfterLogin` after successful authentication:

```typescript
// In AuthProvider or login screen
const verifyOtp = async (phoneNumber: string, otp: string, verificationId: string) => {
  const response = await authService.verifyOtp(phoneNumber, otp, verificationId);
  const { token, phoneNumber: phone, name, newUser } = response?.session;

  if (token && phone) {
    setAuth({ jwt: token, phone, username: name || 'Howdy' });

    // Update device info after successful login
    await updateDeviceInfoAfterLogin(token, fcmToken, longitude, latitude);
  }
};
```

### 2. FCM Token Refresh

Call `updateDeviceInfoOnTokenRefresh` when FCM token is refreshed:

```typescript
// In useNotifications hook
const setupTokenRefresh = () => {
  messaging.onTokenRefresh(token => {
    updateDeviceInfoOnTokenRefresh(sessionKey, token, longitude, latitude);
  });
};
```

### 3. App State Changes

Call `updateDeviceInfoOnForeground` when app comes to foreground:

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      updateDeviceInfoOnForeground(sessionKey, fcmToken, longitude, latitude);
    }
  };

  AppState.addEventListener('change', handleAppStateChange);
  return () => AppState.removeEventListener('change', handleAppStateChange);
}, []);
```

## Device Information Extracted

The service extracts the following information using `react-native-device-info`:

- **Device Identity**: `getUniqueId()`, `getDeviceId()`, `getBrand()`, `getModel()`
- **OS Information**: `getSystemName()`, `getSystemVersion()`, `getApiLevel()` (Android)
- **App Information**: `getVersion()`, `getBuildNumber()`, `getBundleId()`
- **Device Type**: `isTablet()`, `isEmulator()`
- **Hardware**: `getTotalMemory()`, `getBatteryLevel()`
- **Network**: `getCarrier()`, `getTimezone()`
- **Locale**: `getLanguage()`, `getCountry()`

## Error Handling

The service includes comprehensive error handling:

- Graceful fallbacks for missing device information
- Non-blocking updates (errors don't crash the app)
- Detailed logging for debugging
- Platform-specific handling for iOS and Android

## Notes

- Device info updates are non-blocking and won't affect app functionality if they fail
- FCM token is required for push notifications
- Location coordinates are required for location-based features
- All timestamps are in ISO format
- Device type is automatically detected (phone/tablet)
