import Feather from '@react-native-vector-icons/feather';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import SectionDivider from '../../components/common/SectionDivider';
import CollectionShowcaseWidget from '../../components/modules/Collection/CollectionShowcaseWidget';
import { SearchBar } from '../../components/modules/Header/SearchBar';
import VendorCard2 from '../../components/modules/Vendor/VendorCard2'; // Updated to V2
import VendorShowcaseWidget from '../../components/modules/Vendor/VendorShowcaseWidget';
import {
  API_STORE_ID,
  Collection,
  fetchCollectionsFromApi,
  getCachedCollections,
} from '../../data/collectionsData';
import { RootStackParamList } from '../../routes/AppStack';
import useVendorStore from '../../store/vendorStore';
import usePagesStore from '../../store/pages/pagesStore';
import useConfigStore from '../../store/configStore';
import { Vendor } from '../../types/vendor';
import PromotionCarousel from '../Home/components/PromotionCarousel';
import CollectionsGrid from './components/CollectionsGrid';
import CollectionsGridSkeleton from './components/CollectionsGridSkeleton';
import TagStrip from '../Home/components/TagStrip';
import QuickSearchStrip from './components/QuickSearchStrip';

type CategoryScreenRouteProp = RouteProp<RootStackParamList, 'Category'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHOWCASE_CARD_WIDTH = SCREEN_WIDTH * 0.85;

const CategoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<CategoryScreenRouteProp>();

  // Default to Food if no params (for testing/safety)
  const categoryName = route.params?.categoryName || 'Food';
  const isGrocery = categoryName.toLowerCase().includes('grocery');

  const vendors = useVendorStore(state => state.vendors);
  const getVendorsByCategory = useVendorStore(state => state.getVendorsByCategory);
  const getVendorById = useVendorStore(state => state.getVendorById);

  /**
   * Pull-to-refresh. Both things this screen renders are server-driven and edited in
   * the admin dashboard — the poster carousel (pages) and the two-row Browse stores
   * grid (vendors) — and both sit behind caches (30 min / 10 min). Without a refresh
   * gesture a change was invisible until the TTL expired or app data was cleared.
   */
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const regionId = useConfigStore.getState().getRegionId();
      if (regionId) {
        usePagesStore.getState().invalidateCache();
        await usePagesStore.getState().fetchPages(regionId);
      }
      // Reuse the location the current list was fetched with, so refreshing never
      // silently changes which vendors are in range.
      const lastLocation = useVendorStore.getState().userLocation;
      useVendorStore.getState().invalidateCache();
      await useVendorStore.getState().fetchVendors(lastLocation ?? undefined);
    } catch (error) {
      console.warn('Error refreshing category screen:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const categoryVendors = React.useMemo(() => {
    return getVendorsByCategory(categoryName).filter(
      vendor => vendor.storeEnabled !== false && vendor.storeActive !== false
    );
  }, [categoryName, getVendorsByCategory, vendors]);

  // Show the showcase widget for Shree Samarth Foods (94728). Falls back to
  // the first grocery vendor if 94728 isn't in the list.
  const showcaseVendors = React.useMemo(() => {
    if (!isGrocery) return categoryVendors;
    return categoryVendors.filter(v => v.shopId !== '68246').reverse();
  }, [isGrocery, categoryVendors]);

  const browseColumns = React.useMemo(() => {
    // Row 1 arrives pre-sorted by displayOrder from /v3/shops. Row 2 does not:
    // the query only orders by displayOrder, so its members would otherwise keep
    // that order instead of their own sequence. Sort them here.
    const row1 = categoryVendors.filter(v => !v.displayOrderSecondary);
    const row2 = categoryVendors
      .filter(v => !!v.displayOrderSecondary)
      .sort((a, b) => {
        const av = Number(a.displayOrderSecondary);
        const bv = Number(b.displayOrderSecondary);
        if (Number.isNaN(av) || Number.isNaN(bv)) return 0;
        return av - bv;
      });
    const maxLen = Math.max(row1.length, row2.length);
    const cols: [Vendor | undefined, Vendor | undefined][] = [];
    for (let i = 0; i < maxLen; i++) {
      cols.push([row1[i], row2[i]]);
    }
    return cols;
  }, [categoryVendors]);

  const collectionsShopId = API_STORE_ID;
  const cachedCols = isGrocery ? getCachedCollections(collectionsShopId) : null;

  const [collections, setCollections] = useState<Collection[]>(cachedCols ?? []);
  const [collectionsLoading, setCollectionsLoading] = useState(isGrocery && !cachedCols);

  useEffect(() => {
    if (!isGrocery) return;
    if (getCachedCollections(collectionsShopId)) return;

    const loadCollections = async () => {
      setCollectionsLoading(true);
      try {
        const sections = await fetchCollectionsFromApi(collectionsShopId);
        if (sections.length > 0) {
          setCollections(sections[0].collections);
        } else {
          setCollections([]);
        }
      } catch {
        setCollections([]);
      } finally {
        setCollectionsLoading(false);
      }
    };

    loadCollections();
  }, [isGrocery]);

  // Cart Logic

  const handleVendorPress = (vendor: Vendor) => {
    // @ts-ignore - Assuming VendorProduct exists in stack but might not be typed yet in this file
    navigation.navigate('VendorProduct', { vendor });
  };

  const handleBannerPress = React.useCallback(
    (promo: { shopId: string }) => {
      if (!promo.shopId || promo.shopId === 'mock-shop') return;
      // Try exact match first, then loose match across all vendors
      const shopId = String(promo.shopId);
      let vendor = getVendorById(shopId);
      if (!vendor) {
        vendor = vendors.find(v => String(v.shopId) === shopId) || null;
      }
      if (vendor) {
        navigation.navigate('VendorProduct', { vendor });
      }
    },
    [getVendorById, vendors, navigation]
  );

  const restrictCategory: 'Food' | 'Grocery' = isGrocery ? 'Grocery' : 'Food';

  const handleSearchPress = React.useCallback(() => {
    navigation.navigate('Search', { restrictCategory });
  }, [navigation, restrictCategory]);

  /**
   * Quick Search chip tap. Sends restrictCategory alongside the query — it is
   * threaded through several filters in useSearch, so without it a Grocery
   * "Bread" chip would surface bakery restaurants and vice versa.
   * useCallback is required, not stylistic: headerElement is rebuilt on every
   * render, and a fresh handler would defeat QuickSearchStrip's React.memo.
   */
  const handleQuickSearchSelect = React.useCallback(
    (query: string) => {
      navigation.navigate('Search', { restrictCategory, query });
    },
    [navigation, restrictCategory]
  );

  const navigateToOtherCategory = React.useCallback(() => {
    const otherCategory = isGrocery ? 'Food' : 'Grocery';
    navigation.navigate('Category', { categoryName: otherCategory });
  }, [navigation, isGrocery]);

  const hasNoVendors = categoryVendors.length === 0;
  const otherCategoryLabel = isGrocery ? 'Food' : 'Grocery';

  const headerElement = (
    <View>
      {/* Back Button + Search Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchFlex}>
          <SearchBar
            onPress={handleSearchPress}
            placeholder={isGrocery ? "Search for 'Milk'" : "Search for 'Shawarma'"}
          />
        </View>
      </View>

      {/* Quick Search keyword chips */}
      <QuickSearchStrip category={restrictCategory} onSelect={handleQuickSearchSelect} />

      {/* Promo Banners */}
      <View style={styles.promoContainer}>
        <PromotionCarousel
          category={categoryName as 'Food' | 'Grocery'}
          onBannerPress={handleBannerPress}
        />
      </View>

      {/* Tag strip — Food only */}
      {!isGrocery && <TagStrip shopCategory={categoryName} />}

      {/* Conditional Content if Vendors Exist */}
      {!hasNoVendors && (
        <>
          {/* Collection Showcase Widgets (Grocery vendors) — horizontal scroll */}
          {isGrocery && showcaseVendors.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SHOWCASE_CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={styles.showcaseList}
            >
              {showcaseVendors.map(v => (
                <View key={v.shopId} style={styles.showcaseCard}>
                  <CollectionShowcaseWidget
                    vendor={v}
                    onPressExplore={() => handleVendorPress(v)}
                  />
                </View>
              ))}
            </ScrollView>
          )}

          {/* Collections Grid (Grocery Only) */}
          {isGrocery && collectionsLoading && <CollectionsGridSkeleton />}
          {isGrocery && !collectionsLoading && collections.length > 0 && (
            <CollectionsGrid collections={collections} shopId={collectionsShopId} />
          )}

          {/* Horizontal list of store cards */}
          {(!isGrocery || (!collectionsLoading && collections.length === 0)) && (
            <>
              <SectionDivider
                text="Browse stores"
                style={{ marginVertical: 16, paddingHorizontal: 40 }}
                textStyle={{
                  color: '#4B5563',
                  fontWeight: '600',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                }}
              />

              <FlatList
                horizontal
                data={browseColumns}
                renderItem={({ item: [top, bottom] }) => (
                  <View style={{ marginRight: 10, gap: 10 }}>
                    {top ? (
                      <VendorCard2
                        vendor={top}
                        size={(SCREEN_WIDTH - 32 - 20) / 3}
                        onPress={handleVendorPress}
                      />
                    ) : (
                      // Row 2 can be longer than row 1. Without a spacer the lone bottom
                      // card is the column's only child and rides up into the first row,
                      // so a row-2 vendor reads as a row-1 one.
                      //
                      // An invisible copy of the same card is used rather than a fixed
                      // height: VendorCard2 derives its height from the size prop plus
                      // its own footer, so any hardcoded value would drift the moment
                      // that card's layout changes.
                      bottom && (
                        <View style={{ opacity: 0 }} pointerEvents="none">
                          <VendorCard2
                            vendor={bottom}
                            size={(SCREEN_WIDTH - 32 - 20) / 3}
                            onPress={() => {}}
                          />
                        </View>
                      )
                    )}
                    {bottom && (
                      <VendorCard2
                        vendor={bottom}
                        size={(SCREEN_WIDTH - 32 - 20) / 3}
                        onPress={handleVendorPress}
                      />
                    )}
                  </View>
                )}
                keyExtractor={(_, i) => `col-${i}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
                removeClippedSubviews={true}
              />

              {/* Full store list with showcase */}
              <SectionDivider
                text="Stores for you"
                style={{ marginTop: 16, marginBottom: 4, paddingHorizontal: 40 }}
                textStyle={{
                  color: '#4B5563',
                  fontWeight: '600',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                }}
              />
            </>
          )}
        </>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateMessage}>
        No {categoryName} stores near you right now. Try browsing {otherCategoryLabel} instead.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={navigateToOtherCategory}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyStateButtonText}>Browse {otherCategoryLabel}</Text>
        <Feather name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: Vendor }) => (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={{ marginTop: 8, marginBottom: 24 }}>
        <VendorShowcaseWidget vendor={item} onPressExplore={() => handleVendorPress(item)} />
      </View>
    </View>
  );

  const showStoresList = !isGrocery || (!collectionsLoading && collections.length === 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <FlatList
        data={!showStoresList || hasNoVendors ? [] : categoryVendors}
        renderItem={renderItem}
        keyExtractor={item => item.shopId}
        ListHeaderComponent={headerElement}
        ListEmptyComponent={hasNoVendors || showStoresList ? renderEmpty : null}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
      <FloatingCartsStack />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  searchFlex: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  promoContainer: {
    // marginBottom: 24,
  },
  showcaseList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'stretch',
  },
  showcaseCard: {
    width: SHOWCASE_CARD_WIDTH,
    marginRight: 12,
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 0,
  },
  emptyStateContainer: {
    marginTop: 32,
    marginHorizontal: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6B7280',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CategoryScreen;
