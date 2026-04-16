import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import SectionDivider from '../../components/common/SectionDivider';
import CollectionShowcaseWidget from '../../components/modules/Collection/CollectionShowcaseWidget';
import { SearchBar } from '../../components/modules/Header/SearchBar';
import VendorCard2 from '../../components/modules/Vendor/VendorCard2'; // Updated to V2
import VendorShowcaseWidget from '../../components/modules/Vendor/VendorShowcaseWidget';
import { Collection, fetchCollectionsFromApi } from '../../data/collectionsData';
import { RootStackParamList } from '../../routes/AppStack';
import useVendorStore from '../../store/vendorStore';
import { Vendor } from '../../types/vendor';
import PromotionCarousel from '../Home/components/PromotionCarousel';
import CollectionsGrid from './components/CollectionsGrid';
import CollectionsGridSkeleton from './components/CollectionsGridSkeleton';

type CategoryScreenRouteProp = RouteProp<RootStackParamList, 'Category'>;

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

  // Cart Logic
  // Collections Logic (Grocery Only)
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  useEffect(() => {
    const loadCollections = async () => {
      if (!isGrocery || categoryVendors.length === 0) {
        setCollectionsLoading(false);
        return;
      }
      setCollectionsLoading(true);
      try {
        const storeId = categoryVendors[0].shopId;
        const sections = await fetchCollectionsFromApi(storeId);
        if (sections.length > 0) {
          setCollections(sections[0].collections);
        } else {
          setCollections([]);
        }
      } catch (error) {
        console.error('[CategoryScreen] Failed to load collections:', error);
        setCollections([]);
      } finally {
        setCollectionsLoading(false);
      }
    };

    loadCollections();
  }, [isGrocery, categoryVendors]);

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

  const handleSearchPress = React.useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const navigateToOtherCategory = React.useCallback(() => {
    const otherCategory = isGrocery ? 'Food' : 'Grocery';
    navigation.navigate('Category', { categoryName: otherCategory });
  }, [navigation, isGrocery]);

  const hasNoVendors = categoryVendors.length === 0;
  const otherCategoryLabel = isGrocery ? 'Food' : 'Grocery';

  const renderHeader = () => (
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

      {/* Promo Banners */}
      <View style={styles.promoContainer}>
        <PromotionCarousel
          category={categoryName as 'Food' | 'Grocery'}
          onBannerPress={handleBannerPress}
        />
      </View>

      {/* Conditional Content if Vendors Exist */}
      {!hasNoVendors && (
        <>
          {/* Collection Showcase Widgets (Grocery vendors) */}
          {isGrocery &&
            categoryVendors.map(v => (
              <View
                key={v.shopId}
                style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 8 }}
              >
                <CollectionShowcaseWidget vendor={v} onPressExplore={() => handleVendorPress(v)} />
              </View>
            ))}

          {/* Collections Grid (Grocery Only) */}
          {isGrocery && collectionsLoading && <CollectionsGridSkeleton />}
          {isGrocery && !collectionsLoading && collections.length > 0 && (
            <CollectionsGrid collections={collections} shopId={categoryVendors[0]?.shopId} />
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
                style={{ marginVertical: 16, paddingHorizontal: 40 }}
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!showStoresList ? null : renderEmpty}
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
