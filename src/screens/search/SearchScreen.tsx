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
import { Vendor } from '../../types/vendor';

interface Product {
  id: string;
  name: string;
  image: string;
}

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
  } = useSearch();

  const { addSearch } = useRecentSearches();

  // Get vendors from vendor store
  const { getFeaturedVendors } = useVendorStore();

  // Handle search input change - only update query, don't make API calls
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // Get featured vendors from vendor store
  const featuredVendors = getFeaturedVendors().slice(0, 6); // Show up to 6 featured vendors

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

  const handleVendorPress = (vendor: Vendor) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('VendorProduct', { vendor });
  };

  const handleProductPress = (product: Product) => {
    // TODO: Navigate to product details
    // eslint-disable-next-line no-console
    console.log('Product pressed:', product.name);
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

            {/* Trending Vendors Section */}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
