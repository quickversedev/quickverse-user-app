import messaging from '@react-native-firebase/messaging';

/**
 * Check notification permission status
 * Returns 'true' if notifications are authorized, 'false' otherwise
 */
export const getNotificationPermissionStatus = async (): Promise<string> => {
  try {
    const authStatus = await messaging().hasPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ? 'true'
      : 'false';
  } catch (error) {
    return 'false';
  }
};
