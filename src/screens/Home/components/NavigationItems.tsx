import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { useTab } from '../../../contexts/TabContext';
import { useTheme } from '../../../theme/ThemeContext';

type NavigationItem = {
  id: string;
  label: string;
  icon: string;
  screen: 'HomeMain' | 'ForYou' | 'food' | 'Grocery' | 'Collections' | 'Pharmacy';
};

const navigationItems: NavigationItem[] = [
  { id: 'for-you', label: 'For You', icon: 'star-four-points', screen: 'ForYou' },
  { id: 'food', label: 'Food', icon: 'food-turkey', screen: 'food' },
  { id: 'grocery', label: 'Grocery', icon: 'shopping-outline', screen: 'Grocery' },
  { id: 'collections', label: 'Collections', icon: 'view-grid', screen: 'Collections' },
  // { id: 'pharmacy', label: 'Pharmacy', icon: 'pharmacy', screen: 'Pharmacy' },
];

export const NavigationItems = () => {
  const { theme, getColor } = useTheme();
  const { selectedTab, setSelectedTab } = useTab();
  const activeColor = getColor('main');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {navigationItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, selectedTab === item.screen && styles.selectedItem]}
          onPress={() => setSelectedTab(item.screen)}
        >
          <View style={styles.tabContent}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={selectedTab === item.screen ? activeColor : theme.colors.subText}
            />
            <ThemeText
              variant="caption"
              color={selectedTab === item.screen ? activeColor : theme.colors.subText}
              style={styles.label}
            >
              {item.label}
            </ThemeText>
          </View>
          {selectedTab === item.screen && (
            <View style={[styles.selectedIndicator, { backgroundColor: activeColor }]} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingTop: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 8,
  },
  item: {
    flex: 1,
    position: 'relative',
    height: 55,
  },
  selectedItem: {
    transform: [{ scale: 1.05 }],
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -3, // Position it to overlap the border
    left: 0,
    right: 0,
    height: 4,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
});
