import React, { useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { AppStack } from '../../routes/AppStack';

import Registration from '../../screens/login/Registration';
import PermissionsScreen from '../../screens/permission/PermissionsScreen';
import AppInitializer from './AppInitializer';

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
  const { isNewUser } = useAuth();
  const [permissionsCompleted, setPermissionsCompleted] = useState(false);

  // CASE 1: New user - show registration
  if (isNewUser) {
    return <Registration />;
  }

  // CASE 2: User exists but permissions not completed - show permissions screen
  if (!permissionsCompleted) {
    return <PermissionsScreen onPermissionsComplete={() => setPermissionsCompleted(true)} />;
  }

  // CASE 3: User authenticated and permissions completed - show main app
  return (
    <AppInitializer>
      <AppStack />
    </AppInitializer>
  );
};

export default AppBootstrap;
