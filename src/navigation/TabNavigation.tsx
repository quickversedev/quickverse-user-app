import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { createContext, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CartScreen from '../screens/cart/CartScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import HomeStack from './HomeStack';
import useCartStore from '../store/cart/cartStore';
import { useTheme } from '../theme/ThemeContext';
import HomeFilled from '../assets/svg/bottom-navBar/homeIcon/homeIcon_filled.svg';
import HomeOutline from '../assets/svg/bottom-navBar/homeIcon/homeIcon_outline.svg';
import CartFilled from '../assets/svg/bottom-navBar/cartIcon/cartIcon_filled.svg';
import CartOutline from '../assets/svg/bottom-navBar/cartIcon/cartIcon_outline.svg';
import ExploreFilled from '../assets/svg/bottom-navBar/exploreIcon/exploreIcon_filled.svg';
import ExploreOutline from '../assets/svg/bottom-navBar/exploreIcon/exploreIcon_outline.svg';

export const TabBarVisibilityContext = createContext<{
  scrollY: Animated.Value;
  tabBarHeight: number;
  tabBarTranslateY: Animated.Value;
  fullTabBarHeight: number;
} | null>(null);

const Tab = createBottomTabNavigator();
const TAB_BAR_HEIGHT = 50;
const SCROLL_THRESHOLD = 10;

const TabNavigation = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const { getColor } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;
  const fullTabBarHeight = TAB_BAR_HEIGHT + bottomInset;

  const carts = useCartStore(state => state.carts);
  const cartItemCount = useMemo(
    () =>
      Object.values(carts).reduce(
        (sum, cart) =>
          sum +
          Object.values(cart?.products ?? {}).reduce((s, p) => s + Number(p?.quantity ?? 0), 0),
        0
      ),
    [carts]
  );

  return (
    <TabBarVisibilityContext.Provider
      value={{ scrollY, tabBarHeight: TAB_BAR_HEIGHT, tabBarTranslateY, fullTabBarHeight }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              transform: [{ translateY: tabBarTranslateY }],
              backgroundColor: getColor('tabBackground'),
              borderTopColor: getColor('border'),
              height: TAB_BAR_HEIGHT + bottomInset,
              paddingBottom: bottomInset,
            },
          ],
          tabBarActiveTintColor: '#003F66',
          tabBarInactiveTintColor: '#003F66',
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          lazy: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <HomeFilled width={24} height={24} fill={color} />
              ) : (
                <HomeOutline width={24} height={24} stroke={color} />
              ),
          }}
        />

        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <CartFilled width={24} height={24} fill={color} />
              ) : (
                <CartOutline width={24} height={24} stroke={color} />
              ),
          }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <ExploreFilled width={24} height={24} fill={color} />
              ) : (
                <ExploreOutline width={24} height={24} stroke={color} />
              ),
          }}
        />
      </Tab.Navigator>
    </TabBarVisibilityContext.Provider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },
});

export default TabNavigation;
