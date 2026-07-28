import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
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
  const { theme } = useTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const { updateData, loading, error, retry } = useFetchUpdateData();
  const isMounted = useRef(true);
  const appState = useRef(AppState.currentState);
  const lastCheckRef = useRef(Date.now());
  const VERSION_CHECK_INTERVAL = 30 * 60 * 1000;

  useEffect(() => {
    isMounted.current = true;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (Date.now() - lastCheckRef.current >= VERSION_CHECK_INTERVAL) {
          lastCheckRef.current = Date.now();
          retry?.();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      isMounted.current = false;
      subscription.remove();
    };
  }, [retry]);

  // Version Comparison Logic
  const compareVersions = useCallback(
    (currentVersion: string, requiredVersion: string): boolean => {
      const current = currentVersion.split('.').map(Number);
      const required = requiredVersion.split('.').map(Number);

      console.log(current, required);

      for (let i = 0; i < Math.max(current.length, required.length); i++) {
        const currentPart = current[i] || 0;
        const requiredPart = required[i] || 0;

        if (currentPart < requiredPart) return true; // Needs update
        if (currentPart > requiredPart) return false; // Current is newer
      }
      return false;
    },
    []
  );

  const checkForUpdate = useCallback(async () => {
    if (!isMounted.current || !updateData?.min_required_version) {
      setIsUpdateRequired(false);
      return;
    }

    try {
      const currentVersion = DeviceInfo.getVersion();
      console.log(updateData.min_required_version);
      const needsUpdate = compareVersions(currentVersion, updateData.min_required_version);

      if (isMounted.current) {
        setIsUpdateRequired(needsUpdate);
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
    }
  }, [updateData, compareVersions]);

  // Trigger check when data is fetched
  useEffect(() => {
    if (!loading && !error && updateData) {
      checkForUpdate();
    }
  }, [loading, error, updateData, checkForUpdate]);

  // Trigger animations
  useEffect(() => {
    if (isUpdateRequired) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isUpdateRequired, fadeAnim, slideAnim, scaleAnim]);

  const handleUpdate = async () => {
    try {
      const storeUrl = Platform.OS === 'ios' ? updateData?.ios_url : updateData?.android_url;

      if (!storeUrl) {
        Alert.alert(
          'Notice',
          'The update link is currently unavailable. Please check the store manually.'
        );
        return;
      }

      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        // Fallback for some simulators or specific environments
        Alert.alert('Error', 'Unable to open the App Store directly.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while redirecting to the store.');
    }
  };

  const styles = getStyles(theme);

  if (isUpdateRequired) {
    return (
      <View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <ImageBackground source={Images.bg1} style={styles.topBackground} resizeMode="cover" />
        </Animated.View>

        <View style={styles.logoContainer}>
          <Image style={styles.topLogo} source={Images.logoQv} />
        </View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.updateIconContainer}>
            <Text style={styles.updateIcon}>🔄</Text>
          </View>

          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.subtitle}>
            A new version of the app is available with important improvements and bug fixes.
          </Text>

          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Current Version: {DeviceInfo.getVersion()}</Text>
            <Text style={styles.versionText}>
              Required Version: {updateData?.min_required_version}
            </Text>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.8}>
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>

          <Text style={styles.updateNote}>Please update to continue using the app</Text>
        </Animated.View>
      </View>
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
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
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
  });
