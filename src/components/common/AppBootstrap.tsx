import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../../contexts/login/AuthProvider';
import { PermissionAndLocation, useLocation } from '../../hooks/Permissions/useLocation';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { AppStack } from '../../routes/AppStack';
import Registration from '../../screens/Login/Registration';
import PermissionsScreen from '../../screens/permission/PermissionsScreen';
import AppInitializer from './AppInitializer';
import ErrorState from './ErrorState';
import { HomeScreenSkeleton } from './skeleton';

const LocationResolvingIndicator: React.FC = () => (
  <View style={styles.locationOverlay}>
    <View style={styles.locationCard}>
      <View style={styles.locationIconWrap}>
        <Icon name="map-marker-radius" size={36} color="#D97706" />
      </View>
      <Text style={styles.locationTitle}>Detecting your location</Text>
      <Text style={styles.locationSubtitle}>Setting your delivery area…</Text>
      <ActivityIndicator size="small" color="#D97706" style={styles.locationSpinner} />
    </View>
  </View>
);

/**
 * AppBootstrap Component
 *
 * This component handles the conditional rendering of different app states:
 * 1. PermissionsScreen - for users who need to grant permissions (shown first)
 * 2. Registration - for new users (shown after permissions)
 * 3. AppInitializer + AppStack - for authenticated users with permissions
 *
 * Flow:
 * - All users → PermissionsScreen (first)
 * - New users → Registration (after permissions)
 * - After registration → AppInitializer + AppStack
 */
const AppBootstrap: React.FC = () => {
  const { isNewUser, authData } = useAuth();
  const [permissionsCompleted, setPermissionsCompleted] = useState(false);
  const { getPermissionAndLocation, isGranted, hasSkippedLocation } = useLocation();
  const [permissionData, setLocalPermissionData] = useState<PermissionAndLocation | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  // Set to true only after the post-PermissionsScreen location re-fetch has
  // completed. Gates AppInitializer mount so locationData is never stale.
  const [locationRefreshed, setLocationRefreshed] = useState(false);
  const { setPermissionDataInAuth } = useAuth();
  const [bootError, setBootError] = useState<string | null>(null);
  const { updateDeviceInfo } = useDeviceInfo();
  // eslint-disable-next-line no-console
  //console.log('auth jwt :', authData?.jwt);
  const bootstrap = async () => {
    setBootError(null);
    try {
      const result = await getPermissionAndLocation();
      setLocalPermissionData(result as PermissionAndLocation);
      setPermissionDataInAuth(result as PermissionAndLocation);

      // Update device info non-blocking after bootstrap completes
      if (!isNewUser && authData?.jwt) {
        updateDeviceInfo(result?.location?.longitude, result?.location?.latitude).catch(error => {
          // Don't block app initialization if device info update fails
          console.warn('Failed to update device info during bootstrap:', error);
        });
      }
    } catch (error) {
      setBootError(
        error instanceof Error ? error.message : 'Failed to initialize location permissions'
      );
    } finally {
      setBootstrapped(true);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  // After the PermissionsScreen reports completion, re-fetch permission
  // status + GPS fix so the downstream AppInitializer receives fresh
  // locationData (otherwise it sees the cold-boot snapshot taken before
  // the user granted permission, and briefly shows LocationRequiredModal).
  useEffect(() => {
    if (!permissionsCompleted) return;
    (async () => {
      try {
        const result = await getPermissionAndLocation();
        setLocalPermissionData(result as PermissionAndLocation);
        setPermissionDataInAuth(result as PermissionAndLocation);
      } catch (error) {
        console.warn('Failed to re-fetch location after permissions:', error);
      } finally {
        setLocationRefreshed(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsCompleted]);

  // Note: Notifications are set up in PermissionsScreen.handlePermission when user grants permissions
  // If user skips, notifications are not set up

  // CASE 1: Permissions not completed - show permissions screen first (for all users)
  if (!permissionsCompleted) {
    return <PermissionsScreen onPermissionsComplete={() => setPermissionsCompleted(true)} />;
  }

  // CASE 2: New user - show registration (after permissions are completed)
  if (isNewUser) {
    return (
      <Registration
        onRegistrationSuccess={async () => {
          if (permissionData?.location) {
            updateDeviceInfo(
              permissionData.location.longitude,
              permissionData.location.latitude
            ).catch(error => {
              console.warn('Failed to update device info after registration:', error);
            });
          }
        }}
      />
    );
  }

  // CASE 2.5: While bootstrapping location/permission data, avoid mounting children
  if (!bootstrapped) {
    return <HomeScreenSkeleton />;
  }

  // CASE 2.55: Permissions just completed but the post-permission location
  // re-fetch hasn't finished yet. Hold AppInitializer mount so it doesn't
  // see stale permissionData. Only show the "Detecting your location"
  // indicator when permission was actually granted — if the user denied or
  // skipped, there's nothing to detect, so fall through to the skeleton.
  if (permissionsCompleted && !locationRefreshed) {
    if (isGranted && !hasSkippedLocation) {
      return <LocationResolvingIndicator />;
    }
    return <HomeScreenSkeleton />;
  }

  // CASE 2.6: Error while bootstrapping location/permission data
  if (bootError) {
    return <ErrorState onRetry={bootstrap} title="Initialization Failed" message={bootError} />;
  }

  // CASE 3: User authenticated and permissions completed - show main app
  return (
    <AppInitializer locationData={permissionData}>
      <AppStack />
    </AppInitializer>
  );
};

const styles = StyleSheet.create({
  locationOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  locationCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
  locationIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
    textAlign: 'center',
  },
  locationSpinner: {
    marginTop: 4,
  },
});

export default AppBootstrap;
