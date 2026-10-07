import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';

import { SearchBar } from '../../components/modules/Header/SearchBar';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAppStateRefresh } from '../../hooks/useAppStateRefresh';
import useCartStore from '../../store/cart/cartStore';
import useOrderStore from '../../store/cart/orderStore';
import useConfigStore from '../../store/configStore';
import usePagesStore from '../../store/pages/pagesStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import CategoryCards from './components/CategoryCards';
import FastPicks from './components/FastPicks';
import DailyEssentials from '../Category/components/DailyEssentials';
import useCatalogGroupsStore from '../../store/grocery/catalogGroupsStore';
import HomeGradientBand from './components/HomeGradientBand';
import HomeHeader from './components/HomeHeader';
import HomePromotionCarousel from './components/HomePromotionCarousel';
import TopStoresNearYou from './components/TopStoresNearYou';
import type { HomeCategoryId } from './homeCategories';

const HomeMainScreen_2 = React.memo(() => {
  const { theme } = useTheme();
  const { getVendorsNearLocation } = useVendorStore();
  const {config} = useConfigStore();
  const { selectedAddress } = useAuth();

  console.log("CONFiG", config?.regionId);

  const activeCategoryId: HomeCategoryId = 'grocery';

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
        // Banners are server-driven and edited in the admin dashboard, but the pages
        // cache has a 30-minute TTL and there is no pull-to-refresh on this screen —
        // so without this a poster change was invisible until the cache expired or the
        // app's data was cleared. Returning to the app is the natural moment to refresh.
        const regionId = useConfigStore.getState().getRegionId();
        if (regionId) {
          usePagesStore.getState().invalidateCache();
          await usePagesStore.getState().fetchPages(regionId);
        }
      } catch (error) {
        console.warn('Error refreshing home screen content:', error);
      }
    },
    refreshThreshold: 100000, // Refresh after 100 seconds in background
  });

  const navigation = useNavigation<AppNavigationProp>();

  const carts = useCartStore(s => s.carts);
  const orders = useOrderStore(s => s.orders);
  const hasFloatingCards = useMemo(() => {
    const hasNonEmptyCart = Object.values(carts).some(
      cart => Object.values(cart.products || {}).reduce((sum, p) => sum + (p?.quantity || 0), 0) > 0
    );
    const hasActiveOrder = orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled');
    return hasNonEmptyCart || hasActiveOrder;
  }, [carts, orders]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  /**
   * Pull-to-refresh. This screen had none, and the only other refresh path is
   * useAppStateRefresh's 100-second background threshold — far too coarse for
   * server-driven content edited in the admin dashboard, where a banner change
   * was otherwise invisible until the 30-minute pages cache expired.
   */
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const regionId = useConfigStore.getState().getRegionId();
      if (regionId) {
        usePagesStore.getState().invalidateCache();
        await usePagesStore.getState().fetchPages(regionId);
      }
      useVendorStore.getState().invalidateCache();
      // Daily Essentials: admin's latest groups and tiles, for the same place and region.
      useCatalogGroupsStore.getState().refresh();
      if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
        await getVendorsNearLocation({
          latitude: selectedAddress.coordinates.latitude,
          longitude: selectedAddress.coordinates.longitude,
          radius: 5,
        });
      } else {
        // No delivery address picked yet (e.g. a guest who skipped login). Fall back to
        // whatever location the current list was fetched with, so pull-to-refresh still
        // works rather than silently doing nothing.
        const lastLocation = useVendorStore.getState().userLocation;
        await useVendorStore.getState().fetchVendors(lastLocation ?? undefined);
      }
    } catch (error) {
      console.warn('Error refreshing home screen:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedAddress, getVendorsNearLocation]);

  return (
    /**
     * edges={['bottom']} — the top inset is applied by HomeGradientBand instead, so the
     * gradient reaches pixel 0 behind a translucent status bar rather than being clipped
     * below a flat safe-area strip.
     */
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: hasFloatingCards ? 130 : 50 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          <HomeGradientBand activeId={activeCategoryId}>
            <HomeHeader />

            {!config?.regionId ? (
              <View style={styles.notServiceableContainer}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="map-marker-off" size={64} color={theme.colors.text} style={{ opacity: 0.8 }} />
                </View>
                <Text style={[styles.notServiceableTitle, { color: theme.colors.text }]}>
                  Oops! Not Serviceable
                </Text>
                <Text style={[styles.notServiceableSub, { color: theme.colors.text }]}>
                  We don't deliver in this area yet. Please select a different location.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.searchCarouselContainer}>
                  <View style={styles.searchOverlay}>
                    <SearchBar onPress={handleSearchPress} />
                  </View>
                  <HomePromotionCarousel />
                </View>

                <TopStoresNearYou />
              </>
            )}
            </HomeGradientBand>

          {config?.regionId ? (
            <>
              <View style={styles.cardsContainer}>
                <CategoryCards />
              </View>

              <FastPicks />

              {/* The same Daily Essentials catalogue as the Daily Needs screen; a tile opens
                  that group as a store. Hidden when the area has none. */}
              <DailyEssentials gutter={16} />
            </>
          ) : null}
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
  searchCarouselContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    marginTop: 2,
  },
  notServiceableContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  notServiceableTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  notServiceableSub: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
});

export default HomeMainScreen_2;
