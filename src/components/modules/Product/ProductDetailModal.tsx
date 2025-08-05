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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import ProductImageCarousel from './ProductImageCarousel';
import ProductInfo from './ProductInfo';
import SuggestedItems from './SuggestedItems';

const { height } = Dimensions.get('window');

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
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.95,
      minHeight: height * 0.8,
      // marginBottom: 20,
      // height: height * 0.9,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: getColor('border'),
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      // marginBottom: 8,
    },
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 10,
      backgroundColor: getColor('card'),
      borderRadius: 20,
      width: 40,
      height: 40,
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
      paddingBottom: 80, // Space for fixed bottom bar
    },
    mainCard: {
      backgroundColor: getColor('background'),
      // margin: 16,
      borderRadius: 16,
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceContainer: {
      flex: 1,
    },
    mrpText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textDecorationLine: 'line-through',
      marginBottom: 2,
    },
    sellingPriceText: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
    },
    addButtonContainer: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    addButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityButton: {
      backgroundColor: getColor('primary'),
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      marginHorizontal: 16,
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

  const handleSuggestedItemPress = (item: SuggestedItem) => {
    // Handle suggested item press - could open product detail modal for this item
    console.log('Suggested item pressed:', item);
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
      presentationStyle="pageSheet"
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

            {currentQuantity === 0 ? (
              <TouchableOpacity style={styles.addButtonContainer} onPress={handleAddToCart}>
                <Text style={styles.addButtonText}>ADD +</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityContainer}>
                <TouchableOpacity style={styles.quantityButton} onPress={handleDecrement}>
                  <MaterialCommunityIcons name="minus" size={20} color={getColor('white')} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{currentQuantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={handleIncrement}>
                  <MaterialCommunityIcons name="plus" size={20} color={getColor('white')} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProductDetailModal;
