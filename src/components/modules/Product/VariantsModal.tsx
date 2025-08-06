import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../../assets/mock/products';
import { useVariants } from '../../../hooks/useVariants';
import { Variant } from '../../../services/api/variantsService';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import SectionDivider from '../../common/SectionDivider';
import AddButton from './AddButton';
import QuantitySelector from './QuantitySelector';

const { height } = Dimensions.get('window');

interface VariantsModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  vendor: Vendor;
  onVariantSelect?: (variant: Variant) => void;
}

const VariantsModal: React.FC<VariantsModalProps> = ({
  visible,
  onClose,
  product,
  vendor,
  onVariantSelect,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { variants, loading, error, hasData, fetchVariants, clearError, reset } = useVariants();
  const { addToCart, increment, decrement, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = `vendor_${vendor.shopId}`;
  const cart = carts[cartId];

  useEffect(() => {
    if (visible && product.sku) {
      fetchVariants(product.sku);
    }
  }, [visible, product.sku, fetchVariants]);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const _handleVariantSelect = (variant: Variant) => {
    if (onVariantSelect) {
      onVariantSelect(variant);
    }
  };

  const handleAddToCart = (variant: Variant) => {
    addToCart(cartId, {
      sku: variant.id,
      shopId: vendor.shopId,
      name: variant.name,
      price: variant.price,
      mrp: variant.mrp,
      image: product.imageUrl,
    });
  };

  const handleIncrement = (variantId: string) => {
    increment(cartId, variantId);
  };

  const handleDecrement = (variantId: string) => {
    decrement(cartId, variantId);
  };

  const getVariantQuantity = (variantId: string) => {
    return cart?.products[variantId]?.quantity || 0;
  };

  const handleRetry = () => {
    if (product.sku) {
      clearError();
      fetchVariants(product.sku);
    }
  };

  const handleModalPress = (event: GestureResponderEvent) => {
    // Close modal when clicking on overlay
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

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
      maxHeight: height * 0.85,
      paddingBottom: 20,
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
      paddingHorizontal: 20,
    },
    productName: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'left',
      marginTop: 20,
      // marginBottom: 24,
    },
    sectionDivider: {
      marginVertical: 16,
    },
    variantsContainer: {
      marginTop: 8,
    },
    variantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 8,
      marginBottom: 12,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 2,
    },
    variantImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: getColor('border'),
      marginRight: 16,
    },
    variantInfo: {
      flex: 1,
    },
    variantName: {
      fontSize: getTypography('body'),
      fontWeight: '500',
      color: getColor('text'),
      marginBottom: 4,
    },
    variantPrice: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
    },
    variantRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 40,
    },
    variantPriceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    currentPrice: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginRight: 8,
    },
    originalPrice: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textDecorationLine: 'line-through',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginTop: 12,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('body'),
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      textAlign: 'center',
    },
    bottomIndicator: {
      width: 40,
      height: 4,
      backgroundColor: getColor('white'),
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 20,
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getColor('primary')} />
          <Text style={styles.loadingText}>Loading variants...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No variants available</Text>
        </View>
      );
    }

    return variants.map(variant => {
      const quantity = getVariantQuantity(variant.id);

      return (
        <View key={variant.id} style={styles.variantItem}>
          <View style={styles.variantImage} />
          <View style={styles.variantInfo}>
            <Text style={styles.variantName}>{variant.name}</Text>
            <View style={styles.variantPriceContainer}>
              <Text style={styles.currentPrice}>₹{variant.price}</Text>
              <Text style={styles.originalPrice}>₹{variant.mrp}</Text>
            </View>
          </View>
          <View style={styles.variantRightContainer}>
            {quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrement={() => handleIncrement(variant.id)}
                onDecrement={() => handleDecrement(variant.id)}
                size="regular"
              />
            ) : (
              <AddButton onPress={() => handleAddToCart(variant)} size="regular" />
            )}
          </View>
        </View>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // presentationStyle="pageSheet"
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={handleModalPress} activeOpacity={1}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
          </TouchableOpacity>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.productName}>{product.name}</Text>

            <View style={styles.sectionDivider}>
              <SectionDivider text="SELECT UNIT" fontSize={16} />
            </View>

            <View style={styles.variantsContainer}>{renderContent()}</View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default VariantsModal;
