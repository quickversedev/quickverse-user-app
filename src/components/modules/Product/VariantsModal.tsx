import React, { useEffect } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../../contexts/login/AuthProvider';
import { useVariants } from '../../../hooks/useVariants';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import SectionDivider from '../../common/SectionDivider';
import { ThemeText } from '../../common/theme/ThemeText';
import VariantsModalSkeleton from '../Vendor/VariantsModalSkeleton';
import AddButton from './AddButton';
import QuantitySelector from './QuantitySelector';

const { height } = Dimensions.get('window');

interface VariantsModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  vendor: Vendor;
  onVariantSelect?: (variant: Product) => void;
}

const VariantsModal: React.FC<VariantsModalProps> = ({
  visible,
  onClose,
  product,
  vendor,
  onVariantSelect,
}) => {
  const { getColor, theme } = useTheme();
  const { authData } = useAuth();
  const { variants, loading, error, hasData, fetchVariants, clearError, reset } = useVariants();
  const { addToCart, increment, decrement, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = `vendor_${vendor.shopId}`;
  const cart = carts[cartId];

  useEffect(() => {
    if (visible && product.primarySKU) {
      fetchVariants(product.primarySKU);
    }
  }, [visible, product.primarySKU, fetchVariants]);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const _handleVariantSelect = (variant: Product) => {
    if (onVariantSelect) {
      onVariantSelect(variant);
    }
  };

  const handleAddToCart = (variant: Product) => {
    if (!authData?.jwt) return;
    addToCart(
      cartId,
      {
        sku: variant.sku,
        shopId: vendor.shopId,
        name: variant.name,
        price: variant.sellingPrice,
        mrp: variant.mrp,
        image: product.imageUrl || '',
        veg: product.veg,
      },
      authData.jwt,
      authData.phone
    );
  };

  const handleIncrement = (variantId: string) => {
    if (!authData?.jwt) return;
    increment(cartId, variantId, authData.jwt, authData.phone);
  };

  const handleDecrement = (variantId: string) => {
    if (!authData?.jwt) return;
    decrement(cartId, variantId, authData.jwt, authData.phone);
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 3,
    },
    content: {
      paddingHorizontal: 20,
    },
    productName: {
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
      shadowOffset: { width: 0, height: 2 },
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
      color: getColor('text'),
      marginBottom: 4,
    },
    variantPrice: {
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
      color: getColor('text'),
      marginRight: 8,
    },
    originalPrice: {
      color: getColor('subText'),
      textDecorationLine: 'line-through',
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      color: getColor('error'),
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
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: getColor('subText'),
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
      return <VariantsModalSkeleton variantCount={3} />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <ThemeText variant="body" color={getColor('error')} style={styles.errorText}>
            {error}
          </ThemeText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <ThemeText variant="body" color={getColor('white')} style={styles.retryButtonText}>
              Retry
            </ThemeText>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasData) {
      return (
        <View style={styles.emptyContainer}>
          <ThemeText variant="body" color={getColor('subText')} style={styles.emptyText}>
            No variants available
          </ThemeText>
        </View>
      );
    }

    return variants.map((variant, index) => {
      const quantity = getVariantQuantity(variant.sku);

      return (
        <View key={variant.sku || `variant-${index}`} style={styles.variantItem}>
          <View style={styles.variantImage} />
          <View style={styles.variantInfo}>
            <ThemeText variant="body" color={getColor('text')} style={styles.variantName}>
              {variant.name}
            </ThemeText>
            <View style={styles.variantPriceContainer}>
              <ThemeText variant="body" color={getColor('text')} style={styles.currentPrice}>
                ₹{variant.sellingPrice}
              </ThemeText>
              {variant.sellingPrice !== variant.mrp && (
                <ThemeText
                  variant="caption"
                  color={getColor('subText')}
                  style={styles.originalPrice}
                >
                  ₹{variant.mrp}
                </ThemeText>
              )}
            </View>
          </View>
          <View style={styles.variantRightContainer}>
            {quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrement={() => handleIncrement(variant.sku)}
                onDecrement={() => handleDecrement(variant.sku)}
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
            <ThemeText variant="h2" color={getColor('text')} style={styles.productName}>
              {product.name}
            </ThemeText>

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
