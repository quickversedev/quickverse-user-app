import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionDivider from '../../components/common/SectionDivider';
import VendorCard from '../../components/modules/Vendor/VendorCard';
import RecentSearches from '../../components/search/RecentSearches';
import SearchHeader from '../../components/search/SearchHeader';
import SearchResults from '../../components/search/SearchResults';
import SearchSkeleton from '../../components/search/SearchSkeleton';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { useSearch } from '../../hooks/useSearch';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';
import { Vendor } from '../../types/vendor';

const SearchScreen: React.FC = () => {
  const { getColor } = useTheme();
  const navigation = useNavigation();

  const {
    searchQuery,
    isLoading,
    searchResults,
    hasSearched,
    setSearchQuery,
    searchOnSuggestionSelect,
    clearSearch,
  } = useSearch();

  const { addSearch } = useRecentSearches();

  // Get vendors from vendor store
  const { getFeaturedVendors, searchVendorsByQuery, getVendorById } = useVendorStore();

  // Handle search input change - only update query, don't make API calls
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    clearSearch();
  };

  // Get featured vendors from vendor store
  const featuredVendors = getFeaturedVendors().slice(0, 6); // Show up to 6 featured vendors

  // Get nearby stores based on search query
  const nearbyStores = searchQuery.trim()
    ? searchVendorsByQuery(searchQuery).slice(0, 6) // Show up to 6 nearby stores
    : [];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    trendingVendorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    vendorCardContainer: {
      width: '32%',
      marginBottom: 16,
    },
  });

  const handleSearchPress = async (searchText: string) => {
    setSearchQuery(searchText);
    await searchOnSuggestionSelect(searchText);
    addSearch(searchText);
  };

  const handleSearchSubmit = async () => {
    if (searchQuery.trim()) {
      await searchOnSuggestionSelect(searchQuery.trim());
      addSearch(searchQuery.trim());
    }
  };

  const handleVendorPress = (vendor: Vendor) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('VendorProduct', { vendor });
  };

  const handleProductPress = (product: Product) => {
    // Find the vendor for this product
    //console.log('product', product);
    const vendor = getVendorById(product?.shopId);

    if (vendor) {
      // Navigate to vendor product page with the product name pre-filled in search
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('VendorProduct', {
        vendor,
        searchQuery: product.name,
      });
    } else {
      // Fallback: just log if vendor not found
      // eslint-disable-next-line no-console
      //console.log('Vendor not found for product:', product.name);
    }
  };

  const handleFavoritePress = (_vendor: Vendor) => {
    // TODO: Implement favorite functionality
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSuggestionPress={handleSearchPress}
        onClearSearch={handleClearSearch}
        onSubmitEditing={handleSearchSubmit}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Show search results if has searched */}
        {hasSearched ? (
          <>
            {isLoading ? (
              <SearchSkeleton />
            ) : (
              <SearchResults
                vendors={searchResults.vendors}
                products={searchResults.products}
                nearbyStores={nearbyStores}
                onVendorPress={handleVendorPress}
                onProductPress={handleProductPress}
                onFavoritePress={handleFavoritePress}
              />
            )}
          </>
        ) : (
          <>
            {/* Recent Searches Section */}
            <RecentSearches onSearchPress={handleSearchPress} />

            {/* Show nearby stores if user is typing */}
            {searchQuery.trim() && nearbyStores.length > 0 && (
              <View style={styles.trendingVendorsGrid}>
                <SectionDivider text="Nearby Stores" fontSize={14} style={{ marginVertical: 16 }} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  style={{ marginVertical: 8 }}
                >
                  {/* Container for both rows */}
                  <View>
                    {/* First row - first half of stores */}
                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                      {nearbyStores.slice(0, Math.ceil(nearbyStores.length / 2)).map(vendor => (
                        <View
                          key={`nearby-${vendor.shopId}`}
                          style={{ width: 160, marginRight: 12 }}
                        >
                          <VendorCard
                            vendor={vendor}
                            onPress={handleVendorPress}
                            onFavoritePress={handleFavoritePress}
                            size="small"
                          />
                        </View>
                      ))}
                    </View>
                    {/* Second row - second half of stores */}
                    {nearbyStores.length > Math.ceil(nearbyStores.length / 2) && (
                      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                        {nearbyStores.slice(Math.ceil(nearbyStores.length / 2)).map(vendor => (
                          <View
                            key={`nearby-${vendor.shopId}`}
                            style={{ width: 160, marginRight: 12 }}
                          >
                            <VendorCard
                              vendor={vendor}
                              onPress={handleVendorPress}
                              onFavoritePress={handleFavoritePress}
                              size="small"
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Trending Vendors Section - only show if no search query or no nearby stores */}
            {(!searchQuery.trim() || nearbyStores.length === 0) && featuredVendors.length > 0 && (
              <View style={styles.trendingVendorsGrid}>
                <SectionDivider
                  text="Featured Vendors"
                  fontSize={14}
                  style={{ marginVertical: 16 }}
                />
                {featuredVendors.map(vendor => (
                  <View key={vendor.shopId} style={styles.vendorCardContainer}>
                    <VendorCard
                      vendor={vendor}
                      onPress={handleVendorPress}
                      onFavoritePress={handleFavoritePress}
                      size="small"
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
