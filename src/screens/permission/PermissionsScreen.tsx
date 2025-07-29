import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
      shadowOffset: theme.colors.shadow.offset,
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
      backgroundColor: '#232B38',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      width: '100%',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#232B38',
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
      borderRadius: theme.borderRadius.full,
      elevation: 2,
    },
    skipText: {
      color: '#E5E7EB',
      fontSize: 14,
    },
  });

  const {
    isLoading,
    isGranted,
    isDenied,
    requestLocationPermission,
    hasSkippedLocation,
    skipLocationPermission,
    getCurrentLocation,
  } = useLocation();

  useEffect(() => {
    if (!isLoading && !isDenied) {
      getCurrentLocation();
    }
  }, [isDenied, hasSkippedLocation]);

  useEffect(() => {
    if (isGranted || hasSkippedLocation) {
      // Setup notifications when location permission is granted or skipped
      setupNotifications()
        .then(cleanup => {
          if (cleanup) {
            cleanupRef.current = cleanup;
          }
          onPermissionsComplete();
        })
        .catch(error => {
          console.warn('Failed to setup notifications:', error);
          onPermissionsComplete();
        });
    }
  }, [isGranted, hasSkippedLocation, onPermissionsComplete, setupNotifications]);

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
  const handlePermission = async () => {
    try {
      // Request both location and notification permissions
      await requestLocationPermission();
      await requestPermissions();
    } catch (error) {
      console.warn('Permission request failed:', error);
    }
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
          <TouchableOpacity style={styles.skipContainer} onPress={skipLocationPermission}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
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
            <Text style={styles.permissionButtonText}>Allow Permissions</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PermissionsScreen;
