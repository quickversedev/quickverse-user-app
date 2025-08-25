import notifee, {
  AndroidImportance,
  AndroidVisibility,
  Event,
  EventType,
} from '@notifee/react-native';
import {
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

// Import the logo for notifications
const notificationLogo = Platform.OS === 'ios' ? 'logo_qv' : 'logo_qv';

// Helper function to get notification icon based on type
const getNotificationIcon = (type?: string) => {
  switch (type) {
    case 'order':
      return 'ic_launcher'; // Use default icon for order notifications
    case 'promo':
      return notificationLogo; // Use app logo for promotional notifications
    case 'alert':
      return 'ic_launcher'; // Use default icon for alerts
    default:
      return notificationLogo; // Use app logo as default
  }
};

// Helper function to determine notification type from message data
const getNotificationTypeFromData = (data?: { [key: string]: string | object }) => {
  if (!data) return 'default';

  // Check for order-related data
  if (data.orderId || data.order_id || data.orderStatus || data.order_status) {
    return 'order';
  }

  // Check for promotional data
  if (data.promo || data.promotion || data.offer || data.discount) {
    return 'promo';
  }

  // Check for alert data
  if (data.alert || data.urgent || data.emergency) {
    return 'alert';
  }

  return 'default';
};

interface NotificationPayload {
  title?: string;
  body?: string;
  data?: { [key: string]: string | object };
  type?: 'default' | 'order' | 'promo' | 'alert';
}

// Custom error types for better error handling
class NotificationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

class PermissionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

class MessagingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MessagingError';
  }
}

