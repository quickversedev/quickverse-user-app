import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';
import ProductItemOnSearch from '../common/ProductItemOnSearch';
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

  const styles = StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    vendorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 4,
    },
    vendorCardContainer: {
      width: '32%',
      marginBottom: 16,
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
            {vendors.map(vendor => (
              <View key={vendor.shopId} style={styles.vendorCardContainer}>
                <VendorCard
                  vendor={vendor}
                  onPress={onVendorPress}
                  onFavoritePress={onFavoritePress}
                  size="small"
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default SearchResults;
