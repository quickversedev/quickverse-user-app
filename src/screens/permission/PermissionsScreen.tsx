import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../assets';
import { useNotifications } from '../../hooks';
import { useLocation } from '../../hooks/Permissions/useLocation';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');

interface PermissionsScreenProps {
  onPermissionsComplete: () => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onPermissionsComplete }) => {
  const { theme } = useTheme();
  const { requestPermissions, setupNotifications } = useNotifications();
  const cleanupRef = useRef<(() => void) | null>(null);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      color: theme.colors.subText,
      fontSize: theme.typography.body,
      marginTop: 16,
    },
    topBackground: {
      height: height * 0.55,
      width: '100%',
      position: 'absolute',
      top: Platform.OS === 'ios' ? -50 : -80,
    },
    logoContainer: {
      position: 'absolute',
      top: 60,
      alignItems: 'center',
      width: '100%',
      zIndex: 2,
    },
    topLogo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
    },
    card: {
      width: '90%',
      minHeight: '45%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: 24,
      marginTop: height * 0.24,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderHighlight,
      justifyContent: 'space-between',
    },
    title: {
      fontSize: theme.typography.h2,
      color: theme.colors.text,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 16,
    },
    subtitle: {
      textAlign: 'center',
      color: theme.colors.subText,
      fontSize: theme.typography.body,
      marginBottom: 24,
      marginTop: 5,
    },
    permissionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      width: '100%',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    icon: {
      fontSize: 22,
      color: theme.colors.secondary,
    },
    permissionTextContainer: {
      flex: 1,
    },
    permissionTitle: {
      color: theme.colors.text,
      fontWeight: 'bold',
      fontSize: theme.typography.subtitle,
    },
    permissionDesc: {
      color: theme.colors.subText,
      fontSize: theme.typography.caption,
      marginTop: 2,
    },
    permissionButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 14,
      width: '100%',
      marginTop: 16,
      marginBottom: 4,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    permissionButtonText: {
      fontSize: theme.typography.body,
      color: theme.colors.background,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    skipContainer: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: theme.colors.overlay,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
    },
    skipText: {
      color: '#4B5563',
      fontSize: 14,
    },
  });

  const { isLoading, isGranted, isDenied, requestLocationPermission, getCurrentLocation } =
    useLocation();

  useEffect(() => {
    if (!isLoading && !isDenied) {
      getCurrentLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }
  }, [isDenied, isLoading, getCurrentLocation]);

  useEffect(() => {
    if (isGranted) {
      // Location permission is mandatory — only complete once it's granted.
      // Notification permission is requested alongside but may be declined.
      onPermissionsComplete();
    }
  }, [isGranted, onPermissionsComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }
  const promptLocationRequired = () => {
    Alert.alert(
      'Location access required',
      'We need your location to show nearby stores and deliver your orders. Please enable location permission to continue.',
      [
        { text: 'Retry', onPress: () => requestLocationPermission() },
        {
          text: 'Open Settings',
          onPress: () =>
            Linking.openSettings().catch(err => console.warn('Cannot open settings:', err)),
        },
      ],
      { cancelable: false }
    );
  };
  // `handlePermissionRef` kept above `promptLocationRequired` is intentional —
  // Retry only re-prompts for location (notifications were already asked in
  // step 2 of handlePermission and should not re-prompt on every retry).

  const handlePermission = async () => {
    // Step 1: ask for notifications first (optional). Always prompted so
    // the user has a chance to accept/deny regardless of what happens with
    // location afterwards.
    try {
      const notificationResult = await requestPermissions();
      if (notificationResult) {
        try {
          const cleanup = await setupNotifications();
          if (cleanup) {
            cleanupRef.current = cleanup;
          }
        } catch (notificationError) {
          console.warn('Notification setup failed:', notificationError);
        }
      }
    } catch (notifError) {
      console.warn('Notification permission request failed:', notifError);
    }

    // Step 2: ask for location (mandatory).
    let locationGranted = false;
    try {
      const locationResult = await requestLocationPermission();
      locationGranted = locationResult === 'granted' || isGranted;
    } catch (error) {
      console.warn('Location permission request failed:', error);
    }

    // Step 3: gate progression on location only.
    if (!locationGranted) {
      promptLocationRequired();
      return;
    }

    // Location granted → the `isGranted` useEffect completes the flow.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ImageBackground source={Images.bg1} style={styles.topBackground} resizeMode="cover" />
        <View style={styles.logoContainer}>
          <Image style={styles.topLogo} source={Images.logoQv} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Allow Permissions</Text>
          <Text style={styles.subtitle}>We need access to give you the{'\n'}best experience.</Text>
          <View style={styles.permissionCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔔</Text>
            </View>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Enable Notifications</Text>
              <Text style={styles.permissionDesc}>Don&apos;t miss deals and delivery alerts.</Text>
            </View>
          </View>
          <View style={styles.permissionCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📍</Text>
            </View>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Allow Location Access</Text>
              <Text style={styles.permissionDesc}>Serve you better, wherever you are.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.permissionButton} onPress={handlePermission}>
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PermissionsScreen;
