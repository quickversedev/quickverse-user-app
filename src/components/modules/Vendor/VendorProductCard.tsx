import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Icons } from '../../../assets';
import useFeaturedProducts from '../../../hooks/useFeaturedProducts';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { RatingBadge } from '../../common';
import FeaturedProductsError from '../../common/FeaturedProductsError';
import FeaturedProductsSkeleton from '../../common/FeaturedProductsSkeleton';
import ProductCard from '../Product/ProductCard';
import VariantsModal from '../Product/VariantsModal';

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
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Use the new hook for featured products
  const { featuredProducts, loading, error, refetch } = useFeaturedProducts({
    shopId: vendor.shopId,
    limit: 5,
    autoFetch: true,
  });

  const cartId = `vendor_${vendor.shopId}`;
  const cart = useCartStore(state => state.carts[cartId]);
  const increment = useCartStore(state => state.increment);
  const decrement = useCartStore(state => state.decrement);

  const handleAddToCart = (product: Product) => {
    // If product has multiple variants, show variants modal
    if ((product.numberOfVariants || 1) > 1) {
      setSelectedProduct(product);
      setShowVariantsModal(true);
      return;
    }

    // Otherwise, add directly to cart
    onAddToCart(product);
  };

  const handleVariantSelect = (variant: any) => {
    if (!selectedProduct) return;

    // Create a product object with variant data
    const variantProduct = {
      ...selectedProduct,
      sku: variant.id,
      name: variant.name,
      price: variant.price,
      mrp: variant.mrp,
    };

    onAddToCart(variantProduct);
  };

  // Convert Product from types/product to mock Product format for VariantsModal
  const convertProductForVariantsModal = (product: Product) => {
    return {
      ...product,
      sellingPrice: product.price, // Map price to sellingPrice
    } as any; // Type assertion to bypass type checking
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const quantity = cart?.products[item.sku || item.id]?.quantity || 0;
    const isStoreClosed = !vendor.storeActive;

    return (
      <ProductCard
        image={item.image}
        name={item.name}
        price={item.price}
        mrp={item.mrp}
        discount={item.discount}
        rating={item.rating || 0}
        quantity={quantity}
        onAdd={() => !isStoreClosed && handleAddToCart(item)}
        onIncrement={() => !isStoreClosed && increment(cartId, item.sku || item.id)}
        onDecrement={() => !isStoreClosed && decrement(cartId, item.sku || item.id)}
        size="xs"
        disabled={isStoreClosed}
        numberOfVariants={item.numberOfVariants || 1}
        onPress={() => !isStoreClosed && onProductPress(item)}
        backgroundColor={getColor('card')}
      />
    );
  };

  const renderFeaturedProducts = () => {
    if (loading) {
      return <FeaturedProductsSkeleton count={5} />;
    }

    if (error) {
      return <FeaturedProductsError error={error} onRetry={refetch} loading={loading} />;
    }

    if (featuredProducts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No featured products available</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={featuredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
      />
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
      fontFamily: 'BricolageGrotesque-Regular',
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
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
      borderRadius: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    exploreButtonText: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
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
    emptyContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <View style={styles.container}>
      {/* Vendor Header */}
      <TouchableOpacity style={styles.header} onPress={() => onVendorPress(vendor)}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <View style={styles.vendorMeta}>
            <Image source={Icons.lightning} />
            <Text style={styles.deliveryTime}>30 mins</Text>
            <Text style={styles.location}>• {vendor.shopAddress?.city || 'Location'}</Text>
          </View>
        </View>
        <RatingBadge rating={vendor.rating || 0} size="small" />
      </TouchableOpacity>

      {!vendor.storeActive && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>WE ARE CLOSED</Text>
        </View>
      )}

      {/* Featured Products */}
      <View style={[!vendor.storeActive && styles.productsDisabled]}>
        {renderFeaturedProducts()}
      </View>

      {/* Explore More Button */}
      <TouchableOpacity style={styles.exploreButton} onPress={() => onVendorPress(vendor)}>
        <Text style={styles.exploreButtonText}>Explore More</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={getColor('primary')}
          style={{ alignSelf: 'center', marginTop: 1 }}
        />
      </TouchableOpacity>

      {/* Variants Modal */}
      {selectedProduct && (
        <VariantsModal
          visible={showVariantsModal}
          onClose={() => {
            setShowVariantsModal(false);
            setSelectedProduct(null);
          }}
          product={convertProductForVariantsModal(selectedProduct)}
          vendor={vendor}
          onVariantSelect={handleVariantSelect}
        />
      )}
    </View>
  );
};

export default VendorProductCard;
