import React from 'react';
import { Animated, Image, Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { NavigationItems } from '../../../screens/Home/components/NavigationItems';
import { useTheme } from '../../../theme/ThemeContext';
import { LocationSelector } from './LocationSelector';
import { ProfileIcon } from './ProfileIcon';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  translateY?: Animated.AnimatedInterpolation<number>;
  hiddenSectionsOpacity?: Animated.AnimatedInterpolation<number>;
}

export const Header: React.FC<HeaderProps> = ({ translateY, hiddenSectionsOpacity }) => {
  const { theme } = useTheme();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        translateY ? { transform: [{ translateY }] } : undefined,
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Sections that will be hidden on scroll */}
        <Animated.View
          style={[
            styles.hiddenSections,
            hiddenSectionsOpacity ? { opacity: hiddenSectionsOpacity } : undefined,
          ]}
        >
          {/* Section 1: Top Row */}
          <View style={styles.topRow}>
            <LocationSelector />
            <ProfileIcon />
          </View>

          {/* Section 3: Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/homeBackground.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Sections that will remain visible */}
        <View style={styles.visibleSections}>
          {/* Section 2: Search Bar */}
          <View style={styles.searchSection}>
            <SearchBar />
          </View>

          {/* Section 4: Navigation Tabs */}
          <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
            <NavigationItems />
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight - 15 : 0,
      },
      ios: {
        paddingTop: 0,
      },
    }),
  },
  safeArea: {
    width: '100%',
  },
  hiddenSections: {
    paddingHorizontal: 16,
  },
  visibleSections: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.select({
      ios: 2,
      android: 0,
    }),
  },
  searchSection: {
    width: '100%',
    paddingHorizontal: 16,
  },
  logoContainer: {
    width: '100%',
    height: Platform.select({
      ios: 150,
      android: 130,
    }),
    marginHorizontal: -16,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tabContainer: {
    borderBottomWidth: 3,
  },
});
