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

  // Handle search input change - only update query, don't make API calls
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // Mock trending vendors data
  const trendingVendors: Vendor[] = [
    {
      shopId: '1',
      name: 'Meridian Icecream',
      rating: 4.3,
      preparationTime: '30 mins',
      logo: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
      banner: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
      owner: 'Owner 1',
      phone: '1234567890',
      openingTime: '09:00',
      closingTime: '22:00',
      description: 'Delicious ice cream shop',
      category: 'restaurant',
      storeEnabled: true,
      storeActive: true,
    },
    {
      shopId: '2',
      name: 'Wellness Forever',
      rating: 3.7,
      preparationTime: '16 mins',
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      banner: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      owner: 'Owner 2',
      phone: '1234567890',
      openingTime: '09:00',
      closingTime: '22:00',
      description: 'Pharmacy and wellness store',
      category: 'pharmacy',
      storeEnabled: true,
      storeActive: true,
    },
    {
      shopId: '3',
      name: 'Meridian Icecream',
      rating: 4.3,
      preparationTime: '30 mins',
      logo: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
      banner: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
      owner: 'Owner 3',
      phone: '1234567890',
      openingTime: '09:00',
      closingTime: '22:00',
      description: 'Delicious ice cream shop',
      category: 'restaurant',
      storeEnabled: true,
      storeActive: true,
    },
    {
      shopId: '4',
      name: 'Wellness Forever',
      rating: 3.7,
      preparationTime: '16 mins',
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      banner: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      owner: 'Owner 4',
      phone: '1234567890',
      openingTime: '09:00',
      closingTime: '22:00',
      description: 'Pharmacy and wellness store',
      category: 'pharmacy',
      storeEnabled: true,
      storeActive: true,
    },
  ];

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
                text="Trending Vendors"
                fontSize={14}
                style={{ marginVertical: 16 }}
              />
              {trendingVendors.map(vendor => (
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
