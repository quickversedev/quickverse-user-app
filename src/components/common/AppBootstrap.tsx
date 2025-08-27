import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { AppStack } from '../../routes/AppStack';

import { useNotifications } from '../../hooks';
import { PermissionAndLocation, useLocation } from '../../hooks/Permissions/useLocation';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import Registration from '../../screens/login/Registration';
import PermissionsScreen from '../../screens/permission/PermissionsScreen';
import AppInitializer from './AppInitializer';
import ErrorState from './ErrorState';
import { HomeScreenSkeleton } from './skeleton';

/**
 * AppBootstrap Component
 *
 * This component handles the conditional rendering of different app states:
 * 1. Registration - for new users
 * 2. PermissionsScreen - for users who need to grant permissions
 * 3. AppInitializer + AppStack - for authenticated users with permissions
 *
 * Flow:
 * - New users → Registration
 * - After registration → PermissionsScreen
 * - After permissions → AppInitializer + AppStack
 */
const AppBootstrap: React.FC = () => {
  const { isNewUser, authData } = useAuth();
  const [permissionsCompleted, setPermissionsCompleted] = useState(false);
  const { getPermissionAndLocation } = useLocation();
  const [permissionData, setLocalPermissionData] = useState<PermissionAndLocation | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const { setPermissionDataInAuth } = useAuth();
  const [bootError, setBootError] = useState<string | null>(null);
  const { updateDeviceInfo } = useDeviceInfo();
  const { setupNotifications } = useNotifications();
  const [notificationCleanup, setNotificationCleanup] = useState<(() => void) | null>(null);

  const bootstrap = async () => {
    setBootError(null);
    try {
      const result = await getPermissionAndLocation();
      console.log('jwt', authData?.jwt);
      setLocalPermissionData(result as PermissionAndLocation);
      setPermissionDataInAuth(result as PermissionAndLocation);

      // Setup notifications
      try {
        const cleanup = await setupNotifications();
        if (cleanup) {
          setNotificationCleanup(() => cleanup);
        }
      } catch (error) {
        console.warn('Failed to setup notifications during bootstrap:', error);
      }

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

  // Cleanup notifications on unmount
  useEffect(() => {
    return () => {
      if (notificationCleanup) {
        notificationCleanup();
      }
    };
  }, [notificationCleanup]);
  // CASE 1: New user - show registration
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

  // CASE 2: User exists but permissions not completed - show permissions screen
  if (isNewUser && !permissionsCompleted) {
    return <PermissionsScreen onPermissionsComplete={() => setPermissionsCompleted(true)} />;
  }

  // CASE 2.5: While bootstrapping location/permission data, avoid mounting children
  if (!bootstrapped) {
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

export default AppBootstrap;
