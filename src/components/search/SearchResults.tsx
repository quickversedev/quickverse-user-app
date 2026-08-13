import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';
import { Vendor } from '../../types/vendor';
import ProductItemOnSearch from '../common/search/ProductItemOnSearch';
import SectionDivider from '../common/SectionDivider';
import { ThemeText } from '../common/theme/ThemeText';
import VendorCard from '../modules/Vendor/VendorCard';
import RecentSearches from './RecentSearches';

interface SearchResultsProps {
  vendors: Vendor[];
  products: Product[];
  nearbyStores: Vendor[];
  onVendorPress: (vendor: Vendor) => void;
  onProductPress: (product: Product) => void;
  onFavoritePress: (vendor: Vendor) => void;
  onRecentSearchPress?: (searchText: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  vendors,
  products,
  nearbyStores,
  onVendorPress,
  onProductPress,
  onFavoritePress,
  onRecentSearchPress,
}) => {
  const { getColor } = useTheme();
  const { vendors: storeVendors } = useVendorStore();

  // State for pagination. 8 = 4 rows of 2, keeping the Vendors section reachable
  // without much scrolling; "Show More" pages in the rest.
  const [visibleProducts, setVisibleProducts] = React.useState(8);
  const [showMoreVisible, setShowMoreVisible] = React.useState(true);

  // Handle show more button press
  const handleShowMore = () => {
    const newVisibleCount = visibleProducts + 4;
    setVisibleProducts(newVisibleCount);

    // Hide show more button if all products are visible
    if (newVisibleCount >= products.length) {
      setShowMoreVisible(false);
    }
  };

  // Get visible products
  const displayedProducts = products.slice(0, visibleProducts);

  // Get vendor details from store using shopId
  const getVendorDetails = (shopId: string): Vendor | undefined => {
    return storeVendors.find(vendor => vendor.shopId === shopId);
  };

  const styles = StyleSheet.create({
    section: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    // Centred rather than space-between: the card now sets its own width, and
    // space-between would shove a lone trailing card to the left edge.
    vendorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      columnGap: 16,
    },
    vendorGridItem: {
      alignItems: 'center',
    },
    vendorCardContainer: {
      width: '32%',
      margin: 6,
    },
    // Horizontal scroll styles for nearby stores
    horizontalScrollContainer: {
      marginVertical: 8,
    },
    horizontalScrollContent: {
      paddingHorizontal: 16,
    },
    horizontalRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    horizontalVendorCard: {
      width: 160,
      marginRight: 8,
    },
    horizontalProductCard: {
      width: 160,
      marginRight: 8,
    },
    // Products grid styles for 2 columns
    productsScrollContainer: {
      maxHeight: 340, // Limit height for vertical scrolling
    },
    productsGridContainer: {
      paddingBottom: 4,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 4,
    },
    productGridItem: {
      width: '48%', // 100% / 2 = 50% - 2% gap = 48% for 2 columns
      marginBottom: 8,
    },
    showMoreButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 16,
      // Kept reasonably tall despite the smaller label — this is the tap target,
      // and the text itself is only 13px.
      paddingVertical: 10,
      alignSelf: 'center',
      marginTop: 4,
    },
    showMoreText: {
      color: getColor('primary'),
      fontSize: 13,
      fontWeight: '400',
    },
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    productItemContainer: {
      width: '48%',
      marginBottom: 8,
    },
    noResultsContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
    },
    noResultsIcon: {
      marginBottom: 12,
    },
    noResultsText: {
      color: getColor('subText'),
      textAlign: 'center',
      fontSize: 15,
    },
    noResultsSubText: {
      color: getColor('subText'),
      textAlign: 'center',
      fontSize: 13,
      marginTop: 4,
      opacity: 0.7,
    },
  });

  const hasResults = vendors.length > 0 || products.length > 0 || nearbyStores.length > 0;

  if (!hasResults) {
    return (
      <View>
        <View style={styles.noResultsContainer}>
          <MaterialCommunityIcons
            name="magnify-close"
            size={48}
            color={getColor('subText')}
            style={styles.noResultsIcon}
          />
          <ThemeText variant="body" style={styles.noResultsText}>
            No results found
          </ThemeText>
          <ThemeText style={styles.noResultsSubText}>Try a different search term</ThemeText>
        </View>
        {onRecentSearchPress && <RecentSearches onSearchPress={onRecentSearchPress} />}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {products.length > 0 && (
        <View style={styles.section}>
          <View style={styles.productsGrid}>
            {displayedProducts.map(product => (
              <View key={`search-${product.sku}`} style={styles.productGridItem}>
                <ProductItemOnSearch product={product} onPress={onProductPress} />
              </View>
            ))}
          </View>
          {showMoreVisible && visibleProducts < products.length && (
            <View style={styles.showMoreButton}>
              <ThemeText
                variant="caption"
                color={getColor('primary')}
                style={styles.showMoreText}
                onPress={handleShowMore}
              >
                Show More
              </ThemeText>
            </View>
          )}
        </View>
      )}

      {vendors.length > 0 && (
        <View style={styles.section}>
          <SectionDivider text="Vendors" fontSize={14} style={{ marginVertical: 8 }} />
          <View style={styles.vendorsGrid}>
            {vendors.map(vendor => {
              const vendorDetails = getVendorDetails(vendor.shopId);
              if (!vendorDetails) return null;

              return (
                <View key={`search-${vendor.shopId}`} style={styles.vendorGridItem}>
                  {/* 'medium' sizes the card for a 2-column grid ((width-48)/2);
                      'small' is sized for 3 columns and left it undersized here. */}
                  <VendorCard
                    vendor={vendorDetails}
                    onPress={onVendorPress}
                    onFavoritePress={onFavoritePress}
                    size="medium"
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}
      {nearbyStores.length > 0 && (
        <View style={styles.section}>
          <SectionDivider text="Nearby Stores" fontSize={14} style={{ marginVertical: 16 }} />
          {nearbyStores.length <= 2 ? (
            // Show 2 or fewer stores horizontally
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              style={styles.horizontalScrollContainer}
            >
              {nearbyStores.map(vendor => (
                <View key={vendor.shopId} style={styles.horizontalVendorCard}>
                  <VendorCard
                    vendor={vendor}
                    onPress={onVendorPress}
                    onFavoritePress={onFavoritePress}
                    size="small"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            // Show more than 2 stores in 2-row design
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              style={styles.horizontalScrollContainer}
            >
              {/* Container for both rows */}
              <View>
                {/* First row - first half of stores */}
                <View style={styles.horizontalRow}>
                  {nearbyStores.slice(0, Math.ceil(nearbyStores.length / 2)).map(vendor => (
                    <View key={vendor.shopId} style={styles.horizontalVendorCard}>
                      <VendorCard
                        vendor={vendor}
                        onPress={onVendorPress}
                        onFavoritePress={onFavoritePress}
                        size="small"
                      />
                    </View>
                  ))}
                </View>
                {/* Second row - second half of stores */}
                {nearbyStores.length > Math.ceil(nearbyStores.length / 2) && (
                  <View style={styles.horizontalRow}>
                    {nearbyStores.slice(Math.ceil(nearbyStores.length / 2)).map(vendor => (
                      <View key={vendor.shopId} style={styles.horizontalVendorCard}>
                        <VendorCard
                          vendor={vendor}
                          onPress={onVendorPress}
                          onFavoritePress={onFavoritePress}
                          size="small"
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

export default SearchResults;
