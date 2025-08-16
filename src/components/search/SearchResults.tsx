import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';
import ProductItemOnSearch from '../common/search/ProductItemOnSearch';
import SectionDivider from '../common/SectionDivider';
import VendorCard from '../modules/Vendor/VendorCard';

interface Product {
  id: string;
  name: string;
  image: string;
}

interface SearchResultsProps {
  vendors: Vendor[];
  products: Product[];
  onVendorPress: (vendor: Vendor) => void;
  onProductPress: (product: Product) => void;
  onFavoritePress: (vendor: Vendor) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  vendors,
  products,
  onVendorPress,
  onProductPress,
  onFavoritePress,
}) => {
  const { getColor, getTypography } = useTheme();
  const { vendors: storeVendors } = useVendorStore();

  // Get vendor details from store using shopId
  const getVendorDetails = (shopId: string): Vendor | undefined => {
    return storeVendors.find(vendor => vendor.shopId === shopId);
  };

  const styles = StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    vendorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 10,
    },
    vendorCardContainer: {
      width: '32%',
      margin: 16,
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    noResultsText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      textAlign: 'center',
    },
  });

  const hasResults = vendors.length > 0 || products.length > 0;

  if (!hasResults) {
    return (
      <View style={styles.section}>
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {products.length > 0 && (
        <View style={styles.section}>
          <SectionDivider text="Products" fontSize={14} style={{ marginVertical: 16 }} />
          <View style={styles.productsContainer}>
            {products.map(product => (
              <View key={product.id} style={styles.productItemContainer}>
                <ProductItemOnSearch product={product} onPress={onProductPress} />
              </View>
            ))}
          </View>
        </View>
      )}

      {vendors.length > 0 && (
        <View style={styles.section}>
          <SectionDivider text="Vendors" fontSize={14} style={{ marginVertical: 16 }} />
          <View style={styles.vendorsGrid}>
            {vendors.map(vendor => {
              // Get full vendor details from store
              const vendorDetails = getVendorDetails(vendor.shopId);

              // Only render if vendor details exist in store
              if (!vendorDetails) {
                return null;
              }

              return (
                <View key={vendor.shopId} style={styles.vendorCardContainer}>
                  <VendorCard
                    vendor={vendorDetails}
                    onPress={onVendorPress}
                    onFavoritePress={onFavoritePress}
                    size="small"
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

export default SearchResults;
