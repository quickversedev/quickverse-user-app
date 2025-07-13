import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AddressScreen from '../screens/profile/Address/AddressScreen';
import ProfileScreen from '../screens/profile/profileScreen';

const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressScreen} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
