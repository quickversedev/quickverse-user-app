import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import { Images } from '../../assets';
import useFetchUpdateData from '../../hooks/useFetchUpdateData';
import { Theme, useTheme } from '../../theme/ThemeContext';

const { height, width } = Dimensions.get('window');

const ForceUpdateChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { theme } = useTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Use the custom hook to fetch update data
  const { updateData, loading, error, retry } = useFetchUpdateData();

  // Mounted ref to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && !error && updateData) {
      checkForUpdate();
    }
  }, [loading, error, updateData]);

  // Animate in when update is required
  useEffect(() => {
    if (isUpdateRequired) {
      const animations = [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ];

      Animated.parallel(animations).start();

      return () => {
        // Clean up animations
        animations.forEach(anim => anim.stop());
      };
    }
  }, [isUpdateRequired, fadeAnim, slideAnim, scaleAnim]);

  const compareVersions = (currentVersion: string, requiredVersion: string): boolean => {
    const current = currentVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, required.length); i++) {
      const currentPart = current[i] || 0;
      const requiredPart = required[i] || 0;

      if (currentPart < requiredPart) return true;
      if (currentPart > requiredPart) return false;
    }

    return false;
  };

  const checkForUpdate = async () => {
    if (!isMounted.current) return;

    try {
      setIsChecking(true);
      const currentVersion = DeviceInfo.getVersion();

      if (!updateData?.min_required_version) {
        setIsUpdateRequired(false);
        return;
      }

      const needsUpdate = compareVersions(currentVersion, updateData.min_required_version);

      if (isMounted.current) {
        setIsUpdateRequired(needsUpdate);
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to check for updates. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setIsChecking(false);
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const storeUrl = Platform.OS === 'ios' ? updateData?.ios_url : updateData?.android_url;

      if (!storeUrl) {
        Alert.alert('Error', 'Store URL not available');
        return;
      }

      const supported = await Linking.canOpenURL(storeUrl);

      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        Alert.alert('Error', 'Cannot open store URL');
      }
    } catch (error) {
      console.error('Error opening store:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to open store');
      }
    }
  };

  const handleRetry = () => {
    if (!isMounted.current) return;
    setIsChecking(true);
    retry();
  };

  // Loading state
  if (loading || isChecking) {
    console.log('loading ::::::', loading, isChecking);
    return (
      <View style={getStyles(theme).loadingContainer}>
        <Image style={getStyles(theme).loadingLogo} source={Images.logoQv} />
        <ActivityIndicator
          size="large"
          color={theme.colors.secondary}
          style={getStyles(theme).spinner}
        />
        <Text style={getStyles(theme).loadingText}>Checking for updates...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={getStyles(theme).errorContainer}>
        <Image style={getStyles(theme).errorLogo} source={Images.logoQv} />
        <Text style={getStyles(theme).errorTitle}>Connection Error</Text>
        <Text style={getStyles(theme).errorText}>
          Failed to check for updates. Please check your internet connection.
        </Text>
        <TouchableOpacity style={getStyles(theme).retryButton} onPress={handleRetry}>
          <Text style={getStyles(theme).retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Update required state
  if (isUpdateRequired) {
    return (
      <Animated.View
        style={[
          getStyles(theme).container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <ImageBackground
          source={Images.bg1}
          style={getStyles(theme).topBackground}
          resizeMode="cover"
        />

        <View style={getStyles(theme).logoContainer}>
          <Image style={getStyles(theme).topLogo} source={Images.logoQv} />
        </View>

        <Animated.View
          style={[
            getStyles(theme).card,
            {
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={getStyles(theme).updateIconContainer}>
            <Text style={getStyles(theme).updateIcon}>🔄</Text>
          </View>

          <Text style={getStyles(theme).title}>Update Required</Text>
          <Text style={getStyles(theme).subtitle}>
            A new version of the app is available with important improvements and bug fixes.
          </Text>

          <View style={getStyles(theme).versionInfo}>
            <Text style={getStyles(theme).versionText}>
              Current Version: {DeviceInfo.getVersion()}
            </Text>
            <Text style={getStyles(theme).versionText}>
              Required Version: {updateData?.min_required_version}
            </Text>
          </View>

          <TouchableOpacity
            style={getStyles(theme).updateButton}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Text style={getStyles(theme).updateButtonText}>Update Now</Text>
          </TouchableOpacity>

          <Text style={getStyles(theme).updateNote}>Please update to continue using the app</Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return <>{children}</>;
};

export default ForceUpdateChecker;

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    topBackground: {
      height: height * 0.6,
      width: '100%',
      position: 'absolute',
      top: -80,
    },
    logoContainer: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 70,
    },
    topLogo: {
      width: 90,
      height: 90,
      resizeMode: 'contain',
    },
    card: {
      width: width * 0.9,
      maxWidth: 400,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: 32,
      borderWidth: 1,
      borderColor: theme.colors.borderHighlight,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 8,
      alignItems: 'center',
    },
    updateIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    updateIcon: {
      fontSize: 40,
    },
    title: {
      fontSize: theme.typography.h1,
      color: theme.colors.text,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      textAlign: 'center',
      color: theme.colors.subText,
      fontSize: theme.typography.body,
      lineHeight: 24,
      marginBottom: 24,
    },
    versionInfo: {
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.sm,
      padding: 16,
      marginBottom: 24,
      width: '100%',
    },
    versionText: {
      color: theme.colors.subText,
      fontSize: theme.typography.caption,
      textAlign: 'center',
      marginVertical: 2,
    },
    updateButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 16,
      paddingHorizontal: 32,
      width: '100%',
      marginBottom: 16,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    updateButtonText: {
      fontSize: theme.typography.body,
      color: theme.colors.background,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    updateNote: {
      color: theme.colors.subText,
      fontSize: theme.typography.caption,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    // Loading styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingLogo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
      marginBottom: 32,
    },
    spinner: {
      marginBottom: 16,
    },
    loadingText: {
      color: theme.colors.subText,
      fontSize: theme.typography.body,
    },
    // Error styles
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 24,
    },
    errorLogo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
      marginBottom: 32,
    },
    errorTitle: {
      fontSize: theme.typography.h2,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    errorText: {
      fontSize: theme.typography.body,
      color: theme.colors.subText,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    retryButton: {
      backgroundColor: theme.colors.secondary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.borderRadius.sm,
    },
    retryButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.body,
      fontWeight: 'bold',
    },
  });
