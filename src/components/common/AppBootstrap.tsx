import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { PermissionAndLocation, useLocation } from '../../hooks/Permissions/useLocation';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { AppStack } from '../../routes/AppStack';
import Registration from '../../screens/Login/Registration';
import PermissionsScreen from '../../screens/permission/PermissionsScreen';
import AppInitializer from './AppInitializer';
import ErrorState from './ErrorState';
import { HomeScreenSkeleton } from './skeleton';

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
  const { getPermissionAndLocation, isDenied, isBlocked, handleDeniedPermissionModal } = useLocation();
  const [permissionData, setLocalPermissionData] = useState<PermissionAndLocation | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const { setPermissionDataInAuth } = useAuth();
  const [bootError, setBootError] = useState<string | null>(null);
  const { updateDeviceInfo } = useDeviceInfo();
  const modalShownRef = useRef(false);

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
