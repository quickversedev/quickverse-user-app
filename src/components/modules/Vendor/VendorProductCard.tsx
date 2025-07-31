import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import productService from '../../../services/productService';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import AddButton from '../Product/AddButton';
import QuantitySelector from '../Product/QuantitySelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32; // Full width minus margins
const PRODUCT_CARD_WIDTH = 110;

interface VendorProductCardProps {
  vendor: Vendor;
  onVendorPress: (vendor: Vendor) => void;
  onProductPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const VendorProductCard: React.FC<VendorProductCardProps> = ({
  vendor,
  onVendorPress,
  onProductPress,
  onAddToCart,
}) => {
  const { getColor, getTypography } = useTheme();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const cartId = `vendor_${vendor.shopId}`;
  const cart = useCartStore(state => state.carts[cartId]);
  const increment = useCartStore(state => state.increment);
  const decrement = useCartStore(state => state.decrement);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [vendor.shopId]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getFeaturedProducts(vendor.shopId, 5);

      if (response.success) {
        setFeaturedProducts(response.data);
      } else {
        console.error('Failed to fetch featured products:', response.message);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const quantity = cart?.products[item.sku || item.id]?.quantity || 0;
    const isStoreClosed = !vendor.storeActive;

    // Debug logging
    console.log(
      'Vendor:',
      vendor.name,
      'storeActive:',
      vendor.storeActive,
      'isStoreClosed:',
      isStoreClosed
    );

    return (
      <TouchableOpacity
        style={[styles.productCard, isStoreClosed && styles.productDisabled]}
        onPress={() => !isStoreClosed && onProductPress(item)}
        activeOpacity={isStoreClosed ? 0.3 : 0.8}
      >
        <View style={styles.productImageContainer}>
          <Image source={item.image} style={styles.productImage} resizeMode="cover" />
          {item.discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>{item.discount}% OFF</Text>
            </View>
          )}
          {!isStoreClosed &&
            (quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrement={() => increment(cartId, item.sku || item.id)}
                onDecrement={() => decrement(cartId, item.sku || item.id)}
                size="small"
              />
            ) : (
              <AddButton onPress={() => onAddToCart(item)} size="small" />
            ))}
        </View>
        <Text style={[styles.productName, isStoreClosed && styles.textDisabled]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.mrp, isStoreClosed && styles.textDisabled]}>₹{item.mrp}</Text>
          <Text style={[styles.price, isStoreClosed && styles.textDisabled]}>₹{item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    vendorInfo: {
      flex: 1,
    },
    vendorName: {
      color: getColor('text'),
      fontSize: getTypography('subtitle'),
      fontWeight: 'bold',
      // marginBottom: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      // marginBottom: 4,
    },
    deliveryTime: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginRight: 8,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    location: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
    ratingContainer: {
      backgroundColor: getColor('primary'),
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      color: getColor('white'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginLeft: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    reviewsText: {
      color: getColor('white'),
      fontSize: getTypography('small'),
      marginLeft: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    productsContainer: {
      marginBottom: 16,
    },
    productsList: {
      paddingLeft: 0,
    },
    productCard: {
      width: PRODUCT_CARD_WIDTH,
      marginRight: 10,
    },
    productImageContainer: {
      width: '90%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 8,
      position: 'relative',
      backgroundColor: getColor('border'),
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    discountTag: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: getColor('error'),
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    discountText: {
      color: getColor('white'),
      fontSize: getTypography('small'),
      fontWeight: 'bold',
      fontFamily: 'BricolageGrotesque-Regular',
    },
    productName: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: '600',
      marginBottom: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mrp: {
      color: getColor('subText'),
      fontSize: getTypography('small'),
      textDecorationLine: 'line-through',
      marginRight: 6,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    price: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      fontFamily: 'BricolageGrotesque-Regular',
    },
    exploreButton: {
      // backgroundColor: getColor('primary'),
      borderRadius: 12,
      paddingHorizontal: 20,
      // paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    exploreButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      marginRight: 6,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    closedBanner: {
      backgroundColor: getColor('error'),
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closedText: {
      color: getColor('white'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      fontFamily: 'BricolageGrotesque-Regular',
      textTransform: 'uppercase',
    },
    productsDisabled: {
      opacity: 0.5,
    },
    productDisabled: {
      opacity: 0.5,
    },
    textDisabled: {
      opacity: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      {/* Vendor Header */}
      <TouchableOpacity style={styles.header} onPress={() => onVendorPress(vendor)}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <View style={styles.vendorMeta}>
            <Text style={styles.deliveryTime}>30 mins</Text>
            <Text style={styles.location}>• {vendor.shopAddress?.city || 'Location'}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={14} color={getColor('white')} />
          <Text style={styles.ratingText}>{vendor.rating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.reviewsText}>(242)</Text>
        </View>
      </TouchableOpacity>

      {/* Store Status Banner */}
      {(() => {
        console.log(
          'Banner check - vendor.storeActive:',
          vendor.storeActive,
          '!vendor.storeActive:',
          !vendor.storeActive
        );
        return null;
      })()}
      {!vendor.storeActive && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>WE ARE CLOSED</Text>
        </View>
      )}

      {/* Featured Products */}
      <View style={[styles.productsContainer, !vendor.storeActive && styles.productsDisabled]}>
        <FlatList
          data={featuredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      </View>

      {/* Explore More Button */}
      <TouchableOpacity style={styles.exploreButton} onPress={() => onVendorPress(vendor)}>
        <Text style={styles.exploreButtonText}>Explore More</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color={getColor('white')} />
      </TouchableOpacity>
    </View>
  );
};

export default VendorProductCard;
