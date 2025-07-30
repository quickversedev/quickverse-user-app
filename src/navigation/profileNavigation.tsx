import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AddressScreen from '../screens/profile/Address/AddressScreen';
import ProfileScreen from '../screens/profile/profileScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';

const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
