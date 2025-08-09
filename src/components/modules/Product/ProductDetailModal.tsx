import React, { useState } from 'react';
import {
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
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
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

interface Product {
  sku: string;
  shopId: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  gst: number;
  category: string;
  division: string;
  subDivision: string;
  brand: string;
  description: string;
  imageUrl: string;
  discount: number;
  numberOfVariants: number;
  currentStock: number;
  inStock: boolean;
  primarySKU: string;
  tags: Array<{
    tagName: string;
  }>;
}

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
  const { getColor, getTypography } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedVariantId, setSelectedVariantId] = useState('variant_1');
  const { addToCart, increment, decrement, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = `vendor_${vendor.shopId}`;

  // Get current cart
  const cart = carts[cartId];

  // Get current quantity for this product
  const currentQuantity = cart?.products[product.sku]?.quantity || 0;

  // Create mock variants based on numberOfVariants
  const mockVariants = [
    { id: 'variant_1', name: 'Weight', value: '75 gms' },
    { id: 'variant_2', name: 'Weight', value: '100 gms' },
    { id: 'variant_3', name: 'Weight', value: '150 gms' },
  ].slice(0, product.numberOfVariants);

  // Cart handlers
  const handleAddToCart = () => {
    addToCart(cartId, {
      sku: product.sku,
      shopId: vendor.shopId,
      name: product.name,
      price: product.sellingPrice,
      mrp: product.mrp,
      image: product.imageUrl,
    });
  };

  const handleIncrement = () => {
    increment(cartId, product.sku);
  };

  const handleDecrement = () => {
    decrement(cartId, product.sku);
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
      top: getResponsiveValue(16, 20, 24),
      right: getResponsiveValue(16, 20, 24),
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
  });

  const handleAddToStacks = () => {
    // Add to stacks functionality
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const handleProductInfoPress = () => {
    // Product info functionality
  };

  const handleSuggestedItemPress = (_item: SuggestedItem) => {
    // Handle suggested item press - could open product detail modal for this item
  };

  const handleSuggestedItemAdd = (item: SuggestedItem) => {
    // Add suggested item to cart
    const cartProduct = {
      sku: item.id,
      shopId: vendor.shopId,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      image: item.image,
    };
    addToCart(cartId, cartProduct);
  };

  const handleSuggestedItemIncrement = (item: SuggestedItem) => {
    increment(cartId, item.id);
  };

  const handleSuggestedItemDecrement = (item: SuggestedItem) => {
    decrement(cartId, item.id);
  };

  const handleViewAllPress = () => {
    // View all suggested items
  };

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
            <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
          </TouchableOpacity>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.mainCard}>
              <ProductImageCarousel
                imageUrl={product.imageUrl}
                productName={product.name}
                onAddToStacks={handleAddToStacks}
              />

              <ProductInfo
                productName={product.name}
                variants={mockVariants}
                selectedVariantId={selectedVariantId}
                onVariantSelect={handleVariantSelect}
                onProductInfoPress={handleProductInfoPress}
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
              <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>
              <Text style={styles.sellingPriceText}>₹{product.sellingPrice}</Text>
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
