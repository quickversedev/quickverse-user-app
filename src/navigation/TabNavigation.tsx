import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { createContext, useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CartScreen from '../screens/cart/CartScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import { useTheme } from '../theme/ThemeContext';

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

  return (
    <TabBarVisibilityContext.Provider value={{ scrollY, tabBarHeight: TAB_BAR_HEIGHT, tabBarTranslateY, fullTabBarHeight }}>
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
          tabBarActiveTintColor: getColor('primary'),
          tabBarInactiveTintColor: getColor('subText'),
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          lazy: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home-variant" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cart-outline" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="compass-outline" size={24} color={color} />
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
