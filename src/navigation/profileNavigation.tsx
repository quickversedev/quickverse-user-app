import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AddressScreen from '../screens/profile/Address/AddressScreen';
import OrdersScreen from '../screens/profile/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/profileScreen';

const Stack = createStackNavigator();

// Slide from right animation
const slideFromRightOptions = {
  animationEnabled: true,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: { animation: 'timing' as const, config: { duration: 250 } },
    close: { animation: 'timing' as const, config: { duration: 200 } },
  },
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressScreen} options={slideFromRightOptions} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={slideFromRightOptions} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
