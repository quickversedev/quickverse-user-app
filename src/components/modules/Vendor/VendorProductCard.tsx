import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Icons } from '../../../assets';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useFeaturedProducts from '../../../hooks/useFeaturedProducts';
import { ProductVariant } from '../../../services/productDetailsService';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { RatingBadge } from '../../common';
import FeaturedProductsSkeleton from '../../common/featuredProducts/FeaturedProductsSkeleton';
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
  const { authData } = useAuth();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Use the new hook for featured products
  const {
    featuredProducts,
    loading,
    error,
    refetch: _refetch,
  } = useFeaturedProducts({
    shopId: vendor.shopId,
    limit: 5,
    autoFetch: true,
  });

  // Sort featured products: in-stock first, then out-of-stock
  const sortedFeaturedProducts = useMemo(() => {
    return [...featuredProducts].sort((a, b) => {
      // If both have same stock status, maintain original order
      if (a.inStock === b.inStock) return 0;
      // In-stock products come first (true > false)
      return a.inStock ? -1 : 1;
    });
  }, [featuredProducts]);
  // console.log('sortedFeaturedProducts', sortedFeaturedProducts);
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

  const handleVariantSelect = (variant: ProductVariant) => {
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
      sellingPrice: product.sellingPrice, // Map price to sellingPrice
    } as any; // Type assertion to bypass type checking
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    console.log('item', item);
    const quantity = cart?.products[item.sku]?.quantity || 0;
    const isStoreClosed = !vendor.storeActive;

    // Convert Product from types/product to mock Product format
    const mockProduct = {
      sku: item.sku,
      shopId: item.shopId || vendor.shopId,
      name: item.name,
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      gst: item.gst || 0,
      category: item.category || '',
      division: item.division || '',
      subDivision: item.subDivision || '',
      brand: item.brand || '',

      imageUrl: item.imageUrl,
      discount: item.discount,
      numberOfVariants: item.numberOfVariants || 1,
      currentStock: item.currentStock || 0,
      inStock: item.inStock || true,
      primarySKU: item.primarySKU,
      tags: item.tags || [],
      veg: item.veg || true,
    };
    console.log('mockProduct', mockProduct);
    return (
      <ProductCard
        product={mockProduct}
        quantity={quantity}
        onAdd={() => !isStoreClosed && handleAddToCart(item)}
        onIncrement={() =>
          !isStoreClosed &&
          authData?.jwt &&
          increment(cartId, item.sku, authData.jwt, authData.phone)
        }
        onDecrement={() =>
          !isStoreClosed &&
          authData?.jwt &&
          decrement(cartId, item.sku, authData.jwt, authData.phone)
        }
        size="xs"
        disabled={isStoreClosed || !item.inStock}
        showVariantsCount={false}
        onPress={() => !isStoreClosed && onProductPress(item)}
        backgroundColor={getColor('card')}
        rating={item.rating || 0}
      />
    );
  };

  const renderFeaturedProducts = () => {
    if (loading) {
      return <FeaturedProductsSkeleton count={5} />;
    }

    // Don't show error or empty state - just return null
    if (error || sortedFeaturedProducts.length === 0) {
      return null;
    }

    return (
      <FlatList
        data={sortedFeaturedProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.sku}
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
    vendorLogo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
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
        <Image source={{ uri: vendor.logo }} style={styles.vendorLogo} />
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
