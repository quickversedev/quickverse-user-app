import {
  CardStyleInterpolators,
  createStackNavigator,
  TransitionSpecs,
} from '@react-navigation/stack';
import React from 'react';
import CollectionProductScreen from '../screens/Category/CollectionProductScreen'; // Import added
import { Platform } from 'react-native';
import { Collection } from '../data/collectionsData';
import ProfileStack from '../navigation/profileNavigation';
import TabNavigation from '../navigation/TabNavigation';
import CouponsScreen from '../screens/cart/CouponsScreen';
import CollectionDetailScreen from '../screens/collections/CollectionDetailScreen';
import OrderFailureScreen from '../screens/order/OrderFailureScreen';
import OrderSuccessScreen from '../screens/order/OrderSuccessScreen';
import AboutUsScreen from '../screens/profile/AboutUsScreen';
import AddressScreen from '../screens/profile/Address/AddressScreen';
import HelpDeskScreen from '../screens/profile/HelpDeskScreen';
import OrderDetailsScreen from '../screens/profile/orders/OrderDetailsScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ProductDetailDemo from '../screens/vendor/ProductDetailDemo';
import VendorDetails from '../screens/vendor/VendorDetails';
import VendorProduct from '../screens/vendor/VendorProduct';
import VendorProfile from '../screens/vendor/VendorProfile';
import { Order } from '../types/order';
import { Vendor } from '../types/vendor';

export type RootStackParamList = {
  MainApp: undefined;
  Profile: undefined;
  VendorProduct: { vendor: Vendor; searchQuery?: string };
  VendorProfile: { vendor: Vendor };
  VendorDetails: { vendor: Vendor };
  CollectionProduct: { collection: Collection; vendor?: Vendor; shopId?: string }; // Params added
  CollectionDetail: { collection: Collection };
  ProductDetailDemo: undefined;
  Cart: { cartId: string } | undefined;
  Orders: undefined;
  OrderDetails: { orderId: string; order: Order };
  OrderSuccess: { orderId: string; amount: number; date: string; shopId?: string };
  OrderFailure: { errorMessage?: string };
  Coupons: undefined;

  Search: undefined;
  Address: undefined;
  HelpDesk: undefined;
  AboutUs: undefined;
  Category: { categoryName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

// Default screen transition animation
const defaultScreenOptions = {
  animationEnabled: true,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  cardStyleInterpolator: Platform.select({
    ios: CardStyleInterpolators.forHorizontalIOS,
    android: CardStyleInterpolators.forRevealFromBottomAndroid,
    default: CardStyleInterpolators.forHorizontalIOS,
  }),
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
};

// Slide from right animation (for most screens)
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

// Slide up animation (for Cart, modals)
const slideFromBottomOptions = {
  animationEnabled: true,
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  transitionSpec: {
    open: { animation: 'timing' as const, config: { duration: 280 } },
    close: { animation: 'timing' as const, config: { duration: 220 } },
  },
};

export const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...defaultScreenOptions,
      }}
    >
      <Stack.Screen name="MainApp" component={TabNavigation} />
      <Stack.Screen
        name="Profile"
        component={ProfileStack}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="VendorProduct"
        component={VendorProduct}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="VendorProfile"
        component={VendorProfile}
        options={slideFromRightOptions}
      />
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
      <Stack.Screen
        name="CollectionDetail"
        component={CollectionDetailScreen}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="CollectionProduct"
        component={CollectionProductScreen}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="ProductDetailDemo"
        component={ProductDetailDemo}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: false,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        }}
      />
      <Stack.Screen
        name="OrderFailure"
        component={OrderFailureScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: false,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        }}
      />
      <Stack.Screen
        name="Coupons"
        component={CouponsScreen}
        options={slideFromBottomOptions}
      />

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
      <Stack.Screen
        name="Address"
        component={AddressScreen}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="HelpDesk"
        component={HelpDeskScreen}
        options={slideFromRightOptions}
      />
      <Stack.Screen
        name="AboutUs"
        component={AboutUsScreen}
        options={slideFromRightOptions}
      />
    </Stack.Navigator>
  );
};
