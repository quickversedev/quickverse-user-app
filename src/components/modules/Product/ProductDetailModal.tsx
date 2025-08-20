import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import productDetailsService from '../../../services/productDetailsService';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import AddButton from './AddButton';
import ProductImageCarousel from './ProductImageCarousel';
import ProductInfo from './ProductInfo';
import QuantitySelector from './QuantitySelector';
import SuggestedItems from './SuggestedItems';

const { height, width } = Dimensions.get('window');

// Responsive design constants
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;

// Calculate responsive values
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

interface Vendor {
  name: string;
  shopId: string;
}

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  image: number;
  quantity: number;
}

interface ProductDetailModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  vendor: Vendor;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  visible,
  onClose,
  product,
  vendor,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { authData } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Product[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart, increment, decrement, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = `vendor_${vendor.shopId}`;

  // Get current cart
  const cart = carts[cartId];

  // Get display values from selected variant or fallback to product
  const displayImageUrl = selectedVariant?.imageUrl || product.imageUrl || '';
  const displayAdditionalImages =
    selectedVariant?.additionalImages || product.additionalImages || [];
  const displayName = selectedVariant?.name || product.name;
  const displayPrice = selectedVariant?.sellingPrice || product.sellingPrice;
  const displayMrp = selectedVariant?.mrp || product.mrp;
  const displaySku = selectedVariant?.sku || product.sku;
  const displayAttributes = selectedVariant?.attributes || product.attributes;

  // Get current quantity for this product
  const currentQuantity = cart?.products[displaySku]?.quantity || 0;

  useEffect(() => {
    if (visible && product.numberOfVariants > 1) {
      fetchVariants();
    }
  }, [visible, product.numberOfVariants]);

  // Update selected variant when product changes
  useEffect(() => {
    setSelectedVariant(null); // Reset when product changes
  }, [product.sku]);

  const fetchVariants = async () => {
    setLoadingVariants(true);
    setVariantsError(null);
    try {
      const variantsData = await productDetailsService.getProductVariants(
        product.primarySKU || product.sku
      );

      setVariants(variantsData.data);

      // Auto-select the variant that matches the current product SKU
      const matchingVariant = variantsData.data.find(variant => variant.sku === product.sku);
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
      }
    } catch (err) {
      setVariantsError(err instanceof Error ? err.message : 'Failed to fetch variants');
    } finally {
      setLoadingVariants(false);
    }
  };

  // Cart handlers
  const handleAddToCart = () => {
    if (!authData?.jwt) return;
    addToCart(
      cartId,
      {
        sku: displaySku,
        shopId: vendor.shopId,
        name: selectedVariant?.name || product.name,
        price: displayPrice,
        mrp: displayMrp,
        image: displayImageUrl,
        veg: product.veg,
      },
      authData.jwt,
      authData.phone
    );
  };

  const handleIncrement = () => {
    if (!authData?.jwt) return;
    increment(cartId, displaySku, authData.jwt, authData.phone);
  };

  const handleDecrement = () => {
    if (!authData?.jwt) return;
    decrement(cartId, displaySku, authData.jwt, authData.phone);
  };

  const suggestedItems: SuggestedItem[] = [
    {
      id: '1',
      name: 'Choco Lava Cake',
      price: 120,
      mrp: 150,
      rating: 4.5,
      image: require('../../../assets/images/bg_1.png'),
      quantity: 0,
    },
    {
      id: '2',
      name: 'Vanilla Ice Cream',
      price: 80,
      mrp: 100,
      rating: 4.2,
      image: require('../../../assets/images/bg_1.png'),
      quantity: 0,
    },
    {
      id: '3',
      name: 'Chocolate Brownie',
      price: 90,
      mrp: 120,
      rating: 4.7,
      image: require('../../../assets/images/bg_1.png'),
      quantity: 0,
    },
    {
      id: '4',
      name: 'Strawberry Cake',
      price: 110,
      mrp: 140,
      rating: 4.3,
      image: require('../../../assets/images/bg_1.png'),
      quantity: 0,
    },
  ];

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: getColor('background'),
      borderTopLeftRadius: getResponsiveValue(16, 20, 24),
      borderTopRightRadius: getResponsiveValue(16, 20, 24),
      maxHeight: height * (isSmallScreen ? 0.9 : 0.95),
      minHeight: height * (isSmallScreen ? 0.75 : 0.8),
    },
    dragIndicator: {
      width: getResponsiveValue(32, 40, 48),
      height: 4,
      backgroundColor: getColor('border'),
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: getResponsiveValue(8, 12, 16),
    },
    closeButton: {
      position: 'absolute',
      top: -getResponsiveValue(40, 44, 48),
      left: '50%',
      transform: [{ translateX: -getResponsiveValue(16, 20, 24) }],
      zIndex: 10,
      backgroundColor: getColor('card'),
      borderRadius: getResponsiveValue(16, 20, 24),
      width: getResponsiveValue(32, 40, 48),
      height: getResponsiveValue(32, 40, 48),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 3,
    },
    content: {
      flex: 1,
      paddingBottom: getResponsiveValue(70, 80, 90), // Space for fixed bottom bar
    },
    mainCard: {
      backgroundColor: getColor('background'),
      borderRadius: getResponsiveValue(12, 16, 20),
      overflow: 'hidden',
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: getColor('card'),
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
      paddingHorizontal: getResponsiveValue(16, 20, 24),
      paddingVertical: getResponsiveValue(12, 16, 20),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Math.max(getResponsiveValue(12, 16, 20), insets.bottom),
    },
    priceContainer: {
      flex: 1,
      marginRight: getResponsiveValue(8, 12, 16),
    },
    mrpText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textDecorationLine: 'line-through',
      marginBottom: getResponsiveValue(1, 2, 3),
    },
    sellingPriceText: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
    },
    buttonContainer: {
      position: 'relative',
      minWidth: getResponsiveValue(70, 80, 90),
      height: getResponsiveValue(32, 36, 40),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('body'),
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.sm,
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
  });

  const handleAddToStacks = () => {
    // Add to stacks functionality
  };

  const handleVariantSelect = (variantId: string) => {
    const variant = variants.find(v => v.sku === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setCurrentImageIndex(0); // Reset to first image when variant changes
    }
  };

  const handleImageIndexChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleProductInfoPress = () => {
    // Product info functionality
  };

  const handleSuggestedItemPress = (_item: SuggestedItem) => {
    // Handle suggested item press - could open product detail modal for this item
  };

  const handleSuggestedItemAdd = (item: SuggestedItem) => {
    if (!authData?.jwt) return;
    // Add suggested item to cart
    const cartProduct = {
      sku: item.id,
      shopId: vendor.shopId,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      image: item.image,
      veg: true, // Default to vegetarian for suggested items
    };
    addToCart(cartId, cartProduct, authData.jwt, authData.phone);
  };

  const handleSuggestedItemIncrement = (item: SuggestedItem) => {
    if (!authData?.jwt) return;
    increment(cartId, item.id, authData.jwt, authData.phone);
  };

  const handleSuggestedItemDecrement = (item: SuggestedItem) => {
    if (!authData?.jwt) return;
    decrement(cartId, item.id, authData.jwt, authData.phone);
  };

  const handleViewAllPress = () => {
    // View all suggested items
  };

  // Create variants for ProductInfo component
  const productVariants =
    variants.length > 0
      ? variants.map(variant => ({
          id: variant.sku,
          name: variant.name,
          value: `${variant.attributes?.size} | ${variant.attributes?.color}`,
        }))
      : [];
  // Loading state for variants
  if (loadingVariants && product.numberOfVariants > 1) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={getColor('error')} />
            </TouchableOpacity>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={getColor('primary')} />
              <Text style={{ color: getColor('subText'), marginTop: 16 }}>Loading variants...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Error state for variants
  if (variantsError && product.numberOfVariants > 1) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
            </TouchableOpacity>
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={48} color={getColor('error')} />
              <Text style={styles.errorText}>{variantsError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchVariants}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle={isSmallScreen ? 'pageSheet' : 'formSheet'}
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.dragIndicator} />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={getColor('error')} />
          </TouchableOpacity>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.mainCard}>
              <ProductImageCarousel
                imageUrl={displayImageUrl}
                additionalImages={displayAdditionalImages}
                productName={displayName}
                onAddToStacks={handleAddToStacks}
                currentImageIndex={currentImageIndex}
                onImageIndexChange={handleImageIndexChange}
              />

              <ProductInfo
                productName={displayName}
                variants={productVariants}
                selectedVariantId={selectedVariant?.sku || product.sku}
                onVariantSelect={handleVariantSelect}
                onProductInfoPress={handleProductInfoPress}
                veg={product.veg}
                attributes={displayAttributes}
              />
            </View>

            <SuggestedItems
              items={suggestedItems.map(item => ({
                ...item,
                quantity: cart?.products[item.id]?.quantity || 0,
              }))}
              onItemPress={handleSuggestedItemPress}
              onViewAllPress={handleViewAllPress}
              onAdd={handleSuggestedItemAdd}
              onIncrement={handleSuggestedItemIncrement}
              onDecrement={handleSuggestedItemDecrement}
            />
          </ScrollView>

          {/* Fixed Bottom Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.priceContainer}>
              {displayMrp !== displayPrice && <Text style={styles.mrpText}>MRP ₹{displayMrp}</Text>}
              <Text style={styles.sellingPriceText}>₹{displayPrice}</Text>
            </View>

            <View style={styles.buttonContainer}>
              {currentQuantity === 0 ? (
                <AddButton onPress={handleAddToCart} size="regular" />
              ) : (
                <QuantitySelector
                  quantity={currentQuantity}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  size="regular"
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProductDetailModal;
