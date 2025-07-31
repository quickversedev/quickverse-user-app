import { createStackNavigator } from '@react-navigation/stack';
import React, { useState } from 'react';
import { AppInitializer } from '../components/common';
import { useAuth } from '../contexts/login/AuthProvider';
import ProfileStack from '../navigation/profileNavigation';
import TabNavigation from '../navigation/TabNavigation';
import CartScreen from '../screens/cart/CartScreen';
import CouponsScreen from '../screens/cart/CouponsScreen';
import Registration from '../screens/login/Registration';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import PermissionsScreen from '../screens/permission/PermissionsScreen';
import VendorProduct from '../screens/vendor/VendorProduct';
import VendorProfile from '../screens/vendor/VendorProfile';
import { Vendor } from '../types/vendor';

export type RootStackParamList = {
  MainApp: undefined;
  Profile: undefined;
  VendorProduct: { vendor: Vendor };
  VendorProfile: { vendor: Vendor };
  Cart: { cartId: string } | undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  Coupons: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppStack = () => {
  const { isNewUser } = useAuth();

  const [permissionsCompleted, setPermissionsCompleted] = useState(false);

  if (isNewUser) {
    return <Registration />;
  }

  // Show permission screen after registration for new users
  if (!permissionsCompleted) {
    return <PermissionsScreen onPermissionsComplete={() => setPermissionsCompleted(true)} />;
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
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Coupons" component={CouponsScreen} />
      </Stack.Navigator>
    </AppInitializer>
  );
};
