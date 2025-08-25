import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { AppStack } from '../../routes/AppStack';

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
  const [bootLoading, setBootLoading] = useState(false);
  const { setPermissionDataInAuth } = useAuth();
  const [bootError, setBootError] = useState<string | null>(null);
  const { updateDeviceInfo } = useDeviceInfo();
  const bootstrap = async () => {
    setBootLoading(true);
    setBootError(null);
    console.log('bootstrap', authData?.jwt);
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
      setBootLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);
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
  if (bootLoading) {
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
