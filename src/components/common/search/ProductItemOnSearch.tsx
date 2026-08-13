import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { ThemeText } from '../../common/theme/ThemeText';

/**
 * Thumbnail size. Each search result sits in a ~48%-wide column, so this leaves
 * roughly 115px for the vendor tag and the two-line product name.
 */
const IMAGE_SIZE = 56;

interface ProductItemOnSearchProps {
  product: Product;
  onPress: (product: Product) => void;
}

const ProductItemOnSearch: React.FC<ProductItemOnSearchProps> = ({ product, onPress }) => {
  const { getColor } = useTheme();
  const getVendorNameById = useVendorStore(state => state.getVendorNameById);
  const vendorName = product.shopId ? getVendorNameById(product.shopId) : undefined;

  /**
   * GET /v3/search does not return prices — its SearchResponseDTO carries only
   * sku/name/shopId/image — and useSearch coerces the missing value to 0. Only
   * the federated and collection results arrive priced. So render the price only
   * when it is real: a wrong "₹0" on a storefront is worse than no price, and
   * this keeps working unchanged once the backend query selects the columns.
   */
  const hasPrice = (product.sellingPrice ?? 0) > 0;
  const hasDiscount = hasPrice && (product.mrp ?? 0) > product.sellingPrice;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
      paddingHorizontal: 8,
    },
    imageContainer: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: IMAGE_SIZE / 2,
      backgroundColor: getColor('card'),
      marginRight: 10,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: IMAGE_SIZE / 2,
    },
    textContainer: {
      flex: 1,
    },
    vendorTag: {
      color: getColor('primary'),
      fontSize: 10,
      fontWeight: '600',
      marginBottom: 2,
    },
    productName: {
      color: getColor('text'),
      lineHeight: 16 * 1.2,
    },
    // Mirrors HorizontalProductCard (the vendor product list) so a product looks
    // the same priced in search as it does on the store page.
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    mrpText: {
      fontSize: 12,
      color: getColor('subText'),
      textDecorationLine: 'line-through',
      marginRight: 6,
    },
    sellingPrice: {
      fontSize: 15,
      fontWeight: '600',
      color: getColor('text'),
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(product)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.imageUrl || '' }} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        {vendorName && (
          <ThemeText style={styles.vendorTag} numberOfLines={1}>
            {vendorName}
          </ThemeText>
        )}
        <ThemeText
          variant="caption"
          color={getColor('text')}
          style={styles.productName}
          numberOfLines={2}
        >
          {product.name}
        </ThemeText>
        {hasPrice && (
          <View style={styles.priceRow}>
            {hasDiscount && <Text style={styles.mrpText}>₹{product.mrp}</Text>}
            <Text style={styles.sellingPrice}>₹{product.sellingPrice}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProductItemOnSearch;
