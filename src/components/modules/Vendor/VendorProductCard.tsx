import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Images } from '../../../assets';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useFeaturedProducts from '../../../hooks/useFeaturedProducts';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { getStoreStatus } from '../../../utils/storeUtils';
import { RatingBadge } from '../../common';
import FeaturedProductsSkeleton from '../../common/featuredProducts/FeaturedProductsSkeleton';
import { ThemeText } from '../../common/theme/ThemeText';
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
  const { getColor } = useTheme();
  const { authData } = useAuth();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logoError, setLogoError] = useState(false);

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
  // If there are no featured items (and not loading), hide the entire card
  if (!loading && (error || sortedFeaturedProducts.length === 0)) {
    return null;
  }
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
      sellingPrice: product.sellingPrice, // Map price to sellingPrice
    };
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const quantity = cart?.products[item.sku]?.quantity || 0;
    const storeStatus = getStoreStatus(vendor);
    const isStoreClosed = !storeStatus.isOpen;

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
      inStock: item.inStock,
      primarySKU: item.primarySKU,
      tags: item.tags || [],
      veg: item.veg,
      rating: item.rating || 0,
    };

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
        onPress={() => onProductPress(item)}
        backgroundColor="#FFFCF5"
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
      backgroundColor: '#FFFCF5',
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      // marginBottom: 16,
    },
    vendorLogo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    vendorInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    vendorNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vendorName: {
      // No additional styles needed
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deliveryTime: {
      marginRight: 8,
    },
    location: {
      // No additional styles needed
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
      marginLeft: 4,
    },
    reviewsText: {
      marginLeft: 4,
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
      // No additional styles needed
    },
    productName: {
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mrp: {
      textDecorationLine: 'line-through',
      marginRight: 6,
    },
    price: {
      // No additional styles needed
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
      // No additional styles needed
    },
    closedBanner: {
      backgroundColor: getColor('error'),
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closedText: {
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
      // No additional styles needed
    },
  });

  return (
    <View style={styles.container}>
      {/* Vendor Header */}
      <TouchableOpacity style={styles.header} onPress={() => onVendorPress(vendor)}>
        <Image
          source={logoError || !vendor.logo ? Images.bg1 : { uri: vendor.logo }}
          onError={() => setLogoError(true)}
          defaultSource={Images.logoQv}
          style={styles.vendorLogo}
        />
        <View style={styles.vendorInfo}>
          <View style={styles.vendorNameRow}>
            <ThemeText variant="subtitle" style={styles.vendorName} color={getColor('text')}>
              {vendor.name}
            </ThemeText>
            <MaterialCommunityIcons name="chevron-right" size={16} color={getColor('subText')} />
          </View>
          <View style={styles.vendorMeta}>
            <MaterialCommunityIcons name="flash" size={18} color={getColor('primary')} />
            <ThemeText variant="caption" style={styles.deliveryTime} color={getColor('subText')}>
              {vendor.preparationTime || '30 mins'}
            </ThemeText>
          </View>
        </View>
        <RatingBadge rating={vendor.rating || 0} size="small" />
      </TouchableOpacity>

      {(() => {
        const storeStatus = getStoreStatus(vendor);
        if (!storeStatus.isOpen) {
          return (
            <View style={styles.closedBanner}>
              <ThemeText variant="caption" style={styles.closedText} color={getColor('white')}>
                {storeStatus.reason.toUpperCase()}
              </ThemeText>
            </View>
          );
        }
        return null;
      })()}

      {/* Featured Products */}
      <View
        style={[
          (() => {
            const storeStatus = getStoreStatus(vendor);
            return !storeStatus.isOpen;
          })() && styles.productsDisabled,
        ]}
      >
        {renderFeaturedProducts()}
      </View>

      {/* Explore More Button */}
      {/* <TouchableOpacity style={styles.exploreButton} onPress={() => onVendorPress(vendor)}>
        <ThemeText variant="caption" style={styles.exploreButtonText} color={getColor('primary')}>
          Explore More
        </ThemeText>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={getColor('primary')}
          style={{ alignSelf: 'center', marginTop: 1 }}
        />
      </TouchableOpacity> */}

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
