import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { createContext, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DummyScreen1 from '../screens/Home/DummyScreen1';
import DummyScreen2 from '../screens/Home/DummyScreen2';
import HomeScreen from '../screens/Home/HomeScreen';
import { useTheme } from '../theme/ThemeContext';

export const TabBarVisibilityContext = createContext<{
  scrollY: Animated.Value;
  tabBarHeight: number;
} | null>(null);

const Tab = createBottomTabNavigator();
const TAB_BAR_HEIGHT = 60;
const SCROLL_THRESHOLD = 10;

const TabNavigation = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const { getColor } = useTheme();
  console.log('TabNavigation');
  const showTabBar = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Animated.spring(tabBarTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start(() => {
      isAnimating.current = false;
    });
  };

  const hideTabBar = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Animated.spring(tabBarTranslateY, {
      toValue: TAB_BAR_HEIGHT,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start(() => {
      isAnimating.current = false;
    });
  };

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      // Always show tab bar when at the top
      if (value <= 0) {
        showTabBar();
        lastScrollY.current = value;
        return;
      }

      const diff = value - lastScrollY.current;

      // Only trigger animation if scroll distance exceeds threshold
      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        if (diff > 0) {
          // Scrolling up (content moving up) - hide tab bar
          hideTabBar();
        } else {
          // Scrolling down (content moving down) - show tab bar
          showTabBar();
        }
      }

      lastScrollY.current = value;
    });

    return () => {
      scrollY.removeListener(listenerId);
    };
  }, []);

  return (
    <TabBarVisibilityContext.Provider value={{ scrollY, tabBarHeight: TAB_BAR_HEIGHT }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              transform: [{ translateY: tabBarTranslateY }],
              backgroundColor: getColor('tabBackground'),
              borderTopColor: getColor('border'),
            },
          ],
          tabBarActiveTintColor: getColor('primary'),
          tabBarInactiveTintColor: getColor('subText'),
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="For You"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home" color={color} size={24} />
            ),
          }}
        />
        <Tab.Screen
          name="Food"
          component={DummyScreen1}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="food" color={color} size={24} />
            ),
          }}
        />
        <Tab.Screen
          name="Grocery"
          component={DummyScreen2}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cart" color={color} size={24} />
            ),
          }}
        />
      </Tab.Navigator>
    </TabBarVisibilityContext.Provider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: TAB_BAR_HEIGHT,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default TabNavigation;
