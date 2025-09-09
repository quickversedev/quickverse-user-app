import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icons } from '../../../assets';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { useTab } from '../../../contexts/TabContext';
import { useTheme } from '../../../theme/ThemeContext';

type NavigationItem = {
  id: string;
  label: string;
  icon: ImageSourcePropType;
  screen: 'HomeMain' | 'ForYou' | 'food' | 'Grocery' | 'Pharmacy';
};

const navigationItems: NavigationItem[] = [
  { id: 'for-you', label: 'For You', icon: Icons.forYouIcon, screen: 'ForYou' },
  { id: 'food', label: 'Food', icon: Icons.foodIcon, screen: 'food' },
  { id: 'grocery', label: 'Grocery', icon: Icons.bottle, screen: 'Grocery' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Icons.pharmacyIcon, screen: 'Pharmacy' },
];

const ACTIVE_COLOR = '#FFD700'; // Brighter gold for active state

export const NavigationItems = () => {
  const { theme } = useTheme();
  const { selectedTab, setSelectedTab } = useTab();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {navigationItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, selectedTab === item.screen && styles.selectedItem]}
          onPress={() => setSelectedTab(item.screen)}
        >
          <View style={styles.tabContent}>
            <Image
              source={item.icon}
              style={{
                width: 24,
                height: 24,
                tintColor: selectedTab === item.screen ? ACTIVE_COLOR : theme.colors.subText,
              }}
            />
            <ThemeText
              variant="caption"
              color={selectedTab === item.screen ? ACTIVE_COLOR : theme.colors.subText}
              style={styles.label}
            >
              {item.label}
            </ThemeText>
          </View>
          {selectedTab === item.screen && (
            <View style={[styles.selectedIndicator, { backgroundColor: ACTIVE_COLOR }]} />
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
