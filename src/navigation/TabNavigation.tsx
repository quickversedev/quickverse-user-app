import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { createContext, useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from '../assets';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import { useTheme } from '../theme/ThemeContext';

export const TabBarVisibilityContext = createContext<{
  scrollY: Animated.Value;
  tabBarHeight: number;
} | null>(null);

const Tab = createBottomTabNavigator();
const TAB_BAR_HEIGHT = 50;
const SCROLL_THRESHOLD = 10;

const TabNavigation = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const { getColor } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;
  const fullTabBarHeight = TAB_BAR_HEIGHT + bottomInset;

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
      toValue: fullTabBarHeight,
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
              height: TAB_BAR_HEIGHT + bottomInset,
              paddingBottom: bottomInset,
            },
          ],
          tabBarActiveTintColor: getColor('primary'),
          tabBarInactiveTintColor: getColor('subText'),
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={Icons.home}
                style={{
                  width: 22,
                  height: 22,
                  tintColor: color,
                }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={Icons.explore}
                style={{
                  width: 22,
                  height: 22,
                  tintColor: color,
                }}
              />
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
    elevation: 0,
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
