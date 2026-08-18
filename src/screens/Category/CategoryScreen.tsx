import Feather from '@react-native-vector-icons/feather';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
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
                data={categoryVendors}
                renderItem={({ item }) => (
                  <View style={{ marginRight: 16 }}>
                    <VendorCard2 vendor={item} size={160} onPress={handleVendorPress} />
                  </View>
                )}
                keyExtractor={item => item.shopId}
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
