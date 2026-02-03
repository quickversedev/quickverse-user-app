import messaging from '@react-native-firebase/messaging';

/**
 * Check notification permission status
 * Returns 'true' if notifications are authorized, 'false' otherwise
 */
export const getNotificationPermissionStatus = async (): Promise<string> => {
  try {
    const authStatus = await messaging().hasPermission();
    // 1 = AUTHORIZED, 2 = PROVISIONAL
    return authStatus === 1 || authStatus === 2 ? 'true' : 'false';
  } catch (error) {
    return 'false';
  }
};
