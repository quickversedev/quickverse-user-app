import {
  CardStyleInterpolators,
  createStackNavigator,
  TransitionSpecs,
} from '@react-navigation/stack';
import React from 'react';
import { Platform } from 'react-native';
import ProfileStack from '../navigation/profileNavigation';
import TabNavigation from '../navigation/TabNavigation';
import CartScreen from '../screens/cart/CartScreen';
import CouponsScreen from '../screens/cart/CouponsScreen';
import OrderDetailsScreen from '../screens/profile/orders/OrderDetailsScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ProductDetailDemo from '../screens/vendor/ProductDetailDemo';
import VendorDetails from '../screens/vendor/VendorDetails';
import VendorProduct from '../screens/vendor/VendorProduct';
import VendorProfile from '../screens/vendor/VendorProfile';
import { Vendor } from '../types/vendor';

export type RootStackParamList = {
  MainApp: undefined;
  Profile: undefined;
  VendorProduct: { vendor: Vendor };
  VendorProfile: { vendor: Vendor };
  VendorDetails: { vendor: Vendor };
  ProductDetailDemo: undefined;
  Cart: { cartId: string } | undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  Coupons: undefined;
  Search: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppStack = () => {
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
      <Stack.Screen
        name="VendorDetails"
        component={VendorDetails}
        options={{
          presentation: 'modal',
          animationEnabled: true,
          gestureEnabled: true,
          gestureDirection: 'vertical-inverted',
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-layouts.screen.height, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
            },
          }),
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 280 } },
            close: { animation: 'timing', config: { duration: 240 } },
          },
        }}
      />
      <Stack.Screen name="ProductDetailDemo" component={ProductDetailDemo} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: true,
          gestureDirection: 'vertical',
          cardStyleInterpolator: Platform.select({
            ios: CardStyleInterpolators.forVerticalIOS,
            android: CardStyleInterpolators.forFadeFromBottomAndroid,
            default: CardStyleInterpolators.forFadeFromBottomAndroid,
          }),
          transitionSpec: Platform.select({
            ios: {
              open: TransitionSpecs.TransitionIOSSpec,
              close: TransitionSpecs.TransitionIOSSpec,
            },
            android: {
              open: TransitionSpecs.FadeInFromBottomAndroidSpec,
              close: TransitionSpecs.FadeOutToBottomAndroidSpec,
            },
            default: {
              open: TransitionSpecs.FadeInFromBottomAndroidSpec,
              close: TransitionSpecs.FadeOutToBottomAndroidSpec,
            },
          }),
        }}
      />
    </Stack.Navigator>
  );
};