export const useNotifications = () => {
  const handleError = (error: unknown, context: string) => {
    // Convert unknown error to proper error type
    const actualError = error instanceof Error ? error : new Error(String(error));

    // Log error with context
    console.warn(`[Notification Error] ${context}:`, {
      name: actualError.name,
      message: actualError.message,
      stack: actualError.stack,
      // Additional context for custom error types
      ...(actualError instanceof NotificationError && { code: actualError.code }),
      ...(actualError instanceof PermissionError && { code: actualError.code }),
      ...(actualError instanceof MessagingError && { code: actualError.code }),
    });
  };

  const createDefaultChannel = async () => {
    try {
      // Create a channel (required for Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
      });
    } catch (error) {
      throw new NotificationError(
        'Failed to create notification channel',
        'CHANNEL_CREATION_FAILED'
      );
    }
  };

  /**
   * Display a notification with app logo
   * @param payload - Notification payload with title, body, data, and optional type
   * @param payload.type - Optional notification type: 'default' | 'order' | 'promo' | 'alert'
   *                       Different types use different icons (app logo vs default icon)
   */
  const displayNotification = async (payload: NotificationPayload) => {
    try {
      // Validate payload
      if (!payload) {
        throw new NotificationError('Notification payload is required', 'INVALID_PAYLOAD');
      }

      if (!payload.title && !payload.body) {
        throw new NotificationError(
          'Notification requires at least a title or body',
          'MISSING_CONTENT'
        );
      }

      // Create a channel if it doesn't exist (Android requirement)
      if (Platform.OS === 'android') {
        await createDefaultChannel().catch(error => {
          // Log channel creation error but continue with notification
          handleError(error, 'Channel creation failed');
        });
      }

      // Display the notification
      await notifee.displayNotification({
        title: payload.title,
        body: payload.body,
        data: payload.data || {}, // Ensure data is never undefined
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
          largeIcon: getNotificationIcon(payload.type), // Use appropriate icon based on type
          smallIcon: 'logo_qv', // Use the default launcher icon as small icon
        },
        ios: {
          attachments: [
            {
              url: notificationLogo, // iOS will look for this in the app bundle
              thumbnailHidden: false,
            },
          ],
        },
      });
    } catch (error) {
      handleError(error, 'Display notification failed');
      throw error; // Propagate error to caller
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'ios') {
        const settings = await notifee.requestPermission();
        if (!settings) {
          throw new PermissionError(
            'Failed to get iOS notification settings',
            'IOS_SETTINGS_FAILED'
          );
        }
        return settings.authorizationStatus;
      }

      if (Platform.OS === 'android') {
        // On Android 13+ (API 33), POST_NOTIFICATIONS runtime permission is required
        if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
          const hasPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          if (hasPermission === PermissionsAndroid.RESULTS.DENIED) {
            throw new PermissionError('Notification permission denied', 'PERMISSION_DENIED');
          }

          if (hasPermission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            throw new PermissionError(
              'Notification permission permanently denied',
              'PERMISSION_BLOCKED'
            );
          }

          return hasPermission === PermissionsAndroid.RESULTS.GRANTED;
        }

        // On Android 12 and below, no runtime permission is required for notifications
        return true;
      }

      throw new PermissionError('Unsupported platform for notifications', 'PLATFORM_UNSUPPORTED');
    } catch (error) {
      handleError(error, 'Request permissions failed');
      return false;
    }
  };

  const setupForegroundHandler = () => {
    try {
      const messaging = getMessaging();
      if (!messaging) {
        throw new MessagingError(
          'Firebase messaging is not initialized',
          'MESSAGING_NOT_INITIALIZED'
        );
      }

      return onMessage(messaging, async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        try {
          if (!remoteMessage) {
            throw new MessagingError('Received empty message in foreground', 'EMPTY_MESSAGE');
          }

          const notificationType = getNotificationTypeFromData(remoteMessage.data);
          await displayNotification({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data || {},
            type: notificationType, // Use appropriate type based on message data
          });
        } catch (error) {
          handleError(error, 'Foreground message handling failed');
        }
      });
    } catch (error) {
      handleError(error, 'Setup foreground handler failed');
      return () => {}; // Return no-op cleanup function
    }
  };

  const setupBackgroundHandler = () => {
    try {
      const messaging = getMessaging();
      if (!messaging) {
        throw new MessagingError(
          'Firebase messaging is not initialized',
          'MESSAGING_NOT_INITIALIZED'
        );
      }

      // Use Notifee to display background notifications with custom logo
      // Avoid duplicates by skipping when Android system already shows notification payload
      messaging.setBackgroundMessageHandler(
        async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          try {
            if (!remoteMessage) {
              throw new MessagingError('Received empty message in background', 'EMPTY_MESSAGE');
            }

            // If Android notification payload exists, let the system render it (prevents duplicates)
            if (Platform.OS === 'android' && remoteMessage.notification) {
              return;
            }

            // For data-only messages: render with Notifee (ensures logo + theming)
            const notificationType = getNotificationTypeFromData(remoteMessage.data);
            const data = (remoteMessage.data || {}) as { [key: string]: string };
            const title = (remoteMessage.notification?.title || data.title) as string | undefined;
            const body = (remoteMessage.notification?.body || data.body) as string | undefined;

            // Only display if we have any visible content
            if (title || body) {
              await displayNotification({
                title,
                body,
                data,
                type: notificationType,
              });
            }
          } catch (error) {
            handleError(error, 'Background message handling failed');
          }
        }
      );
    } catch (error) {
      handleError(error, 'Setup background handler failed');
    }
  };

  const setupNotificationOpenedHandler = useCallback(() => {
    try {
      const messaging = getMessaging();
      if (!messaging) {
        throw new MessagingError(
          'Firebase messaging is not initialized',
          'MESSAGING_NOT_INITIALIZED'
        );
      }

      return onNotificationOpenedApp(messaging, remoteMessage => {
        try {
          if (!remoteMessage) {
            throw new MessagingError(
              'Received empty message on notification open',
              'EMPTY_MESSAGE'
            );
          }

          // Implement navigation logic here
        } catch (error) {
          handleError(error, 'Notification open handling failed');
        }
      });
    } catch (error) {
      handleError(error, 'Setup notification opened handler failed');
      return () => {}; // Return no-op cleanup function
    }
  }, []);

  const setupInitialNotification = useCallback(async () => {
    try {
      const messaging = getMessaging();
      if (!messaging) {
        throw new MessagingError(
          'Firebase messaging is not initialized',
          'MESSAGING_NOT_INITIALIZED'
        );
      }

      const initialNotification = await getInitialNotification(messaging);
      if (initialNotification) {
        // Implement navigation logic here
      }
    } catch (error) {
      handleError(error, 'Check initial notification failed');
    }
  }, []);

  const setupNotifeeBackgroundHandler = () => {
    try {
      notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
        try {
          if (!type) {
            throw new NotificationError('Invalid background event type', 'INVALID_EVENT_TYPE');
          }

          if (type === EventType.PRESS && detail?.notification) {
            // Handle notification press with logo support
            // The notification already has the logo from when it was created
            // Implement navigation logic here
          }
        } catch (error) {
          handleError(error, 'Notifee background event handling failed');
        }
      });
      return () => {};
    } catch (error) {
      handleError(error, 'Setup Notifee background handler failed');
      return () => {};
    }
  };

  const getFCMToken = async () => {
    try {
      const messaging = getMessaging();
      if (!messaging) {
        throw new MessagingError(
          'Firebase messaging is not initialized',
          'MESSAGING_NOT_INITIALIZED'
        );
      }

      const token = await getToken(messaging);
      if (!token) {
        throw new MessagingError('Failed to get FCM token', 'TOKEN_RETRIEVAL_FAILED');
      }

      return token;
    } catch (error) {
      handleError(error, 'Get FCM token failed');
      return null;
    }
  };

  const setupNotifications = async () => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeBackground: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;

    try {
      const permissionStatus = await requestPermissions();

      if (!permissionStatus) {
        throw new PermissionError('Notification permissions not granted', 'PERMISSION_NOT_GRANTED');
      }

      // Get the FCM token
      const token = await getFCMToken();
      if (!token) {
        throw new MessagingError('No FCM token available', 'TOKEN_UNAVAILABLE');
      }

      // Setup handlers
      unsubscribeForeground = setupForegroundHandler();
      unsubscribeBackground = setupNotifeeBackgroundHandler();
      unsubscribeOpened = setupNotificationOpenedHandler();
      setupBackgroundHandler();
      await setupInitialNotification();

      // Return cleanup function
      return () => {
        try {
          unsubscribeForeground?.();
          unsubscribeBackground?.();
          unsubscribeOpened?.();
        } catch (error) {
          handleError(error, 'Notification cleanup failed');
        }
      };
    } catch (error) {
      handleError(error, 'Setup notifications failed');
      return () => {}; // Return no-op cleanup function on error
    }
  };

  return {
    displayNotification,
    getFCMToken,
    requestPermissions,
    setupNotifications,
  };
};
