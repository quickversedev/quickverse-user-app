import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import { useLocationPermission } from '../hooks/Permissions/usePermissions';
import { useNotifications } from '../hooks/useNotifications';
import ProfileStack from '../navigation/profileNavigation';
import TabNavigation from '../navigation/TabNavigation';
import VendorProduct from '../screens/Home/components/VendorProduct';
import VendorProfile from '../screens/Home/components/VendorProfile';
import Registration from '../screens/login/Registration';
import { Vendor } from '../types/vendor';

export type RootStackParamList = {
  MainApp: undefined;
  Profile: undefined;
  VendorProduct: { vendor: Vendor };
  VendorProfile: { vendor: Vendor };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppStack = () => {
  const { isDenied, handleDeniedPermissionModal } = useLocationPermission();
  const { isNewUser } = useAuth();
  const { requestPermissions } = useNotifications();

  useEffect(() => {
    if (isDenied) {
      handleDeniedPermissionModal();
    }
    requestPermissions();
  }, [handleDeniedPermissionModal, isDenied, requestPermissions]);

  if (isNewUser) {
    return <Registration />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainApp" component={TabNavigation} />
      <Stack.Screen name="Profile" component={ProfileStack} />
      <Stack.Screen name="VendorProduct" component={VendorProduct} />
      <Stack.Screen name="VendorProfile" component={VendorProfile} />
    </Stack.Navigator>
  );
};
