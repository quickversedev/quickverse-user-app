import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';

import { SearchBar } from '../../components/modules/Header/SearchBar';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAppStateRefresh } from '../../hooks/useAppStateRefresh';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import CategoryCards from './components/CategoryCards';
import FastPicks from './components/FastPicks';
import HomeHeader from './components/HomeHeader';
import HomePromotionCarousel from './components/HomePromotionCarousel';
import TopStoresNearYou from './components/TopStoresNearYou';

const HomeMainScreen_2 = React.memo(() => {
  const { theme } = useTheme();
  const { getVendorsNearLocation } = useVendorStore();
  const { selectedAddress } = useAuth();

  // Auto-refresh vendors when app comes back from background
  useAppStateRefresh({
    onForeground: async () => {
      try {
        if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
          // Refresh vendors for current location
          getVendorsNearLocation({
            latitude: selectedAddress.coordinates.latitude,
            longitude: selectedAddress.coordinates.longitude,
            radius: 5,
          });
        }
      } catch (error) {
        console.warn('Error refreshing vendors on home screen:', error);
      }
    },
    refreshThreshold: 100000, // Refresh after 100 seconds in background
  });

  const navigation = useNavigation<AppNavigationProp>();

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HomeHeader />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.carouselContainer}>
            <HomePromotionCarousel />
          </View>

          <View style={styles.searchContainer}>
            <SearchBar onPress={handleSearchPress} />
          </View>

          <TopStoresNearYou />

          <View style={styles.cardsContainer}>
            <CategoryCards />
          </View>

          <FastPicks />
        </ScrollView>
      </View>

      <FloatingCartsStack />
    </SafeAreaView>
  );
});

HomeMainScreen_2.displayName = 'HomeMainScreen_2';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 185,
  },
  carouselContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  cardsContainer: {},
});

export default HomeMainScreen_2;
