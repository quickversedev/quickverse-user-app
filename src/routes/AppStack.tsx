import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { AppInitializer } from '../components/common';
import { useAuth } from '../contexts/login/AuthProvider';
import { useLocation } from '../hooks/Permissions/useLocation';
import { useNotifications } from '../hooks/useNotifications';
import ProfileStack from '../navigation/profileNavigation';
import TabNavigation from '../navigation/TabNavigation';
import CartScreen from '../screens/cart/CartScreen';
import Registration from '../screens/login/Registration';
import VendorProduct from '../screens/vendor/VendorProduct';
import VendorProfile from '../screens/vendor/VendorProfile';
import { Vendor } from '../types/vendor';

export type RootStackParamList = {
  MainApp: undefined;
  Profile: undefined;
  VendorProduct: { vendor: Vendor };
  VendorProfile: { vendor: Vendor };
  Cart: { cartId: string } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppStack = () => {
  const { isDenied, handleDeniedPermissionModal } = useLocation();
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
    <AppInitializer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainApp" component={TabNavigation} />
        <Stack.Screen name="Profile" component={ProfileStack} />
        <Stack.Screen name="VendorProduct" component={VendorProduct} />
        <Stack.Screen name="VendorProfile" component={VendorProfile} />
        <Stack.Screen name="Cart" component={CartScreen} />
      </Stack.Navigator>
    </AppInitializer>
  );
};
